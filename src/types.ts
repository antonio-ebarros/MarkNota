export interface TabDocument {
  id: string;
  title: string;
  filePath: string | null;
  content: string;
  savedContent: string;
  dirty: boolean;
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

declare global {
  interface Window {
    markNotaAPI: {
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<boolean>;
      closeWindow: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
      setBlur: (enabled: boolean) => Promise<boolean>;
      onMaximizedChanged: (callback: (isMaximized: boolean) => void) => () => void;
      openFiles: () => Promise<OpenedFile[] | null>;
      getInitialFiles: () => Promise<OpenedFile[]>;
      readFile: (filePath: string) => Promise<OpenedFile>;
      saveFile: (payload: { filePath: string | null; defaultName: string; content: string }) => Promise<SavedFile | null>;
      saveFileAs: (payload: { defaultName: string; content: string }) => Promise<SavedFile | null>;
      confirmUnsaved: (fileName: string) => Promise<'save' | 'discard' | 'cancel'>;
      listSystemFonts: () => Promise<string[]>;
      openExternal: (url: string) => Promise<void>;
    };
  }
}
