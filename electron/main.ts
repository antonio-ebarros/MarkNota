import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import pkg from '../package.json';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

type LocaleCode = 'pt' | 'en' | 'zh';
type SpellcheckMode = 'pt-en' | 'pt' | 'en' | 'off';

interface DialogStrings {
  openTitle: string;
  filterMdAndText: string;
  filterMd: string;
  filterText: string;
  filterAll: string;
  saveTitle: string;
  saveAsTitle: string;
  defaultFileName: string;
  unsavedQuestion: (name: string) => string;
  btnSave: string;
  btnDontSave: string;
  btnCancel: string;
}

const DIALOG_STRINGS: Record<LocaleCode, DialogStrings> = {
  pt: {
    openTitle: 'Abrir arquivo',
    filterMdAndText: 'Markdown e Texto',
    filterMd: 'Markdown (*.md)',
    filterText: 'Texto simples (*.txt)',
    filterAll: 'Todos os arquivos',
    saveTitle: 'Salvar arquivo',
    saveAsTitle: 'Salvar como',
    defaultFileName: 'sem-titulo.md',
    unsavedQuestion: (name) => `Deseja salvar as alterações em "${name}"?`,
    btnSave: 'Salvar',
    btnDontSave: 'Não salvar',
    btnCancel: 'Cancelar'
  },
  en: {
    openTitle: 'Open file',
    filterMdAndText: 'Markdown and Text',
    filterMd: 'Markdown (*.md)',
    filterText: 'Plain text (*.txt)',
    filterAll: 'All files',
    saveTitle: 'Save file',
    saveAsTitle: 'Save as',
    defaultFileName: 'untitled.md',
    unsavedQuestion: (name) => `Do you want to save changes to "${name}"?`,
    btnSave: 'Save',
    btnDontSave: "Don't save",
    btnCancel: 'Cancel'
  },
  zh: {
    openTitle: '打开文件',
    filterMdAndText: 'Markdown 与文本',
    filterMd: 'Markdown (*.md)',
    filterText: '纯文本 (*.txt)',
    filterAll: '所有文件',
    saveTitle: '保存文件',
    saveAsTitle: '另存为',
    defaultFileName: '无标题.md',
    unsavedQuestion: (name) => `是否保存对“${name}”的更改？`,
    btnSave: '保存',
    btnDontSave: '不保存',
    btnCancel: '取消'
  }
};

let mainWindow: BrowserWindow | null = null;
let blurEnabled = true;
let currentLocale: LocaleCode = 'pt';

function detectInitialLocale(): LocaleCode {
  try {
    const raw = (app.getLocale() || 'pt').toLowerCase();
    if (raw.startsWith('zh')) return 'zh';
    if (raw.startsWith('en')) return 'en';
    if (raw.startsWith('pt')) return 'pt';
    return 'en';
  } catch {
    return 'pt';
  }
}

/**
 * Copia os dicionários Hunspell locais (pt-BR e en-US) embutidos em assets/dictionaries
 * para a pasta Dictionaries do Electron caso ainda não existam, garantindo corretor 100% offline.
 */
async function ensureLocalDictionaries(): Promise<void> {
  if (process.platform === 'win32') return; // Windows usa a API nativa de spellcheck do sistema
  try {
    const srcDir = path.join(__dirname, '../assets/dictionaries');
    const destDir = path.join(app.getPath('userData'), 'Dictionaries');
    await fs.mkdir(destDir, { recursive: true });
    const files = ['pt-BR-3-0.bdic', 'en-US-10-1.bdic'];
    for (const file of files) {
      const destFile = path.join(destDir, file);
      try {
        await fs.access(destFile);
      } catch {
        const srcFile = path.join(srcDir, file);
        await fs.copyFile(srcFile, destFile);
      }
    }
  } catch {
    // Ignore errors if bundled dictionaries are unavailable
  }
}

function applySpellcheckToWindow(win: BrowserWindow, mode: SpellcheckMode): void {
  try {
    const ses = win.webContents.session;
    if (mode === 'off') {
      ses.setSpellCheckerEnabled(false);
      return;
    }
    ses.setSpellCheckerEnabled(true);
    const langs =
      mode === 'pt' ? ['pt-BR'] : mode === 'en' ? ['en-US'] : ['pt-BR', 'en-US'];
    ses.setSpellCheckerLanguages(langs);
  } catch {
    // Ignore
  }
}

