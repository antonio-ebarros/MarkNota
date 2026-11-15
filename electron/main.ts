import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

let mainWindow: BrowserWindow | null = null;
let blurEnabled = true;

function applyKdeBlur(win: BrowserWindow, enable: boolean): void {
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

  mainWindow = new BrowserWindow({
    width: 980,
    height: 680,
    minWidth: 520,
    minHeight: 380,
    title: 'MarkNota',
    icon: path.join(__dirname, '../assets/icon-256.png'),
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    ...(isWin ? { backgroundMaterial: 'mica' as const } : {}),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  // Security: block opening new Electron windows or navigating away from app
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedAppUrl(url)) {
      event.preventDefault();
    }
  });

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow) return;
    mainWindow.show();
    applyKdeBlur(mainWindow, blurEnabled);
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

app.whenReady().then(() => {
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
    applyKdeBlur(mainWindow, blurEnabled);
  }
  return blurEnabled;
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

// File operations
ipcMain.handle('file:open', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Abrir arquivo',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Markdown e Texto', extensions: ['md', 'markdown', 'txt'] },
      { name: 'Markdown', extensions: ['md', 'markdown'] },
      { name: 'Texto simples', extensions: ['txt'] },
      { name: 'Todos os arquivos', extensions: ['*'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) return null;

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

  let targetPath = typeof data.filePath === 'string' && data.filePath.trim() ? path.resolve(data.filePath) : null;
  if (!targetPath) {
    const defaultName = typeof data.defaultName === 'string' && data.defaultName.trim() ? data.defaultName : 'sem-titulo.md';
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Salvar arquivo',
      defaultPath: defaultName,
      filters: [
        { name: 'Markdown (*.md)', extensions: ['md'] },
        { name: 'Texto simples (*.txt)', extensions: ['txt'] },
        { name: 'Todos os arquivos', extensions: ['*'] }
      ]
    });
    if (result.canceled || !result.filePath) return null;
    targetPath = result.filePath;
  }

  await fs.writeFile(targetPath, data.content, 'utf-8');
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

  const defaultName = typeof data.defaultName === 'string' && data.defaultName.trim() ? data.defaultName : 'sem-titulo.md';
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Salvar como',
    defaultPath: defaultName,
    filters: [
      { name: 'Markdown (*.md)', extensions: ['md'] },
      { name: 'Texto simples (*.txt)', extensions: ['txt'] },
      { name: 'Todos os arquivos', extensions: ['*'] }
    ]
  });
  if (result.canceled || !result.filePath) return null;

  await fs.writeFile(result.filePath, data.content, 'utf-8');
  return {
    filePath: result.filePath,
    name: path.basename(result.filePath)
  };
});

ipcMain.handle('dialog:confirmUnsaved', async (_event, fileName: unknown) => {
  if (!mainWindow) return 'cancel';
  const safeName = typeof fileName === 'string' && fileName.trim() ? fileName : 'sem título.md';
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    title: 'MarkNota',
    message: `Deseja salvar as alterações em "${safeName}"?`,
    buttons: ['Salvar', 'Não salvar', 'Cancelar'],
    defaultId: 0,
    cancelId: 2
  });
  if (result.response === 0) return 'save';
  if (result.response === 1) return 'discard';
  return 'cancel';
});

ipcMain.handle('fonts:list', async () => {
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
