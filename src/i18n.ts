export type LocaleCode = 'pt' | 'en' | 'zh';
export type LanguageSetting = 'auto' | LocaleCode;
export type SpellcheckMode = 'pt-en' | 'pt' | 'en' | 'off';

export interface Translations {
  // Window & Tabs
  newTabTitle: string;
  untitled: string;
  unsavedChanges: string;
  closeTabTooltip: string;
  minimize: string;
  maximize: string;
  close: string;

  // Menubar
  menuFile: string;
  menuNewTab: string;
  menuOpen: string;
  menuSave: string;
  menuSaveAs: string;
  menuCloseTab: string;
  menuExit: string;

  menuEdit: string;
  menuUndo: string;
  menuRedo: string;
  menuFind: string;
  menuH1: string;
  menuBold: string;
  menuItalic: string;
  menuTask: string;
  menuCode: string;

  menuView: string;
  menuZoomIn: string;
  menuZoomOut: string;
  menuZoomReset: string;
  menuToggleStatusbar: string;
  menuToggleCentered: string;
  menuToggleTheme: string;

  menuOptions: string;
  menuLanguage: string;
  langAuto: string;
  langPt: string;
  langEn: string;
  langZh: string;

  spellSection: string;
  spellPtEn: string;
  spellPt: string;
  spellEn: string;
  spellOff: string;

  menuAbout: string;

  // Quick toolbar
  fontBtnTooltip: string;
  appearanceBtn: string;
  appearanceBtnTooltip: string;

  // Font popover
  fontHeader: string;
  fontReset: string;
  fontSearchPlaceholder: string;
  fontRecommended: string;
  fontAll: string;
  fontSize: string;
  fontDecrease: string;
  fontIncrease: string;
  fontLineHeight: string;

  // Appearance popover
  appearanceHeader: string;
  themeLabel: string;
  themeDark: string;
  themeLight: string;
  opacityLabel: string;
  blurKde: string;
  blurWindows: string;
  blurGeneric: string;
  centeredLabel: string;

  // Find bar
  findPlaceholder: string;
  findPrev: string;
  findNext: string;
  findClose: string;

  // Context menu
  ctxNoSuggestions: string;
  ctxAddToDict: string;
  ctxCut: string;
  ctxCopy: string;
  ctxPaste: string;
  ctxSelectAll: string;

  // About modal
  aboutVersionPrefix: string;
  aboutDesc: string;
  aboutCreatedBy: string;
  aboutEditorFont: string;

  // Editor & Statusbar
  editorPlaceholder: string;
  statusLn: string;
  statusCol: string;
  wordSingular: string;
  wordPlural: string;
  charSingular: string;
  charPlural: string;
  formatText: string;
  formatMarkdown: string;
}

