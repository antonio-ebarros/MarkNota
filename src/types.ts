import type { LanguageSetting } from './i18n';

export interface TabDocument {
  id: string;
  title: string;
  filePath: string | null;
  content: string;
  savedContent: string;
  dirty: boolean;
  isUntitled?: boolean;
  untitledIndex?: number;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  opacity: number;
  blur: boolean;
  centered: boolean;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  zoom: number;
  showStatusBar: boolean;
  language: LanguageSetting;
  fontV2?: boolean;
}

export interface OpenedFile {
  filePath: string;
  name: string;
  content: string;
}

export interface SavedFile {
  filePath: string;
  name: string;
}

export interface AppInfo {
  name: string;
  version: string;
  author: string;
  repository: string;
  platform: string;
  electron: string;
  systemLocale: string;
}

declare global {
  interface Window {
    markNotaAPI: {
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<boolean>;
      closeWindow: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
      setBlur: (enabled: boolean) => Promise<boolean>;
      setLocale: (locale: 'pt' | 'en' | 'zh') => Promise<string>;
      onMaximizedChanged: (callback: (isMaximized: boolean) => void) => () => void;
      openFiles: () => Promise<OpenedFile[] | null>;
      getInitialFiles: () => Promise<OpenedFile[]>;
      readFile: (filePath: string) => Promise<OpenedFile>;
      saveFile: (payload: { filePath: string | null; defaultName: string; content: string }) => Promise<SavedFile | null>;
      saveFileAs: (payload: { defaultName: string; content: string }) => Promise<SavedFile | null>;
      confirmUnsaved: (fileName: string) => Promise<'save' | 'discard' | 'cancel'>;
      runEditAction: (action: 'copy' | 'cut' | 'paste' | 'selectAll') => Promise<void>;
      getAppInfo: () => Promise<AppInfo>;
      listSystemFonts: () => Promise<string[]>;
      openExternal: (url: string) => Promise<void>;
    };
  }
}
