import './style.css';
import type { Editor } from '@tiptap/core';
import { createMarkdownEditor, getEditorMarkdown } from './editor';
import { RECOMMENDED_FONTS, buildFontStack } from './fonts';
import type { AppSettings, TabDocument } from './types';

const SETTINGS_KEY = 'marknota.settings.v1';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  opacity: 78,
  blur: true,
  centered: true,
  fontFamily: 'Inter',
  fontSize: 16,
  lineHeight: 1.65,
  zoom: 1,
  showStatusBar: true
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

const settings: AppSettings = loadSettings();
const tabs: TabDocument[] = [];
let activeTabId = '';
let untitledCounter = 1;
let editor: Editor | null = null;
let isApplyingTabContent = false;
let systemFonts: string[] = [];

// DOM refs
const appShell = document.getElementById('app-shell')!;
const tabsContainer = document.getElementById('tabs-container')!;
const editorContainer = document.getElementById('editor-container')!;
const editorScroll = document.getElementById('editor-scroll')!;
const statusBar = document.getElementById('statusbar')!;
const statusCursor = document.getElementById('status-cursor')!;
const statusCounts = document.getElementById('status-counts')!;
const statusZoom = document.getElementById('status-zoom')!;
const statusFormat = document.getElementById('status-format')!;

const fontPopover = document.getElementById('font-popover')!;
const appearancePopover = document.getElementById('appearance-popover')!;
const btnFontPicker = document.getElementById('btn-font-picker')!;
const btnAppearance = document.getElementById('btn-appearance')!;
const currentFontLabel = document.getElementById('current-font-label')!;

const fontSearchInput = document.getElementById('font-search') as HTMLInputElement;
const recommendedFontsEl = document.getElementById('recommended-fonts')!;
const fontListEl = document.getElementById('font-list')!;
const fontSizeRange = document.getElementById('font-size-range') as HTMLInputElement;
const fontSizeVal = document.getElementById('font-size-val')!;
const lineHeightRange = document.getElementById('line-height-range') as HTMLInputElement;
const lineHeightVal = document.getElementById('line-height-val')!;

const opacityRange = document.getElementById('opacity-range') as HTMLInputElement;
const opacityVal = document.getElementById('opacity-val')!;
const blurToggle = document.getElementById('blur-toggle') as HTMLInputElement;
const centeredToggle = document.getElementById('centered-toggle') as HTMLInputElement;
const themeDarkBtn = document.getElementById('theme-dark-btn')!;
const themeLightBtn = document.getElementById('theme-light-btn')!;

const findBar = document.getElementById('find-bar')!;
const findInput = document.getElementById('find-input') as HTMLInputElement;
const findCount = document.getElementById('find-count')!;

let findMatches: Array<{ from: number; to: number }> = [];
let findIndex = -1;

function getActiveTab(): TabDocument | undefined {
  return tabs.find((t) => t.id === activeTabId);
}

function applySettingsToDOM(): void {
  document.documentElement.setAttribute('data-theme', settings.theme);
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty('--bg-opacity', (settings.opacity / 100).toFixed(2));
  rootStyle.setProperty('--editor-font', buildFontStack(settings.fontFamily));
  rootStyle.setProperty('--editor-size', `${settings.fontSize}px`);
  rootStyle.setProperty('--editor-line-height', String(settings.lineHeight));
  rootStyle.setProperty('--editor-zoom', String(settings.zoom));

  editorScroll.classList.toggle('centered', settings.centered);
  statusBar.classList.toggle('hidden', !settings.showStatusBar);

  currentFontLabel.textContent = settings.fontFamily;
  fontSizeRange.value = String(settings.fontSize);
  fontSizeVal.textContent = `${settings.fontSize}px`;
  lineHeightRange.value = String(settings.lineHeight);
  lineHeightVal.textContent = settings.lineHeight.toFixed(2);

  opacityRange.value = String(settings.opacity);
  opacityVal.textContent = `${settings.opacity}%`;
  blurToggle.checked = settings.blur;
  centeredToggle.checked = settings.centered;
  themeDarkBtn.classList.toggle('active', settings.theme === 'dark');
  themeLightBtn.classList.toggle('active', settings.theme === 'light');

  statusZoom.textContent = `${Math.round(settings.zoom * 100)}%`;

  saveSettings(settings);
}

