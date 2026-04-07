const { app, ipcMain, BrowserWindow } = require('electron');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const AdmZip = require('adm-zip');
const { exec } = require('child_process');

// --- CONFIGURAÇÕES DO SEU SERVIDOR ---
const VERSION_URL = 'https://github.com/luiizlemes97-commits/launcher-15./raw/refs/heads/main/version.txt';
const CLIENT_ZIP_URL = 'https://github.com/luiizlemes97-commits/launcher-15./releases/download/NOSSOOT/nossoot.zip';

// Pasta onde os arquivos do Tibia ficarão (AppData/Roaming)
const PASTA_JOGO = path.join(app.getPath('userData'), 'NOSSOOT');
const VERSAO_LOCAL_PATH = path.join(PASTA_JOGO, 'partial.package.json.version');

// 1. Lógica para verificar versão
ipcMain.handle('verificar-atualizacao', async () => {
    try {
        const res = await axios.get(VERSION_URL, { timeout: 10000 });
        const versaoRemota = res.data.toString().trim();

        let versaoLocal = "0.0";
        if (fs.existsSync(VERSAO_LOCAL_PATH)) {
            versaoLocal = fs.readFileSync(VERSAO_LOCAL_PATH, 'utf8').trim();
        }

        const precisaUpdate = versaoRemota !== versaoLocal;

        return { 
            precisaUpdate: precisaUpdate, 
            versao: versaoRemota,
            path: path.join(PASTA_JOGO, 'bin', 'client.exe') 
        };
    } catch (error) {
        return { erro: "Falha ao conectar: " + error.message };
    }
});

// 2. Lógica para baixar e extrair o ZIP com progresso
ipcMain.handle('iniciar-download', async (event) => {
    try {
        const zipPath = path.join(app.getPath('temp'), 'update.zip');
        
        const response = await axios({
            method: 'get',
            url: CLIENT_ZIP_URL,
            responseType: 'stream'
        });

        const totalLength = response.headers['content-length'];
        let downloadedLength = 0;

        response.data.on('data', (chunk) => {
            downloadedLength += chunk.length;
            const progresso = Math.round((downloadedLength / totalLength) * 100);
            event.sender.send('download-progresso', progresso);
        });

        const writer = fs.createWriteStream(zipPath);
        response.data.pipe(writer);

        return new Promise((resolve) => {
            writer.on('finish', () => {
                const zip = new AdmZip(zipPath);
                // Extração assíncrona para não travar a janela
                zip.extractAllToAsync(PASTA_JOGO, true, false, (error) => {
                    if (error) {
                        resolve({ erro: "Erro na extração: " + error.message });
                    } else {
                        // Salva a nova versão local após extrair com sucesso
                        axios.get(VERSION_URL).then(res => {
                            fs.writeFileSync(VERSAO_LOCAL_PATH, res.data.toString().trim());
                        });
                        fs.removeSync(zipPath);
                        resolve({ sucesso: true });
                    }
                });
            });
        });
    } catch (error) {
        return { erro: "Erro no download: " + error.message };
    }
});

// 3. Lógica para abrir o jogo
ipcMain.handle('abrir-jogo', async (event, exePath) => {
    try {
        const pastaTrabalho = path.dirname(exePath);
        exec(`"${exePath}"`, { cwd: pastaTrabalho });
        return { sucesso: true };
    } catch (error) {
        return { erro: error.message };
    }
});

// --- CRIAÇÃO DA JANELA (ESTILO BORDA INFINITA) ---
const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: false,       // Impede redimensionar
        frame: false,           // REMOVE A BARRA DO WINDOWS (Borda Infinita)
        transparent: true,      // Permite fundo vazado/arredondado
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
    });

    // Remove o menu completamente
    mainWindow.setMenu(null);

    // Carrega o index.html
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    // Desativado para o jogador final:
    //mainWindow.webContents.openDevTools();
};

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
