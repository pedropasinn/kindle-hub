// Sistema de Pop-ups Horários de Pontos (Caminho, Sulco, Forja)
// Otimizado para Kindle (E-ink / High Contrast)

(function() {
    'use strict';

    const START_HOUR = 7;  
    const END_HOUR = 23;   // Estendi até 23h
    const STORAGE_KEY = 'pointsPopupState';

    let currentPoint = null;
    let popupElement = null;

    // --- ESTILOS OTIMIZADOS PARA KINDLE ---
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Fundo branco quase opaco para tapar o texto de trás */
            #points-popup-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background-color: #ffffff; 
                z-index: 99999; /* Z-index altíssimo */
                display: none;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 10px;
            }

            /* Caixa do conteúdo simulando uma página de livro */
            #points-popup-content {
                background: white;
                width: 100%;
                max-width: 600px;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                /* Borda grossa preta fica melhor no Kindle que sombra */
                border: 4px solid black; 
                padding: 25px;
                box-sizing: border-box;
            }

            #points-popup-header {
                font-family: "Helvetica", sans-serif;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 2px;
                border-bottom: 2px solid black;
                padding-bottom: 8px;
                margin-bottom: 16px;
                width: 100%;
            }

            #points-popup-book {
                font-family: "Bookerly", "Georgia", serif;
                font-style: italic;
                font-size: 18px;
                color: #000;
                margin-bottom: 12px;
            }

            #points-popup-text {
                font-family: "Bookerly", "Georgia", serif;
                font-size: 24px; /* Fonte bem grande para leitura fácil */
                line-height: 1.4;
                margin-bottom: 30px;
                color: #000;
            }

            #points-popup-buttons {
                display: flex;
                flex-direction: column; /* Botões um em cima do outro facilitam o toque */
                gap: 15px;
                width: 100%;
            }

            .points-popup-btn {
                padding: 15px 0;
                font-size: 18px;
                font-weight: bold;
                border: 3px solid black;
                background: white;
                color: black;
                cursor: pointer;
                width: 100%;
                text-transform: uppercase;
                transition: background 0.2s;
            }

            /* O botão principal fica preto com texto branco (Invertido) */
            .btn-primary {
                background: black;
                color: white;
            }
        `;
        document.head.appendChild(style);
    }

    function createPopupElement() {
        // Remove anterior se existir para evitar duplicatas
        const existing = document.getElementById('points-popup-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'points-popup-overlay';
        overlay.innerHTML = `
            <div id="points-popup-content">
                <div id="points-popup-header">Hora da Meditação</div>
                <div id="points-popup-book"></div>
                <div id="points-popup-text"></div>
                
                <div id="points-popup-buttons">
                    <button class="points-popup-btn btn-primary" onclick="window.PointsPopup.markAsDone()">
                        Concluído
                    </button>
                    <button class="points-popup-btn" onclick="window.PointsPopup.close()">
                        Ler depois
                    </button>
                </div>
            </div>
        `;
        return overlay;
    }

    // --- LÓGICA ---

    async function fetchRandomPoint() {
        console.log("Tentando buscar ponto...");
        try {
            // Adicione o host completo se necessário, ex: http://192.168.x.x:3000/api...
            const response = await fetch('/api/escriva/random-point');
            if (!response.ok) throw new Error('Status ' + response.status);
            return await response.json();
        } catch (error) {
            console.error('Erro API:', error);
            // Fallback caso a API falhe (para teste)
            return {
                book_type: 'caminho',
                number: '???',
                text: 'Não foi possível conectar ao servidor. Verifique a conexão Wi-Fi do Kindle.'
            };
        }
    }

    function getBookName(bookType) {
        const books = { 'camino': 'Caminho', 'surco': 'Sulco', 'forja': 'Forja' };
        return books[bookType] || bookType;
    }

    function cleanText(text) {
        if (!text) return '';
        return text.replace(/<[^>]*>/g, '').trim();
    }

    function showPopup(point) {
        if (!point) return;
        currentPoint = point;

        if (!popupElement) {
            popupElement = createPopupElement();
            document.body.appendChild(popupElement);
        } else {
            // Garante que está no body caso tenha sido removido
            if(!document.getElementById('points-popup-overlay')) {
                document.body.appendChild(popupElement);
            }
        }

        const bookName = getBookName(point.book_type);
        document.getElementById('points-popup-book').textContent = `${bookName}, nº ${point.number}`;
        document.getElementById('points-popup-text').textContent = cleanText(point.text);

        // Usar display flex para garantir centralização
        popupElement.style.display = 'flex'; 

        // Salvar que foi exibido
        saveState({
            lastShown: new Date().toISOString(),
            currentHour: new Date().getHours(),
            pointId: point.id,
            done: false // Ainda não foi rezado
        });
    }

    function closePopup() {
        if (popupElement) popupElement.style.display = 'none';
    }

    function markAsDone() {
        closePopup();
        const state = loadState();
        state.done = true; // Marca como feito para não aparecer mais nesta hora
        saveState(state);
    }

    function saveState(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function loadState() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch (e) { return {}; }
    }

    function shouldShowPopup() {
        const now = new Date();
        const currentHour = now.getHours();

        // 1. Horário permitido?
        if (currentHour < START_HOUR || currentHour >= END_HOUR) return false;

        const state = loadState();

        // 2. É uma nova hora?
        if (state.currentHour !== currentHour) {
            // Resetar o estado "done" se mudou a hora
            state.done = false; 
            saveState(state); 
            return true;
        }

        // 3. Já foi feito nesta hora?
        if (state.done) return false;

        // 4. Se não foi feito e estamos na mesma hora, mostra (ou insiste)
        // Opcional: Para não ficar chato, verificar se já mostrou nos últimos 10 min
        return true; 
    }

    async function checkAndShow() {
        if (shouldShowPopup()) {
            // Verifica se o popup JÁ está visível para não buscar outro
            const el = document.getElementById('points-popup-overlay');
            if (el && el.style.display === 'flex') return;

            const point = await fetchRandomPoint();
            if (point) showPopup(point);
        }
    }

    function init() {
        injectStyles();
        
        // Verifica a cada 60 segundos
        setInterval(checkAndShow, 60000);
        
        // Verifica ao carregar a página
        setTimeout(checkAndShow, 2000); 
    }

    // API Global
    window.PointsPopup = {
        close: closePopup,
        markAsDone: markAsDone,
        show: checkAndShow,
        // Função de teste para forçar aparecer AGORA
        test: async () => {
            const point = await fetchRandomPoint();
            showPopup(point);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();