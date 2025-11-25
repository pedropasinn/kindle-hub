// Sistema de Pop-ups - Estilo "Habits Section" (Sombra Dura & Bordas)
(function() {
    'use strict';

    const START_HOUR = 7;
    const END_HOUR = 23;
    const STORAGE_KEY = 'pointsPopupState';

    let currentPoint = null;
    let popupElement = null;

    // --- ESTILOS VISUAIS (Baseado em .habits-section) ---
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Overlay Fundo Preto Translúcido */
            #points-popup-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background-color: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(2px);
                z-index: 99999;
                display: none;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            /* CORPO DA NOTIFICAÇÃO (Estilo Habits Section) */
            #points-popup-content {
                background: #fff;
                width: 100%;
                max-width: 500px; /* Largura confortável para leitura */
                
                /* Design copiado da sua referência */
                border: 2px solid #000;
                border-radius: 12px; /* var(--radius) aproximado */
                box-shadow: 4px 4px 0px #000; /* Sombra dura */
                
                padding: 24px; /* var(--spacing) um pouco maior */
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                box-sizing: border-box;
                position: relative;
            }

            /* TÍTULO (Estilo Habits Section H2) */
            #points-popup-title {
                font-family: "Helvetica", "Arial", sans-serif;
                font-size: 20px;
                font-weight: bold;
                color: #000;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                
                /* Linha divisória preta sólida */
                width: 100%;
                border-bottom: 2px solid #000;
                padding-bottom: 12px;
                margin-bottom: 20px;
            }

            /* TEXTO DO PONTO */
            #points-popup-text {
                font-family: "Bookerly", "Georgia", serif;
                font-size: 20px;
                line-height: 1.5;
                color: #000;
                margin-bottom: 30px;
                text-align: justify;
                width: 100%;
            }

            /* BOTÃO DE AÇÃO */
            #points-popup-buttons {
                width: 100%;
                display: flex;
                justify-content: center;
            }

            .points-popup-btn {
                padding: 14px 40px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                background: #000;
                color: #fff;
                
                /* Estilo pílula mas com borda para consistência */
                border: 2px solid #000;
                border-radius: 50px;
                
                text-transform: uppercase;
                transition: all 0.2s ease;
            }

            /* Efeito ao clicar/tocar */
            .points-popup-btn:active {
                background: #333;
                transform: translateY(2px);
            }
        `;
        document.head.appendChild(style);
    }

    function createPopupElement() {
        const existing = document.getElementById('points-popup-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'points-popup-overlay';
        
        overlay.innerHTML = `
            <div id="points-popup-content">
                <div id="points-popup-title"></div>
                <div id="points-popup-text"></div>
                
                <div id="points-popup-buttons">
                    <button class="points-popup-btn" onclick="window.PointsPopup.markAsDone()">
                        Confirmar Leitura
                    </button>
                </div>
            </div>
        `;
        return overlay;
    }

    // --- LÓGICA (Mantida igual, funcionando com JSON novo) ---

    async function fetchRandomPoint() {
        try {
            // URL da API
            const response = await fetch('https://escriva.org/api/v1/points/random/'); 
            if (!response.ok) throw new Error('Status ' + response.status);
            return await response.json();
        } catch (error) {
            console.error('Erro API:', error);
            return null;
        }
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
            if(!document.getElementById('points-popup-overlay')) {
                document.body.appendChild(popupElement);
            }
        }

        // Mapeamento correto dos dados
        const bookName = point.book ? point.book.name : 'Livro';
        const number = point.number || '';

        document.getElementById('points-popup-title').textContent = `${bookName} - ${number}`;
        document.getElementById('points-popup-text').textContent = cleanText(point.text);

        popupElement.style.display = 'flex'; 

        saveState({
            lastShown: new Date().toISOString(),
            currentHour: new Date().getHours(),
            pointId: point.id,
            done: false 
        });
    }

    function closePopup() {
        if (popupElement) popupElement.style.display = 'none';
    }

    function markAsDone() {
        closePopup();
        const state = loadState();
        state.done = true; 
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

        if (currentHour < START_HOUR || currentHour >= END_HOUR) return false;

        const state = loadState();

        if (state.currentHour !== currentHour) {
            state.done = false; 
            saveState(state); 
            return true;
        }

        if (state.done) return false;
        return true; 
    }

    async function checkAndShow() {
        if (shouldShowPopup()) {
            const el = document.getElementById('points-popup-overlay');
            if (el && el.style.display === 'flex') return;

            const point = await fetchRandomPoint();
            if (point) showPopup(point);
        }
    }

    function init() {
        injectStyles();
        setInterval(checkAndShow, 60000);
        setTimeout(checkAndShow, 2000); 
    }

    window.PointsPopup = {
        close: closePopup,
        markAsDone: markAsDone,
        show: checkAndShow,
        test: async () => {
           const point = await fetchRandomPoint();
           if(point) showPopup(point);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();