function renderTabs(): void {
  tabsContainer.innerHTML = '';
  for (const tab of tabs) {
    const el = document.createElement('div');
    el.className = `tab-item${tab.id === activeTabId ? ' active' : ''}`;
    el.setAttribute('role', 'tab');
    el.setAttribute('aria-selected', String(tab.id === activeTabId));
    el.title = tab.filePath || tab.title;

    const titleSpan = document.createElement('span');
    titleSpan.className = 'tab-title';
    titleSpan.textContent = tab.title;

    const meta = document.createElement('span');
    meta.className = 'tab-meta';

    if (tab.dirty) {
      const dot = document.createElement('span');
      dot.className = 'tab-dirty-dot';
      dot.title = 'Alterações não salvas';
      meta.appendChild(dot);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tab-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.title = 'Fechar aba (Ctrl+W)';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      void closeTab(tab.id);
    });
    meta.appendChild(closeBtn);

    el.appendChild(titleSpan);
    el.appendChild(meta);
    el.addEventListener('click', () => switchTab(tab.id));
    el.addEventListener('auxclick', (e) => {
      if (e.button === 1) {
        e.preventDefault();
        void closeTab(tab.id);
      }
    });

    tabsContainer.appendChild(el);
  }

  const active = getActiveTab();
  if (active) {
    statusFormat.textContent = active.filePath?.endsWith('.txt') ? 'Texto' : 'Markdown';
    document.title = `${active.dirty ? '● ' : ''}${active.title} — MarkNota`;
  }
}

function createNewTab(initial?: { title?: string; filePath?: string | null; content?: string }): TabDocument {
  const id = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const title = initial?.title ?? (untitledCounter === 1 ? 'sem título.md' : `sem título ${untitledCounter}.md`);
  if (!initial?.title) untitledCounter += 1;

  const content = initial?.content ?? '';
  const tab: TabDocument = {
    id,
    title,
    filePath: initial?.filePath ?? null,
    content,
    savedContent: content,
    dirty: false
  };
  tabs.push(tab);
  switchTab(id);
  return tab;
}

function switchTab(tabId: string): void {
  const target = tabs.find((t) => t.id === tabId);
  if (!target) return;

  activeTabId = tabId;
  if (editor) {
    isApplyingTabContent = true;
    editor.commands.setContent(target.content, false);
    isApplyingTabContent = false;
    editor.commands.focus('end');
  }
  renderTabs();
  if (!findBar.classList.contains('hidden')) {
    runFind();
  }
}

async function openFilesDialog(): Promise<void> {
  const files = await window.markNotaAPI.openFiles();
  if (!files || files.length === 0) return;

  for (const f of files) {
    openOrFocusFile(f.filePath, f.name, f.content);
  }
}

function openOrFocusFile(filePath: string, name: string, content: string): void {
  const existing = tabs.find((t) => t.filePath === filePath);
  if (existing) {
    switchTab(existing.id);
    return;
  }

  const active = getActiveTab();
  if (active && !active.filePath && !active.dirty && active.content.trim() === '') {
    active.filePath = filePath;
    active.title = name;
    active.content = content;
    active.savedContent = content;
    active.dirty = false;
    switchTab(active.id);
  } else {
    createNewTab({ title: name, filePath, content });
  }
}

async function saveTab(tab: TabDocument, forceSaveAs = false): Promise<boolean> {
  if (editor && tab.id === activeTabId) {
    tab.content = getEditorMarkdown(editor);
  }

  const saved = forceSaveAs
    ? await window.markNotaAPI.saveFileAs({ defaultName: tab.title, content: tab.content })
    : await window.markNotaAPI.saveFile({ filePath: tab.filePath, defaultName: tab.title, content: tab.content });

  if (!saved) return false;

  tab.filePath = saved.filePath;
  tab.title = saved.name;
  tab.savedContent = tab.content;
  tab.dirty = false;
  renderTabs();
  return true;
}

async function closeTab(tabId: string): Promise<boolean> {
  const idx = tabs.findIndex((t) => t.id === tabId);
  if (idx === -1) return true;

  const tab = tabs[idx];
  if (tab.dirty) {
    const choice = await window.markNotaAPI.confirmUnsaved(tab.title);
    if (choice === 'cancel') return false;
    if (choice === 'save') {
      const ok = await saveTab(tab, false);
      if (!ok) return false;
    }
  }

  tabs.splice(idx, 1);
  if (tabs.length === 0) {
    createNewTab();
    return true;
  }

  if (activeTabId === tabId) {
    const nextTab = tabs[Math.max(0, idx - 1)];
    switchTab(nextTab.id);
  } else {
    renderTabs();
  }
  return true;
}