export const TRANSLATIONS: Record<LocaleCode, Translations> = {
  pt: {
    newTabTitle: 'Nova aba (Ctrl+T)',
    untitled: 'sem título',
    unsavedChanges: 'Alterações não salvas',
    closeTabTooltip: 'Fechar aba (Ctrl+W)',
    minimize: 'Minimizar',
    maximize: 'Maximizar',
    close: 'Fechar',

    menuFile: 'Arquivo',
    menuNewTab: 'Nova aba',
    menuOpen: 'Abrir...',
    menuSave: 'Salvar',
    menuSaveAs: 'Salvar como...',
    menuCloseTab: 'Fechar aba',
    menuExit: 'Sair',

    menuEdit: 'Editar',
    menuUndo: 'Desfazer',
    menuRedo: 'Refazer',
    menuFind: 'Localizar',
    menuH1: 'Título 1',
    menuBold: 'Negrito',
    menuItalic: 'Itálico',
    menuTask: 'Lista de tarefas',
    menuCode: 'Bloco de código',

    menuView: 'Exibir',
    menuZoomIn: 'Ampliar',
    menuZoomOut: 'Reduzir',
    menuZoomReset: 'Restaurar zoom',
    menuToggleStatusbar: 'Mostrar/ocultar barra de status',
    menuToggleCentered: 'Largura de leitura confortável',
    menuToggleTheme: 'Alternar tema Claro/Escuro',

    menuOptions: 'Opções',
    menuLanguage: 'Idioma da interface',
    langAuto: 'Automático (Sistema)',
    langPt: 'Português',
    langEn: 'English',
    langZh: '中文 (简体)',

    spellSection: 'Dicionário (Corretor)',
    spellPtEn: 'Português + Inglês',
    spellPt: 'Português (pt-BR)',
    spellEn: 'Inglês (en-US)',
    spellOff: 'Desativado',

    menuAbout: 'Sobre',

    fontBtnTooltip: 'Escolher fonte e tamanho',
    appearanceBtn: 'Visual',
    appearanceBtnTooltip: 'Transparência fosca e tema',

    fontHeader: 'Fonte',
    fontReset: 'Padrão',
    fontSearchPlaceholder: 'Buscar fonte instalada...',
    fontRecommended: 'Recomendadas',
    fontAll: 'Todas as fontes',
    fontSize: 'Tamanho',
    fontDecrease: 'Diminuir',
    fontIncrease: 'Aumentar',
    fontLineHeight: 'Espaçamento',

    appearanceHeader: 'Aparência Fosca',
    themeLabel: 'Tema',
    themeDark: 'Escuro Fosco',
    themeLight: 'Claro Fosco',
    opacityLabel: 'Opacidade do fundo',
    blurKde: 'Desfoque do sistema (Blur KDE)',
    blurWindows: 'Efeito translúcido (Mica / Acrílico)',
    blurGeneric: 'Desfoque do sistema',
    centeredLabel: 'Coluna de leitura centralizada',

    findPlaceholder: 'Localizar no texto...',
    findPrev: 'Anterior',
    findNext: 'Próximo',
    findClose: 'Fechar (Esc)',

    ctxNoSuggestions: 'Sem sugestões de correção',
    ctxAddToDict: 'Adicionar ao dicionário',
    ctxCut: 'Recortar',
    ctxCopy: 'Copiar',
    ctxPaste: 'Colar',
    ctxSelectAll: 'Selecionar tudo',

    aboutVersionPrefix: 'versão',
    aboutDesc:
      'Bloco de notas minimalista com Markdown WYSIWYG e fundo de vidro fosco. Gratuito e de código aberto.',
    aboutCreatedBy: 'Criado por',
    aboutEditorFont: 'Fonte do editor: 0xProto Nerd Font Mono (SIL OFL 1.1)',

    editorPlaceholder: 'Comece a escrever em Markdown... (# título, **negrito**, - [ ] tarefa)',
    statusLn: 'Ln',
    statusCol: 'Col',
    wordSingular: 'palavra',
    wordPlural: 'palavras',
    charSingular: 'caractere',
    charPlural: 'caracteres',
    formatText: 'Texto',
    formatMarkdown: 'Markdown'
  },

  en: {
    newTabTitle: 'New tab (Ctrl+T)',
    untitled: 'untitled',
    unsavedChanges: 'Unsaved changes',
    closeTabTooltip: 'Close tab (Ctrl+W)',
    minimize: 'Minimize',
    maximize: 'Maximize',
    close: 'Close',

    menuFile: 'File',
    menuNewTab: 'New tab',
    menuOpen: 'Open...',
    menuSave: 'Save',
    menuSaveAs: 'Save as...',
    menuCloseTab: 'Close tab',
    menuExit: 'Exit',

    menuEdit: 'Edit',
    menuUndo: 'Undo',
    menuRedo: 'Redo',
    menuFind: 'Find',
    menuH1: 'Heading 1',
    menuBold: 'Bold',
    menuItalic: 'Italic',
    menuTask: 'Task list',
    menuCode: 'Code block',

    menuView: 'View',
    menuZoomIn: 'Zoom in',
    menuZoomOut: 'Zoom out',
    menuZoomReset: 'Reset zoom',
    menuToggleStatusbar: 'Toggle status bar',
    menuToggleCentered: 'Comfortable reading width',
    menuToggleTheme: 'Toggle Light/Dark theme',

    menuOptions: 'Options',
    menuLanguage: 'Interface language',
    langAuto: 'Automatic (System)',
    langPt: 'Português',
    langEn: 'English',
    langZh: '中文 (简体)',

    spellSection: 'Dictionary (Spellcheck)',
    spellPtEn: 'Portuguese + English',
    spellPt: 'Portuguese (pt-BR)',
    spellEn: 'English (en-US)',
    spellOff: 'Disabled',

    menuAbout: 'About',

    fontBtnTooltip: 'Choose font and size',
    appearanceBtn: 'Visual',
    appearanceBtnTooltip: 'Frosted transparency and theme',

    fontHeader: 'Font',
    fontReset: 'Default',
    fontSearchPlaceholder: 'Search installed fonts...',
    fontRecommended: 'Recommended',
    fontAll: 'All fonts',
    fontSize: 'Size',
    fontDecrease: 'Decrease',
    fontIncrease: 'Increase',
    fontLineHeight: 'Line height',

    appearanceHeader: 'Frosted Appearance',
    themeLabel: 'Theme',
    themeDark: 'Frosted Dark',
    themeLight: 'Frosted Light',
    opacityLabel: 'Background opacity',
    blurKde: 'System blur (KDE Blur)',
    blurWindows: 'Translucent effect (Mica / Acrylic)',
    blurGeneric: 'System blur',
    centeredLabel: 'Centered reading column',

    findPlaceholder: 'Find in text...',
    findPrev: 'Previous',
    findNext: 'Next',
    findClose: 'Close (Esc)',

    ctxNoSuggestions: 'No spelling suggestions',
    ctxAddToDict: 'Add to dictionary',
    ctxCut: 'Cut',
    ctxCopy: 'Copy',
    ctxPaste: 'Paste',
    ctxSelectAll: 'Select all',

    aboutVersionPrefix: 'version',
    aboutDesc:
      'Minimalist notepad with live WYSIWYG Markdown and a frosted glass background. Free and open source.',
    aboutCreatedBy: 'Created by',
    aboutEditorFont: 'Editor font: 0xProto Nerd Font Mono (SIL OFL 1.1)',

    editorPlaceholder: 'Start writing in Markdown... (# heading, **bold**, - [ ] task)',
    statusLn: 'Ln',
    statusCol: 'Col',
    wordSingular: 'word',
    wordPlural: 'words',
    charSingular: 'character',
    charPlural: 'characters',
    formatText: 'Plain Text',
    formatMarkdown: 'Markdown'
  },

  zh: {
    newTabTitle: '新建标签页 (Ctrl+T)',
    untitled: '无标题',
    unsavedChanges: '未保存的更改',
    closeTabTooltip: '关闭标签页 (Ctrl+W)',
    minimize: '最小化',
    maximize: '最大化',
    close: '关闭',

    menuFile: '文件',
    menuNewTab: '新建标签页',
    menuOpen: '打开...',
    menuSave: '保存',
    menuSaveAs: '另存为...',
    menuCloseTab: '关闭标签页',
    menuExit: '退出',

    menuEdit: '编辑',
    menuUndo: '撤销',
    menuRedo: '重做',
    menuFind: '查找',
    menuH1: '一级标题',
    menuBold: '粗体',
    menuItalic: '斜体',
    menuTask: '任务列表',
    menuCode: '代码块',

    menuView: '视图',
    menuZoomIn: '放大',
    menuZoomOut: '缩小',
    menuZoomReset: '重置缩放',
    menuToggleStatusbar: '显示/隐藏状态栏',
    menuToggleCentered: '舒适阅读宽度',
    menuToggleTheme: '切换浅色/深色主题',

    menuOptions: '选项',
    menuLanguage: '界面语言 (Language)',
    langAuto: '自动 (跟随系统)',
    langPt: 'Português',
    langEn: 'English',
    langZh: '中文 (简体)',

    spellSection: '拼写检查词典',
    spellPtEn: '葡萄牙语 + 英语',
    spellPt: '葡萄牙语 (pt-BR)',
    spellEn: '英语 (en-US)',
    spellOff: '关闭拼写检查',

    menuAbout: '关于',

    fontBtnTooltip: '选择字体和大小',
    appearanceBtn: '外观',
    appearanceBtnTooltip: '磨砂透明度与主题',

    fontHeader: '字体',
    fontReset: '默认',
    fontSearchPlaceholder: '搜索已安装字体...',
    fontRecommended: '推荐字体',
    fontAll: '所有字体',
    fontSize: '字号',
    fontDecrease: '减小',
    fontIncrease: '增大',
    fontLineHeight: '行高',

    appearanceHeader: '磨砂外观',
    themeLabel: '主题',
    themeDark: '深色磨砂',
    themeLight: '浅色磨砂',
    opacityLabel: '背景不透明度',
    blurKde: '系统背景模糊 (KDE Blur)',
    blurWindows: '半透明材质 (云母 / 亚克力)',
    blurGeneric: '系统背景模糊',
    centeredLabel: '居中阅读列',

    findPlaceholder: '在正文中查找...',
    findPrev: '上一个',
    findNext: '下一个',
    findClose: '关闭 (Esc)',

    ctxNoSuggestions: '无拼写建议',
    ctxAddToDict: '添加到词典',
    ctxCut: '剪切',
    ctxCopy: '复制',
    ctxPaste: '粘贴',
    ctxSelectAll: '全选',

    aboutVersionPrefix: '版本',
    aboutDesc: '极简主义 Markdown 所见即所得记事本，采用磨砂玻璃背景。免费且开源。',
    aboutCreatedBy: '作者：',
    aboutEditorFont: '编辑器字体：0xProto Nerd Font Mono (SIL OFL 1.1)',

    editorPlaceholder: '开始使用 Markdown 写作... (# 标题, **粗体**, - [ ] 任务)',
    statusLn: '行',
    statusCol: '列',
    wordSingular: '词',
    wordPlural: '词',
    charSingular: '字符',
    charPlural: '字符',
    formatText: '纯文本',
    formatMarkdown: 'Markdown'
  }
};

export function resolveLocale(setting: LanguageSetting, systemLocale?: string): LocaleCode {
  if (setting === 'pt' || setting === 'en' || setting === 'zh') {
    return setting;
  }
  const raw = (systemLocale || navigator.language || 'pt').toLowerCase();
  if (raw.startsWith('zh')) return 'zh';
  if (raw.startsWith('en')) return 'en';
  if (raw.startsWith('pt')) return 'pt';
  return 'en';
}
