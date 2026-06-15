/**
 * settingsPanel.js
 * =================
 * Panel untuk mengatur game settings.
 */

import { ALGORITHM, GAME_MODE, MIN_DEPTH, MAX_DEPTH, DEFAULT_DEPTH, BLACK, WHITE } from '../utils/constants.js';

export class SettingsPanel {
  constructor(container) {
    if (typeof container === 'string') {
      this.containerElement = document.querySelector(container);
    } else {
      this.containerElement = container;
    }
    if (!this.containerElement) throw new Error('Container element not found');
    this.callbacks = {};
    this._createElements();
  }

  _createElements() {
    this.containerElement.innerHTML = `
      <div class="settings-panel">
        <div class="settings-section">
          <h3>⚙️ Game Settings</h3>
          <div class="setting-item">
            <label for="gameModeSelect">Game Mode:</label>
            <select id="gameModeSelect" class="setting-select">
              <option value="human_vs_ai">Human vs AI</option>
              <option value="human_vs_human">Human vs Human</option>
            </select>
          </div>
          <div class="setting-item">
            <label for="humanColorSelect">You Play As:</label>
            <select id="humanColorSelect" class="setting-select">
              <option value="1">● Black</option>
              <option value="-1">○ White</option>
            </select>
          </div>
        </div>

        <div class="settings-section">
          <h3>🤖 AI Settings</h3>
          <div class="setting-item">
            <label for="algorithmSelect">Algorithm:</label>
            <select id="algorithmSelect" class="setting-select">
              <option value="minimax">Minimax</option>
              <option value="alphabeta">Alpha-Beta Pruning</option>
            </select>
          </div>
          <div class="setting-item">
            <label for="depthSlider">Search Depth:</label>
            <div class="depth-control">
              <input type="range" id="depthSlider" class="depth-slider" min="${MIN_DEPTH}" max="${MAX_DEPTH}" value="${DEFAULT_DEPTH}" step="1"/>
              <span class="depth-display" id="depthDisplay">${DEFAULT_DEPTH}</span>
            </div>
            <small class="help-text">1 (fast) → ${MAX_DEPTH} (thorough)</small>
          </div>
          <div class="setting-item">
            <label for="timeLimit">Time Limit (sec):</label>
            <select id="timeLimit" class="setting-select">
              <option value="0">Unlimited</option>
              <option value="1">1 second</option>
              <option value="2">2 seconds</option>
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
            </select>
          </div>
        </div>

        <div class="settings-section">
          <h3>🎨 Display Settings</h3>
          <div class="setting-item checkbox">
            <input type="checkbox" id="showValidMoves" class="setting-checkbox" checked/>
            <label for="showValidMoves">Show Valid Moves</label>
          </div>
          <div class="setting-item checkbox">
            <input type="checkbox" id="enableAnimations" class="setting-checkbox" checked/>
            <label for="enableAnimations">Enable Animations</label>
          </div>
          <div class="setting-item checkbox">
            <input type="checkbox" id="enableSound" class="setting-checkbox" checked/>
            <label for="enableSound">Enable Sound</label>
          </div>
        </div>

        <div class="settings-section">
          <h3>📊 Debug Options</h3>
          <div class="setting-item checkbox">
            <input type="checkbox" id="showGameTree" class="setting-checkbox"/>
            <label for="showGameTree">Show Game Tree</label>
          </div>
          <div class="setting-item checkbox">
            <input type="checkbox" id="enableLogging" class="setting-checkbox"/>
            <label for="enableLogging">Enable Logging</label>
          </div>
        </div>

        <div class="settings-section button-group">
          <button id="applySettingsBtn" class="btn btn-primary">Apply Settings</button>
        </div>
      </div>
    `;
    this._setupEventListeners();
  }