async function handleCloseWindow(): Promise<void> {
  for (const tab of [...tabs]) {
    if (tab.dirty) {
      switchTab(tab.id);
      const choice = await window.markNotaAPI.confirmUnsaved(tab.title);
      if (choice === 'cancel') return;
      if (choice === 'save') {
        const ok = await saveTab(tab, false);
        if (!ok) return;
      }
    }
  }
  await window.markNotaAPI.closeWindow();
}

// ===== Font Picker =====
function renderFontPicker(): void {
  recommendedFontsEl.innerHTML = '';
  for (const font of RECOMMENDED_FONTS) {
    const chip = document.createElement('button');
    chip.className = `font-chip${settings.fontFamily === font.name ? ' active' : ''}`;
    chip.textContent = font.label;
    chip.style.fontFamily = font.stack;
    chip.addEventListener('click', () => selectFont(font.name));
    recommendedFontsEl.appendChild(chip);
  }

  renderFontList(fontSearchInput.value);
}

function renderFontList(filter: string): void {
  const query = filter.trim().toLowerCase();
  const baseList = systemFonts.length > 0 ? systemFonts : RECOMMENDED_FONTS.map((f) => f.name);
  const filtered = query ? baseList.filter((f) => f.toLowerCase().includes(query)) : baseList;

  fontListEl.innerHTML = '';
  for (const fontName of filtered.slice(0, 120)) {
    const btn = document.createElement('button');
    btn.className = `font-option${settings.fontFamily === fontName ? ' active' : ''}`;
    btn.textContent = fontName;
    btn.style.fontFamily = buildFontStack(fontName);
    btn.addEventListener('click', () => selectFont(fontName));
    fontListEl.appendChild(btn);
  }
}

function selectFont(fontName: string): void {
  settings.fontFamily = fontName;
  applySettingsToDOM();
  renderFontPicker();
}

// ===== Popovers & Menus =====
function closeAllMenusAndPopovers(): void {
  document.querySelectorAll('.menu-popup').forEach((el) => el.classList.add('hidden'));
  document.querySelectorAll('.menu-trigger').forEach((el) => el.classList.remove('open'));
  fontPopover.classList.add('hidden');
  appearancePopover.classList.add('hidden');
  btnFontPicker.classList.remove('active');
  btnAppearance.classList.remove('active');
}

function setupMenus(): void {
  document.querySelectorAll<HTMLButtonElement>('.menu-trigger').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const menuName = trigger.dataset.menu;
      const popup = document.getElementById(`menu-${menuName}`);
      if (!popup) return;
      const wasOpen = !popup.classList.contains('hidden');
      closeAllMenusAndPopovers();
      if (!wasOpen) {
        popup.classList.remove('hidden');
        trigger.classList.add('open');
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.menu-action').forEach((actionBtn) => {
    actionBtn.addEventListener('click', () => {
      const cmd = actionBtn.dataset.cmd;
      closeAllMenusAndPopovers();
      if (cmd) void executeCommand(cmd);
    });
  });

  btnFontPicker.addEventListener('click', (e) => {
    e.stopPropagation();
    const wasOpen = !fontPopover.classList.contains('hidden');
    closeAllMenusAndPopovers();
    if (!wasOpen) {
      renderFontPicker();
      fontPopover.classList.remove('hidden');
      btnFontPicker.classList.add('active');
      fontSearchInput.focus();
    }
  });

  btnAppearance.addEventListener('click', (e) => {
    e.stopPropagation();
    const wasOpen = !appearancePopover.classList.contains('hidden');
    closeAllMenusAndPopovers();
    if (!wasOpen) {
      appearancePopover.classList.remove('hidden');
      btnAppearance.classList.add('active');
    }
  });

  fontPopover.addEventListener('click', (e) => e.stopPropagation());
  appearancePopover.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', () => closeAllMenusAndPopovers());
}

// ===== Find Bar =====
function openFindBar(): void {
  findBar.classList.remove('hidden');
  findInput.focus();
  findInput.select();
  runFind();
}

function closeFindBar(): void {
  findBar.classList.add('hidden');
  editor?.commands.focus();
}

