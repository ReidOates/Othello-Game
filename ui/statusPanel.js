/**
 * statusPanel.js
 * ===============
 * Menampilkan status permainan real-time.
 */

import { BLACK, WHITE } from '../utils/constants.js';
import { formatNumber } from '../utils/helpers.js';

export class StatusPanel {
  constructor(container) {
    if (typeof container === 'string') {
      this.containerElement = document.querySelector(container);
    } else {
      this.containerElement = container;
    }

    if (!this.containerElement) {
      throw new Error('Container element not found');
    }

    this._createElements();
  }

  _createElements() {
    this.containerElement.innerHTML = `
      <div class="status-panel">
        <div class="status-section">
          <h3>Game Status</h3>
          <div class="status-item">
            <span class="label">Current Turn:</span>
            <span class="value" id="currentTurn">Black</span>
            <span class="turn-indicator" id="turnIndicator">●</span>
          </div>
          <div class="status-item">
            <span class="label">Game State:</span>
            <span class="value" id="gameStatus">Playing</span>
          </div>
        </div>

        <div class="status-section">
          <h3>Disc Count</h3>
          <div class="disc-count">
            <div class="disc-item">
              <span class="disc-icon black-disc">●</span>
              <span class="label">Black:</span>
              <span class="value" id="blackCount">2</span>
            </div>
            <div class="disc-item">
              <span class="disc-icon white-disc">○</span>
              <span class="label">White:</span>
              <span class="value" id="whiteCount">2</span>
            </div>
          </div>
        </div>

        <div class="status-section">
          <h3>Move Count</h3>
          <div class="status-item">
            <span class="label">Moves Played:</span>
            <span class="value" id="moveCount">0</span>
          </div>
        </div>

        <div class="status-section" style="margin-top: 20px;">
          <button id="restartGameBtn" class="btn btn-primary" style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
            Restart Game
          </button>
        </div>
      </div>
    `;
  }

  updateCurrentTurn(player) {
    const turnElement = document.getElementById('currentTurn');
    const indicatorElement = document.getElementById('turnIndicator');
    const playerName = player === BLACK ? 'Black' : 'White';
    const playerSymbol = player === BLACK ? '●' : '○';

    if (turnElement) turnElement.textContent = playerName;
    if (indicatorElement) {
      indicatorElement.textContent = playerSymbol;
      indicatorElement.style.color = player === BLACK ? '#1a1a2e' : '#f0f0f0';
    }
  }

  updateGameStatus(status) {
    const element = document.getElementById('gameStatus');
    if (!element) return;
    const statusText = {
      playing: '🎮 Playing',
      black_win: '✓ Black Wins',
      white_win: '✓ White Wins',
      draw: '⟺ Draw',
      game_over: '🏁 Game Over',
    };
    element.textContent = statusText[status] || status;
    element.className = `value status-${status}`;
  }

  updateDiscCounts(counts) {
    const blackElement = document.getElementById('blackCount');
    const whiteElement = document.getElementById('whiteCount');
    if (blackElement) blackElement.textContent = counts.black;
    if (whiteElement) whiteElement.textContent = counts.white;
  }

  // Fungsi updateLastMove dihapus karena permintaannya dibuang

  updateMoveCount(count) {
    const element = document.getElementById('moveCount');
    if (element) element.textContent = count;
  }

  updateGameState(state) {
    this.updateCurrentTurn(state.currentPlayer);
    this.updateGameStatus(state.gameStatus);
    this.updateDiscCounts(state.discCounts);
    this.updateMoveCount(state.moveCount);
  }

  showWinNotification(winner, scores) {
    const statusElement = document.getElementById('gameStatus');
    if (!statusElement) return;
    let message = '';
    if (winner === BLACK) message = `🎉 Black Wins! (${scores.black} - ${scores.white})`;
    else if (winner === WHITE) message = `🎉 White Wins! (${scores.white} - ${scores.black})`;
    else message = `🤝 Draw! (${scores.black} - ${scores.white})`;
    statusElement.textContent = message;
    statusElement.style.animation = 'pulse 0.5s ease-in-out';
  }

  highlightTurn() {
    const turnElement = document.getElementById('currentTurn');
    if (turnElement) {
      turnElement.style.animation = 'highlight 0.5s ease-in-out';
      setTimeout(() => { turnElement.style.animation = ''; }, 500);
    }
  }

  showAIThinking() {
    const statusElement = document.getElementById('gameStatus');
    if (statusElement) {
      statusElement.textContent = '🤖 AI is thinking...';
      statusElement.style.animation = 'spin 1s linear infinite';
    }
  }

  hideAIThinking() {
    const statusElement = document.getElementById('gameStatus');
    if (statusElement) statusElement.style.animation = '';
  }
}

export default StatusPanel;