  _setupEventListeners() {
    const depthSlider = document.getElementById('depthSlider');
    const depthDisplay = document.getElementById('depthDisplay');

    depthSlider?.addEventListener('input', (e) => {
      depthDisplay.textContent = e.target.value;
      if (this.callbacks.onDepthChange) this.callbacks.onDepthChange(parseInt(e.target.value));
    });

    document.getElementById('algorithmSelect')?.addEventListener('change', (e) => {
      if (this.callbacks.onAlgorithmChange) this.callbacks.onAlgorithmChange(e.target.value);
    });

    document.getElementById('gameModeSelect')?.addEventListener('change', (e) => {
      if (this.callbacks.onGameModeChange) this.callbacks.onGameModeChange(e.target.value);
    });

    document.getElementById('humanColorSelect')?.addEventListener('change', (e) => {
      if (this.callbacks.onHumanColorChange) this.callbacks.onHumanColorChange(parseInt(e.target.value));
    });

    document.getElementById('showValidMoves')?.addEventListener('change', (e) => {
      if (this.callbacks.onShowValidMovesChange) this.callbacks.onShowValidMovesChange(e.target.checked);
    });

    document.getElementById('enableAnimations')?.addEventListener('change', (e) => {
      if (this.callbacks.onAnimationsChange) this.callbacks.onAnimationsChange(e.target.checked);
    });

    document.getElementById('enableSound')?.addEventListener('change', (e) => {
      if (this.callbacks.onSoundChange) this.callbacks.onSoundChange(e.target.checked);
    });

    document.getElementById('showGameTree')?.addEventListener('change', (e) => {
      if (this.callbacks.onShowGameTreeChange) this.callbacks.onShowGameTreeChange(e.target.checked);
    });

    document.getElementById('enableLogging')?.addEventListener('change', (e) => {
      if (this.callbacks.onLoggingChange) this.callbacks.onLoggingChange(e.target.checked);
    });

    document.getElementById('applySettingsBtn')?.addEventListener('click', () => {
      this.applySettings();
    });
  }

  getSettings() {
    return {
      gameMode: document.getElementById('gameModeSelect')?.value || GAME_MODE.HUMAN_VS_AI,
      algorithm: document.getElementById('algorithmSelect')?.value || ALGORITHM.MINIMAX,
      depth: parseInt(document.getElementById('depthSlider')?.value) || DEFAULT_DEPTH,
      humanColor: parseInt(document.getElementById('humanColorSelect')?.value) || BLACK,
      timeLimit: parseInt(document.getElementById('timeLimit')?.value) || 0,
      showValidMoves: document.getElementById('showValidMoves')?.checked ?? true,
      enableAnimations: document.getElementById('enableAnimations')?.checked ?? true,
      enableSound: document.getElementById('enableSound')?.checked ?? true,
      showGameTree: document.getElementById('showGameTree')?.checked ?? false,
      enableLogging: document.getElementById('enableLogging')?.checked ?? false,
    };
  }

  getAlgorithm() { return document.getElementById('algorithmSelect')?.value || ALGORITHM.MINIMAX; }
  getDepth() { return parseInt(document.getElementById('depthSlider')?.value) || DEFAULT_DEPTH; }
  getGameMode() { return document.getElementById('gameModeSelect')?.value || GAME_MODE.HUMAN_VS_AI; }

  setAlgorithm(algorithm) {
    const select = document.getElementById('algorithmSelect');
    if (select) select.value = algorithm;
  }

  setDepth(depth) {
    if (depth < MIN_DEPTH) depth = MIN_DEPTH;
    if (depth > MAX_DEPTH) depth = MAX_DEPTH;
    const slider = document.getElementById('depthSlider');
    const display = document.getElementById('depthDisplay');
    if (slider) slider.value = depth;
    if (display) display.textContent = depth;
  }

  setGameMode(mode) {
    const select = document.getElementById('gameModeSelect');
    if (select) select.value = mode;
  }

  setHumanColor(color) {
    const select = document.getElementById('humanColorSelect');
    if (select) select.value = color;
  }

  on(event, callback) {
    this.callbacks[event] = callback;
  }

  applySettings() {
    const settings = this.getSettings();
    if (this.callbacks.onSettingsApply) this.callbacks.onSettingsApply(settings);
  }

  resetSettings() {
    this.setAlgorithm(ALGORITHM.MINIMAX);
    this.setDepth(DEFAULT_DEPTH);
    this.setGameMode(GAME_MODE.HUMAN_VS_AI);
    this.setHumanColor(BLACK);

    document.getElementById('showValidMoves').checked = true;
    document.getElementById('enableAnimations').checked = true;
    document.getElementById('enableSound').checked = true;
    document.getElementById('showGameTree').checked = false;
    document.getElementById('enableLogging').checked = false;

    if (this.callbacks.onSettingsReset) this.callbacks.onSettingsReset();
  }

  setAISettingsEnabled(enabled) {
    document.getElementById('algorithmSelect').disabled = !enabled;
    document.getElementById('depthSlider').disabled = !enabled;
    document.getElementById('timeLimit').disabled = !enabled;
  }

  disableAll() {
    const inputs = this.containerElement.querySelectorAll('select, input[type="range"], input[type="checkbox"]');
    for (const input of inputs) input.disabled = true;
  }

  enableAll() {
    const inputs = this.containerElement.querySelectorAll('select, input[type="range"], input[type="checkbox"]');
    for (const input of inputs) input.disabled = false;
  }
}

export default SettingsPanel;