function runFind(): void {
  if (!editor) return;
  const query = findInput.value;
  findMatches = [];
  findIndex = -1;

  if (!query) {
    findCount.textContent = '0/0';
    return;
  }

  const lowerQuery = query.toLowerCase();
  editor.state.doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      const text = node.text.toLowerCase();
      let start = 0;
      while (true) {
        const idx = text.indexOf(lowerQuery, start);
        if (idx === -1) break;
        findMatches.push({ from: pos + idx, to: pos + idx + query.length });
        start = idx + query.length;
      }
    }
  });

  if (findMatches.length > 0) {
    jumpToMatch(0);
  } else {
    findCount.textContent = '0/0';
  }
}

function jumpToMatch(index: number): void {
  if (!editor || findMatches.length === 0) return;
  findIndex = ((index % findMatches.length) + findMatches.length) % findMatches.length;
  const match = findMatches[findIndex];
  editor.commands.setTextSelection({ from: match.from, to: match.to });
  editor.commands.scrollIntoView();
  findCount.textContent = `${findIndex + 1}/${findMatches.length}`;
}

async function executeCommand(cmd: string): Promise<void> {
  const active = getActiveTab();
  switch (cmd) {
    case 'new-tab':
      createNewTab();
      break;
    case 'open':
      await openFilesDialog();
      break;
    case 'save':
      if (active) await saveTab(active, false);
      break;
    case 'save-as':
      if (active) await saveTab(active, true);
      break;
    case 'close-tab':
      if (active) await closeTab(active.id);
      break;
    case 'exit':
      await handleCloseWindow();
      break;
    case 'undo':
      editor?.commands.undo();
      break;
    case 'redo':
      editor?.commands.redo();
      break;
    case 'find':
      openFindBar();
      break;
    case 'md-h1':
      editor?.chain().focus().toggleHeading({ level: 1 }).run();
      break;
    case 'md-bold':
      editor?.chain().focus().toggleBold().run();
      break;
    case 'md-italic':
      editor?.chain().focus().toggleItalic().run();
      break;
    case 'md-task':
      editor?.chain().focus().toggleTaskList().run();
      break;
    case 'md-code':
      editor?.chain().focus().toggleCodeBlock().run();
      break;
    case 'zoom-in':
      settings.zoom = Math.min(2, Number((settings.zoom + 0.1).toFixed(2)));
      applySettingsToDOM();
      break;
    case 'zoom-out':
      settings.zoom = Math.max(0.6, Number((settings.zoom - 0.1).toFixed(2)));
      applySettingsToDOM();
      break;
    case 'zoom-reset':
      settings.zoom = 1;
      applySettingsToDOM();
      break;
    case 'toggle-statusbar':
      settings.showStatusBar = !settings.showStatusBar;
      applySettingsToDOM();
      break;
    case 'toggle-centered':
      settings.centered = !settings.centered;
      applySettingsToDOM();
      break;
    case 'toggle-theme':
      settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
      applySettingsToDOM();
      break;
  }
}

function setupKeyboardShortcuts(): void {
  window.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    if (e.key === 'Escape') {
      closeAllMenusAndPopovers();
      if (!findBar.classList.contains('hidden')) closeFindBar();
      return;
    }

    if (!ctrl) return;

    if (key === 't' || key === 'n') {
      e.preventDefault();
      void executeCommand('new-tab');
    } else if (key === 'o') {
      e.preventDefault();
      void executeCommand('open');
    } else if (key === 's' && e.shiftKey) {
      e.preventDefault();
      void executeCommand('save-as');
    } else if (key === 's') {
      e.preventDefault();
      void executeCommand('save');
    } else if (key === 'w') {
      e.preventDefault();
      void executeCommand('close-tab');
    } else if (key === 'f') {
      e.preventDefault();
      void executeCommand('find');
    } else if (e.key === '=' || e.key === '+') {
      e.preventDefault();
      void executeCommand('zoom-in');
    } else if (e.key === '-') {
      e.preventDefault();
      void executeCommand('zoom-out');
    } else if (e.key === '0') {
      e.preventDefault();
      void executeCommand('zoom-reset');
    }
  });
}

