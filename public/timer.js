/**
 * TIMER GLOBAL - Kindle Hub
 * Sistema de timer persistente entre páginas
 * Otimizado para navegador Kindle (lightweight)
 */

(function() {
  'use strict';

  // ========== CONSTANTES ==========
  const STORAGE_KEY = 'kindleHubTimer';
  const STORAGE_ENDED_KEY = 'kindleHubTimerEnded';
  const CHECK_INTERVAL = 1000; // Verifica estado a cada 1s

  const PRESETS = {
    '5min': 5 * 60 * 1000,
    '10min': 10 * 60 * 1000,
    '30min': 30 * 60 * 1000,
    '2h': 2 * 60 * 60 * 1000
  };

  // ========== STATE MANAGEMENT ==========

  /**
   * Estrutura do estado do timer
   */
  function getDefaultState() {
    return {
      isActive: false,
      isPaused: false,
      startTime: null,
      endTime: null,
      duration: 0,
      mode: 'timer', // 'timer' ou 'clock'
      preset: null,
      pausedAt: null,
      remainingAtPause: 0
    };
  }

  /**
   * Carrega estado do localStorage
   */
  function loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return getDefaultState();
      return JSON.parse(data);
    } catch (e) {
      console.error('Erro ao carregar timer:', e);
      return getDefaultState();
    }
  }

  /**
   * Salva estado no localStorage
   */
  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Erro ao salvar timer:', e);
    }
  }

  /**
   * Limpa flag de timer encerrado
   */
  function clearEndedFlag() {
    localStorage.removeItem(STORAGE_ENDED_KEY);
  }

  /**
   * Define flag de timer encerrado
   */
  function setEndedFlag() {
    localStorage.setItem(STORAGE_ENDED_KEY, 'true');
  }

  /**
   * Verifica se timer acabou de encerrar
   */
  function checkEndedFlag() {
    return localStorage.getItem(STORAGE_ENDED_KEY) === 'true';
  }

  // ========== TIMER LOGIC ==========

  /**
   * Calcula tempo restante em milissegundos
   */
  function getRemainingTime(state) {
    if (!state.isActive) return 0;
    if (state.isPaused) return state.remainingAtPause;

    const now = Date.now();
    const remaining = state.endTime - now;
    return Math.max(0, remaining);
  }

  /**
   * Formata tempo em HH:MM
   */
  function formatTime(milliseconds) {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
  }

  /**
   * Obtém hora atual formatada HH:MM
   */
  function getCurrentTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  // ========== API PÚBLICA ==========

  /**
   * Inicia timer com duração especificada
   */
  function startTimer(durationMs, presetName = 'custom') {
    const now = Date.now();
    const state = {
      isActive: true,
      isPaused: false,
      startTime: now,
      endTime: now + durationMs,
      duration: durationMs,
      mode: loadState().mode || 'timer',
      preset: presetName,
      pausedAt: null,
      remainingAtPause: 0
    };
    saveState(state);
    clearEndedFlag();
  }

  /**
   * Pausa o timer
   */
  function pauseTimer() {
    const state = loadState();
    if (!state.isActive || state.isPaused) return;

    const now = Date.now();
    const remaining = state.endTime - now;

    // Garante que o tempo restante seja sempre positivo
    state.isPaused = true;
    state.pausedAt = now;
    state.remainingAtPause = Math.max(1000, remaining); // No mínimo 1 segundo
    saveState(state);
  }

  /**
   * Resume o timer
   */
  function resumeTimer() {
    const state = loadState();
    if (!state.isActive || !state.isPaused) return;

    const now = Date.now();
    state.isPaused = false;
    state.startTime = now;
    state.endTime = now + state.remainingAtPause;
    state.pausedAt = null;
    saveState(state);

    // Limpa flag de encerrado ao retomar
    clearEndedFlag();
  }

  /**
   * Para o timer completamente
   */
  function stopTimer() {
    saveState(getDefaultState());
    clearEndedFlag();
  }

  /**
   * Alterna entre modo timer e relógio
   */
  function toggleMode(mode) {
    const state = loadState();
    state.mode = mode;
    saveState(state);
  }

  /**
   * Obtém estado atual
   */
  function getState() {
    return loadState();
  }

  // ========== WIDGET (OUTRAS PÁGINAS) ==========

  let widgetElement = null;
  let widgetInterval = null;

  /**
   * Cria widget no canto superior direito
   */
  function createWidget() {
    if (widgetElement) return;

    widgetElement = document.createElement('div');
    widgetElement.className = 'timer-widget';
    widgetElement.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(255, 255, 255, 0.98);
      border: 2px solid #000;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: bold;
      z-index: 9999;
      display: none;
      align-items: center;
      gap: 8px;
      font-family: Arial, sans-serif;
    `;

    document.body.appendChild(widgetElement);
  }

  /**
   * Atualiza widget
   */
  function updateWidget() {
    if (!widgetElement) return;

    const state = loadState();

    if (!state.isActive) {
      widgetElement.style.display = 'none';
      return;
    }

    widgetElement.style.display = 'flex';

    let displayText = '';

    if (state.mode === 'clock') {
      // Modo relógio - mostra hora atual
      displayText = `${getCurrentTime()}`;
    } else {
      // Modo timer - mostra tempo restante
      const remaining = getRemainingTime(state);
      if (remaining <= 0) {
        displayText = '00:00';
      } else {
        displayText = `${formatTime(remaining)}`;
      }
    }

    // Adiciona indicador de pausa
    if (state.isPaused) {
      displayText += ' ⏸';
    }

    widgetElement.textContent = displayText;
  }

  /**
   * Inicia monitoramento do widget
   */
  function startWidgetMonitoring() {
    createWidget();
    updateWidget();

    if (widgetInterval) clearInterval(widgetInterval);
    widgetInterval = setInterval(() => {
      updateWidget();
      checkTimerEnd();
    }, CHECK_INTERVAL);
  }

  // ========== MODAL DE NOTIFICAÇÃO ==========

  let modalElement = null;

  /**
   * Cria modal de notificação
   */
  function createModal() {
    if (modalElement) return;

    modalElement = document.createElement('div');
    modalElement.className = 'timer-modal';
    modalElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      font-family: Arial, sans-serif;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: #fff;
      border: 4px solid #000;
      padding: 40px;
      text-align: center;
      max-width: 400px;
      border-radius: 8px;
    `;

    const title = document.createElement('div');
    title.textContent = 'Timer Encerrado!';
    title.style.cssText = `
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #000;
    `;

    const button = document.createElement('button');
    button.textContent = 'OK';
    button.style.cssText = `
      padding: 14px 40px;
      background: #000;
      color: #fff;
      border: none;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
      border-radius: 6px;
      margin-top: 10px;
    `;
    button.onclick = () => {
      hideModal();
      stopTimer();
    };

    content.appendChild(title);
    content.appendChild(button);
    modalElement.appendChild(content);
    document.body.appendChild(modalElement);
  }

  /**
   * Mostra modal
   */
  function showModal() {
    if (!modalElement) createModal();
    modalElement.style.display = 'flex';
  }

  /**
   * Esconde modal
   */
  function hideModal() {
    if (modalElement) {
      modalElement.style.display = 'none';
    }
    clearEndedFlag();
  }

  /**
   * Verifica se timer encerrou
   */
  function checkTimerEnd() {
    // Verifica flag de encerramento
    if (checkEndedFlag()) {
      showModal();
      return;
    }

    const state = loadState();
    if (!state.isActive || state.isPaused) return;

    const remaining = getRemainingTime(state);
    if (remaining <= 0) {
      setEndedFlag();
      showModal();
      // Não para o timer aqui - deixa o usuário fazer isso no modal
    }
  }

  // ========== INICIALIZAÇÃO ==========

  /**
   * Detecta se é a página do dashboard
   */
  function isDashboard() {
    return window.location.pathname.includes('dashboard.html');
  }

  /**
   * Inicializa timer
   */
  function init() {
    // Dashboard não mostra widget (tem UI própria)
    if (isDashboard()) {
      // Apenas monitora fim do timer
      setInterval(checkTimerEnd, CHECK_INTERVAL);
      return;
    }

    // Outras páginas: mostra widget
    startWidgetMonitoring();
  }

  // ========== EXPORT API ==========

  // Expõe API global
  window.KindleTimer = {
    start: startTimer,
    pause: pauseTimer,
    resume: resumeTimer,
    stop: stopTimer,
    toggleMode: toggleMode,
    getState: getState,
    getRemainingTime: () => getRemainingTime(loadState()),
    formatTime: formatTime,
    getCurrentTime: getCurrentTime,
    PRESETS: PRESETS
  };

  // Inicializa quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