function applySystemBlur(win: BrowserWindow, enable: boolean): void {
  if (process.platform === 'win32') {
    try {
      win.setBackgroundMaterial(enable ? 'acrylic' : 'none');
    } catch {
      try {
        win.setBackgroundMaterial(enable ? 'mica' : 'none');
      } catch {
        // Ignore on older Windows builds
      }
    }
    return;
  }

  if (process.platform !== 'linux') return;
  try {
    const handle = win.getNativeWindowHandle();
    if (!handle || handle.length < 4) return;
    const xid = handle.readUInt32LE(0);
    if (!xid) return;

    const args = enable
      ? ['-id', String(xid), '-f', '_KDE_NET_WM_BLUR_BEHIND_REGION', '32c', '-set', '_KDE_NET_WM_BLUR_BEHIND_REGION', '0']
      : ['-id', String(xid), '-remove', '_KDE_NET_WM_BLUR_BEHIND_REGION'];

    execFile('xprop', args, () => {
      // Ignore errors on non-X11 or non-KWin environments
    });
  } catch {
    // Ignore
  }
}

function isAllowedAppUrl(targetUrl: string): boolean {
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl && targetUrl.startsWith(devUrl)) {
    return true;
  }
  return targetUrl.startsWith('file://');
}

function createWindow(): void {
  const isWin = process.platform === 'win32';
  const iconFile = isWin ? '../assets/icon.ico' : '../assets/icon-256.png';

  mainWindow = new BrowserWindow({
    width: 980,
    height: 680,
    minWidth: 520,
    minHeight: 380,
    title: 'MarkNota',
    icon: path.join(__dirname, iconFile),
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    ...(isWin ? { backgroundMaterial: 'acrylic' as const } : {}),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: true
    }
  });

  applySpellcheckToWindow(mainWindow, 'pt-en');

  // Security: block opening new Electron windows or navigating away from app
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedAppUrl(url)) {
      event.preventDefault();
    }
  });

  // Envia sugestões de correção ortográfica e estado para o menu de contexto em vidro fosco
  mainWindow.webContents.on('context-menu', (_event, params) => {
    mainWindow?.webContents.send('window:context-menu', {
      x: params.x,
      y: params.y,
      misspelledWord: params.misspelledWord || '',
      suggestions: (params.dictionarySuggestions || []).slice(0, 5),
      isEditable: params.isEditable,
      selectionText: params.selectionText || ''
    });
  });

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow) return;
    mainWindow.show();
    applySystemBlur(mainWindow, blurEnabled);
  });

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized-changed', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized-changed', false);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  currentLocale = detectInitialLocale();
  await ensureLocalDictionaries();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Window controls
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (!mainWindow) return false;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return false;
  } else {
    mainWindow.maximize();
    return true;
  }
});
ipcMain.handle('window:close', () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);

ipcMain.handle('window:setBlur', (_event, enabled: boolean) => {
  blurEnabled = Boolean(enabled);
  if (mainWindow) {
    applySystemBlur(mainWindow, blurEnabled);
  }
  return blurEnabled;
});

ipcMain.handle('app:setLocale', (_event, locale: unknown) => {
  if (locale === 'pt' || locale === 'en' || locale === 'zh') {
    currentLocale = locale;
  }
  return currentLocale;
});

ipcMain.handle('spell:setMode', (_event, mode: unknown) => {
  if (mode === 'pt-en' || mode === 'pt' || mode === 'en' || mode === 'off') {
    if (mainWindow) {
      applySpellcheckToWindow(mainWindow, mode);
    }
    return true;
  }
  return false;
});

ipcMain.handle('spell:replace', (_event, word: unknown) => {
  if (mainWindow && typeof word === 'string' && word.trim()) {
    mainWindow.webContents.replaceMisspelling(word);
  }
});

ipcMain.handle('spell:addWord', (_event, word: unknown) => {
  if (mainWindow && typeof word === 'string' && word.trim()) {
    return mainWindow.webContents.session.addWordToSpellCheckerDictionary(word.trim());
  }
  return false;
});