function setupControls(): void {
  document.getElementById('btn-new-tab')!.addEventListener('click', () => createNewTab());
  document.getElementById('win-min')!.addEventListener('click', () => window.markNotaAPI.minimizeWindow());
  document.getElementById('win-max')!.addEventListener('click', () => window.markNotaAPI.maximizeWindow());
  document.getElementById('win-close')!.addEventListener('click', () => void handleCloseWindow());

  window.markNotaAPI.onMaximizedChanged((isMax) => {
    appShell.classList.toggle('maximized', isMax);
  });
  void window.markNotaAPI.isMaximized().then((isMax) => {
    appShell.classList.toggle('maximized', isMax);
  });

  // Font controls
  fontSearchInput.addEventListener('input', () => renderFontList(fontSearchInput.value));
  fontSizeRange.addEventListener('input', () => {
    settings.fontSize = Number(fontSizeRange.value);
    applySettingsToDOM();
  });
  document.getElementById('font-size-dec')!.addEventListener('click', () => {
    settings.fontSize = Math.max(12, settings.fontSize - 1);
    applySettingsToDOM();
  });
  document.getElementById('font-size-inc')!.addEventListener('click', () => {
    settings.fontSize = Math.min(28, settings.fontSize + 1);
    applySettingsToDOM();
  });
  lineHeightRange.addEventListener('input', () => {
    settings.lineHeight = Number(lineHeightRange.value);
    applySettingsToDOM();
  });
  document.getElementById('btn-reset-font')!.addEventListener('click', () => {
    settings.fontFamily = DEFAULT_SETTINGS.fontFamily;
    settings.fontSize = DEFAULT_SETTINGS.fontSize;
    settings.lineHeight = DEFAULT_SETTINGS.lineHeight;
    applySettingsToDOM();
    renderFontPicker();
  });

  // Appearance controls
  themeDarkBtn.addEventListener('click', () => {
    settings.theme = 'dark';
    applySettingsToDOM();
  });
  themeLightBtn.addEventListener('click', () => {
    settings.theme = 'light';
    applySettingsToDOM();
  });
  opacityRange.addEventListener('input', () => {
    settings.opacity = Number(opacityRange.value);
    applySettingsToDOM();
  });
  blurToggle.addEventListener('change', () => {
    settings.blur = blurToggle.checked;
    applySettingsToDOM();
    void window.markNotaAPI.setBlur(settings.blur);
  });
  centeredToggle.addEventListener('change', () => {
    settings.centered = centeredToggle.checked;
    applySettingsToDOM();
  });

  // Find bar controls
  findInput.addEventListener('input', () => runFind());
  findInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      jumpToMatch(e.shiftKey ? findIndex - 1 : findIndex + 1);
    }
  });
  document.getElementById('find-prev')!.addEventListener('click', () => jumpToMatch(findIndex - 1));
  document.getElementById('find-next')!.addEventListener('click', () => jumpToMatch(findIndex + 1));
  document.getElementById('find-close')!.addEventListener('click', () => closeFindBar());

  // Click on empty area or margins focuses editor
  editorScroll.addEventListener('click', (e) => {
    if (e.target === editorScroll || e.target === editorContainer) {
      editor?.commands.focus('end');
    }
  });

  // Drag & drop files
  appShell.addEventListener('dragover', (e) => e.preventDefault());
  appShell.addEventListener('drop', async (e) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files) return;
    for (const f of Array.from(files)) {
      const fileWithPath = f as File & { path?: string };
      if (fileWithPath.path) {
        const opened = await window.markNotaAPI.readFile(fileWithPath.path);
        openOrFocusFile(opened.filePath, opened.name, opened.content);
      }
    }
  });
}

async function init(): Promise<void> {
  applySettingsToDOM();
  void window.markNotaAPI.setBlur(settings.blur);

  editor = createMarkdownEditor(editorContainer, '', {
    onUpdate(markdown) {
      if (isApplyingTabContent) return;
      const active = getActiveTab();
      if (!active) return;
      active.content = markdown;
      const nextDirty = active.content !== active.savedContent;
      if (active.dirty !== nextDirty) {
        active.dirty = nextDirty;
        renderTabs();
      }
    },
    onSelectionChange(line, col, words, chars) {
      statusCursor.textContent = `Ln ${line}, Col ${col}`;
      const wLabel = words === 1 ? 'palavra' : 'palavras';
      const cLabel = chars === 1 ? 'caractere' : 'caracteres';
      statusCounts.textContent = `${words} ${wLabel}, ${chars} ${cLabel}`;
    }
  });

  setupMenus();
  setupControls();
  setupKeyboardShortcuts();
  createNewTab();

  const initialFiles = await window.markNotaAPI.getInitialFiles();
  for (const f of initialFiles) {
    openOrFocusFile(f.filePath, f.name, f.content);
  }

  // Load installed system fonts asynchronously
  systemFonts = await window.markNotaAPI.listSystemFonts();
}

void init();
