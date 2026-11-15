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

contextBridge.exposeInMainWorld('markNotaAPI', {
  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: (): Promise<boolean> => ipcRenderer.invoke('window:maximize'),
  closeWindow: (): Promise<void> => ipcRenderer.invoke('window:close'),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),
  setBlur: (enabled: boolean): Promise<boolean> => ipcRenderer.invoke('window:setBlur', enabled),
  onMaximizedChanged: (callback: (isMaximized: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, value: boolean) => callback(value);
    ipcRenderer.on('window:maximized-changed', handler);
    return () => ipcRenderer.removeListener('window:maximized-changed', handler);
  },

  openFiles: (): Promise<OpenedFile[] | null> => ipcRenderer.invoke('file:open'),
  readFile: (filePath: string): Promise<OpenedFile> => ipcRenderer.invoke('file:read', filePath),
  saveFile: (payload: { filePath: string | null; defaultName: string; content: string }): Promise<SavedFile | null> =>
    ipcRenderer.invoke('file:save', payload),
  saveFileAs: (payload: { defaultName: string; content: string }): Promise<SavedFile | null> =>
    ipcRenderer.invoke('file:saveAs', payload),
  confirmUnsaved: (fileName: string): Promise<'save' | 'discard' | 'cancel'> =>
    ipcRenderer.invoke('dialog:confirmUnsaved', fileName),

  listSystemFonts: (): Promise<string[]> => ipcRenderer.invoke('fonts:list'),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url)
});
