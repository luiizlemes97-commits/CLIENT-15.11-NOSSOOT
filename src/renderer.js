import './index.css'; 

// --- SELEÇÃO DE ELEMENTOS DO HTML ---
const btnAcao = document.getElementById('btn-jogar');
const btnFechar = document.getElementById('btn-fechar');
const barraContainer = document.getElementById('barra-container');
const barraProgresso = document.getElementById('barra-progresso');
const textoPorcentagem = document.getElementById('porcentagem-texto');

// --- LÓGICA DO BOTÃO FECHAR (X) ---
// Como removemos a barra do Windows, precisamos desse comando para fechar
if (btnFechar) {
    btnFechar.addEventListener('click', () => {
        window.close();
    });
}

// --- FUNÇÃO PRINCIPAL DO LAUNCHER ---
async function iniciarLauncher() {
    btnAcao.disabled = true;
    btnAcao.innerText = "Verificando...";

    try {
        // 1. Chama a verificação de versão no main.js
        const resultado = await window.electron.verificarAtualizacao();

        if (resultado.erro) {
            alert(resultado.erro);
            btnAcao.disabled = false;
            btnAcao.innerText = "Jogar";
            return;
        }

        if (resultado.precisaUpdate) {
            // --- INÍCIO DO DOWNLOAD ---
            btnAcao.innerText = "Baixando Update...";
            
            // Mostra a barra e o texto de porcentagem
            if (barraContainer) barraContainer.style.display = 'block';
            if (textoPorcentagem) textoPorcentagem.style.display = 'block';

            // Escuta o progresso enviado pelo main.js (0 a 100)
            window.electron.onProgresso((valor) => {
                if (barraProgresso) barraProgresso.style.width = valor + '%';
                if (textoPorcentagem) textoPorcentagem.innerText = valor + '%';
            });

            // Inicia o download propriamente dito
            const download = await window.electron.iniciarDownload();
            
            // Quando o download termina, entramos na fase de extração
            btnAcao.innerText = "Extraindo arquivos...";

            if (download.sucesso) {
                alert("Atualização concluída com sucesso!");
                location.reload(); // Recarrega para liberar o botão de Jogar
            } else {
                alert("Erro no download: " + download.erro);
                btnAcao.disabled = false;
                btnAcao.innerText = "Tentar Novamente";
            }

        } else {
            // Se já estiver atualizado, abre o jogo
            btnAcao.innerText = "Abrindo Jogo...";
            
            const resAbrir = await window.electron.abrirJogo(resultado.path);
            
            if (resAbrir && resAbrir.sucesso) {
                // AGUARDA 3 SEGUNDOS E FECHA O LAUNCHER
                setTimeout(() => {
                    window.close();
                }, 3000); 
            } else {
                alert("Erro ao abrir: " + (resAbrir.erro || "Verifique a pasta bin"));
                btnAcao.disabled = false;
                btnAcao.innerText = "Jogar";
            }
        }

    } catch (err) {
        alert("Erro fatal no launcher: " + err.message);
        btnAcao.disabled = false;
        btnAcao.innerText = "Erro";
    }
}

// Escuta o clique no botão JOGAR
btnAcao.addEventListener('click', iniciarLauncher);