async function readSafeTextFile(filePath: string): Promise<{ filePath: string; name: string; content: string }> {
  const resolved = path.resolve(filePath);
  const stat = await fs.stat(resolved);
  if (!stat.isFile()) {
    throw new Error('O caminho selecionado não é um arquivo.');
  }
  if (stat.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Arquivo excede o limite de 10 MB.');
  }
  const content = await fs.readFile(resolved, 'utf-8');
  return {
    filePath: resolved,
    name: path.basename(resolved),
    content
  };
}

// Última pasta usada em Abrir/Salvar (apenas durante a sessão)
let lastUsedDir: string | null = null;

function rememberDir(filePath: string): void {
  lastUsedDir = path.dirname(filePath);
}

async function dirExists(dir: string): Promise<boolean> {
  try {
    return (await fs.stat(dir)).isDirectory();
  } catch {
    return false;
  }
}

/** Pasta padrão: última usada → Documentos → home. */
async function getDefaultDir(): Promise<string> {
  if (lastUsedDir && (await dirExists(lastUsedDir))) return lastUsedDir;
  try {
    const docs = app.getPath('documents');
    if (await dirExists(docs)) return docs;
  } catch {
    // Ignore
  }
  return app.getPath('home');
}

async function getDefaultSavePath(fileName: string): Promise<string> {
  return path.join(await getDefaultDir(), path.basename(fileName));
}

// File operations
ipcMain.handle('file:open', async () => {
  if (!mainWindow) return null;
  const s = DIALOG_STRINGS[currentLocale];
  const result = await dialog.showOpenDialog(mainWindow, {
    title: s.openTitle,
    defaultPath: await getDefaultDir(),
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: s.filterMdAndText, extensions: ['md', 'markdown', 'txt'] },
      { name: s.filterMd, extensions: ['md', 'markdown'] },
      { name: s.filterText, extensions: ['txt'] },
      { name: s.filterAll, extensions: ['*'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) return null;
  rememberDir(result.filePaths[0]);

  return Promise.all(result.filePaths.map((fp) => readSafeTextFile(fp)));
});

ipcMain.handle('file:read', async (_event, filePath: unknown) => {
  if (typeof filePath !== 'string' || !filePath.trim()) {
    throw new Error('Caminho de arquivo inválido.');
  }
  return readSafeTextFile(filePath);
});

ipcMain.handle('app:getInitialFiles', async () => {
  const args = process.argv.slice(app.isPackaged ? 1 : 2);
  const opened: Array<{ filePath: string; name: string; content: string }> = [];
  for (const arg of args) {
    if (!arg || arg.startsWith('-')) continue;
    try {
      opened.push(await readSafeTextFile(arg));
    } catch {
      // Ignore invalid or non-file arguments
    }
  }
  return opened;
});

ipcMain.handle('file:save', async (_event, payload: unknown) => {
  if (!mainWindow || typeof payload !== 'object' || payload === null) return null;
  const data = payload as { filePath?: unknown; defaultName?: unknown; content?: unknown };
  if (typeof data.content !== 'string') {
    throw new Error('Conteúdo inválido para salvar.');
  }

  const s = DIALOG_STRINGS[currentLocale];
  let targetPath = typeof data.filePath === 'string' && data.filePath.trim() ? path.resolve(data.filePath) : null;
  if (!targetPath) {
    const defaultName = typeof data.defaultName === 'string' && data.defaultName.trim() ? data.defaultName : s.defaultFileName;
    const result = await dialog.showSaveDialog(mainWindow, {
      title: s.saveTitle,
      defaultPath: await getDefaultSavePath(defaultName),
      filters: [
        { name: s.filterMd, extensions: ['md'] },
        { name: s.filterText, extensions: ['txt'] },
        { name: s.filterAll, extensions: ['*'] }
      ]
    });
    if (result.canceled || !result.filePath) return null;
    targetPath = result.filePath;
  }

  await fs.writeFile(targetPath, data.content, 'utf-8');
  rememberDir(targetPath);
  return {
    filePath: targetPath,
    name: path.basename(targetPath)
  };
});

ipcMain.handle('file:saveAs', async (_event, payload: unknown) => {
  if (!mainWindow || typeof payload !== 'object' || payload === null) return null;
  const data = payload as { defaultName?: unknown; content?: unknown };
  if (typeof data.content !== 'string') {
    throw new Error('Conteúdo inválido para salvar.');
  }

  const s = DIALOG_STRINGS[currentLocale];
  const defaultName = typeof data.defaultName === 'string' && data.defaultName.trim() ? data.defaultName : s.defaultFileName;
  const result = await dialog.showSaveDialog(mainWindow, {
    title: s.saveAsTitle,
    defaultPath: await getDefaultSavePath(defaultName),
    filters: [
      { name: s.filterMd, extensions: ['md'] },
      { name: s.filterText, extensions: ['txt'] },
      { name: s.filterAll, extensions: ['*'] }
    ]
  });
  if (result.canceled || !result.filePath) return null;

  await fs.writeFile(result.filePath, data.content, 'utf-8');
  rememberDir(result.filePath);
  return {
    filePath: result.filePath,
    name: path.basename(result.filePath)
  };
});

ipcMain.handle('dialog:confirmUnsaved', async (_event, fileName: unknown) => {
  if (!mainWindow) return 'cancel';
  const s = DIALOG_STRINGS[currentLocale];
  const safeName = typeof fileName === 'string' && fileName.trim() ? fileName : s.defaultFileName;
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    title: 'MarkNota',
    message: s.unsavedQuestion(safeName),
    buttons: [s.btnSave, s.btnDontSave, s.btnCancel],
    defaultId: 0,
    cancelId: 2
  });
  if (result.response === 0) return 'save';
  if (result.response === 1) return 'discard';
  return 'cancel';
});

