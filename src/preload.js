const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    verificarAtualizacao: () => ipcRenderer.invoke('verificar-atualizacao'),
    iniciarDownload: () => ipcRenderer.invoke('iniciar-download'),
    abrirJogo: (path) => ipcRenderer.invoke('abrir-jogo', path),
    // ESSA LINHA É OBRIGATÓRIA PARA A BARRA FUNCIONAR:
    onProgresso: (callback) => ipcRenderer.on('download-progresso', (event, value) => callback(value))
});
