import { contextBridge, ipcRenderer } from 'electron';

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

contextBridge.exposeInMainWorld('markNotaAPI', {
  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: (): Promise<boolean> => ipcRenderer.invoke('window:maximize'),
  closeWindow: (): Promise<void> => ipcRenderer.invoke('window:close'),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),
  setBlur: (enabled: boolean): Promise<boolean> => ipcRenderer.invoke('window:setBlur', enabled),
  setLocale: (locale: 'pt' | 'en' | 'zh'): Promise<string> => ipcRenderer.invoke('app:setLocale', locale),
  onMaximizedChanged: (callback: (isMaximized: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, value: boolean) => callback(value);
    ipcRenderer.on('window:maximized-changed', handler);
    return () => ipcRenderer.removeListener('window:maximized-changed', handler);
  },

  openFiles: (): Promise<OpenedFile[] | null> => ipcRenderer.invoke('file:open'),
  getInitialFiles: (): Promise<OpenedFile[]> => ipcRenderer.invoke('app:getInitialFiles'),
  readFile: (filePath: string): Promise<OpenedFile> => ipcRenderer.invoke('file:read', filePath),
  saveFile: (payload: { filePath: string | null; defaultName: string; content: string }): Promise<SavedFile | null> =>
    ipcRenderer.invoke('file:save', payload),
  saveFileAs: (payload: { defaultName: string; content: string }): Promise<SavedFile | null> =>
    ipcRenderer.invoke('file:saveAs', payload),
  confirmUnsaved: (fileName: string): Promise<'save' | 'discard' | 'cancel'> =>
    ipcRenderer.invoke('dialog:confirmUnsaved', fileName),

  runEditAction: (action: 'copy' | 'cut' | 'paste' | 'selectAll'): Promise<void> =>
    ipcRenderer.invoke('edit:run', action),
  getAppInfo: (): Promise<AppInfo> => ipcRenderer.invoke('app:getInfo'),

  listSystemFonts: (): Promise<string[]> => ipcRenderer.invoke('fonts:list'),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url)
});