ipcMain.handle('fonts:list', async () => {
  if (process.platform === 'win32') {
    return new Promise<string[]>((resolve) => {
      execFile(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Add-Type -AssemblyName System.Drawing; (New-Object System.Drawing.Text.InstalledFontCollection).Families.Name'
        ],
        { maxBuffer: 4 * 1024 * 1024 },
        (err, stdout) => {
          if (err || !stdout) {
            resolve([]);
            return;
          }
          const set = new Set<string>();
          for (const line of stdout.split(/\r?\n/)) {
            const name = line.trim();
            if (name && !name.startsWith('@')) {
              set.add(name);
            }
          }
          resolve(Array.from(set).sort((a, b) => a.localeCompare(b)));
        }
      );
    });
  }

  if (process.platform !== 'linux') {
    return [];
  }
  return new Promise<string[]>((resolve) => {
    execFile('fc-list', [':', 'family'], { maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => {
      if (err || !stdout) {
        resolve([]);
        return;
      }
      const set = new Set<string>();
      for (const line of stdout.split('\n')) {
        for (const part of line.split(',')) {
          const name = part.trim();
          if (name && !name.startsWith('.')) {
            set.add(name);
          }
        }
      }
      resolve(Array.from(set).sort((a, b) => a.localeCompare(b)));
    });
  });
});

// Ações de edição nativas (usadas pelo menu de contexto). Passam pelos
// handlers do editor, então copiar/colar respeita o Markdown.
const EDIT_ACTIONS = ['copy', 'cut', 'paste', 'selectAll'] as const;
type EditAction = (typeof EDIT_ACTIONS)[number];
ipcMain.handle('edit:run', (_event, action: unknown) => {
  if (!mainWindow || !EDIT_ACTIONS.includes(action as EditAction)) return;
  const wc = mainWindow.webContents;
  switch (action as EditAction) {
    case 'copy': wc.copy(); break;
    case 'cut': wc.cut(); break;
    case 'paste': wc.paste(); break;
    case 'selectAll': wc.selectAll(); break;
  }
});

ipcMain.handle('app:getInfo', () => ({
  name: 'MarkNota',
  version: pkg.version,
  author: 'Antonio E. Barros',
  repository: 'https://github.com/antonio-ebarros/MarkNota',
  platform: process.platform,
  electron: process.versions.electron,
  systemLocale: app.getLocale()
}));

ipcMain.handle('shell:openExternal', (_event, url: unknown) => {
  if (typeof url !== 'string') return;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return shell.openExternal(parsed.toString());
    }
  } catch {
    // Ignore invalid URLs
  }
});
