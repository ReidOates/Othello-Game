/**
 * counterPanel.js
 * ================
 * Menampilkan statistik AI search (nodes, pruning, execution time, efficiency).
 * Update real-time setelah setiap AI move.
 */

import { formatNumber, formatTime } from '../utils/helpers.js';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COUNTER PANEL CLASS
 * ═══════════════════════════════════════════════════════════════════════════
 */

export class CounterPanel {
  /**
   * Constructor
   * @param {string|HTMLElement} container
   */
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

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * INITIALIZATION
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Create panel elements
   * @private
   */
  _createElements() {
    this.containerElement.innerHTML = `
      <div class="counter-panel">
        <div class="counter-section">
          <h3>Search Statistics</h3>
          <table class="stats-table">
            <tbody>
              <tr>
                <td class="label">Algorithm:</td>
                <td class="value" id="algorithm">Minimax</td>
              </tr>
              <tr>
                <td class="label">Depth:</td>
                <td class="value" id="depth">3</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="counter-section">
          <h3>Node Evaluation</h3>
          <table class="stats-table">
            <tbody>
              <tr>
                <td class="label">Nodes Evaluated:</td>
                <td class="value" id="nodesEvaluated">0</td>
              </tr>
              <tr>
                <td class="label">Nodes Pruned:</td>
                <td class="value" id="nodesPruned">0</td>
              </tr>
              <tr>
                <td class="label">Total Nodes:</td>
                <td class="value" id="totalNodes">0</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="counter-section">
          <h3>Performance</h3>
          <table class="stats-table">
            <tbody>
              <tr>
                <td class="label">Execution Time:</td>
                <td class="value" id="executionTime">0ms</td>
              </tr>
              <tr>
                <td class="label">Efficiency:</td>
                <td class="value" id="efficiency">0%</td>
              </tr>
              <tr>
                <td class="label">Nodes/sec:</td>
                <td class="value" id="throughput">0</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="counter-section">
          <h3>Alpha-Beta Details</h3>
          <table class="stats-table">
            <tbody>
              <tr>
                <td class="label">Alpha Cutoffs:</td>
                <td class="value" id="alphaCutoffs">-</td>
              </tr>
              <tr>
                <td class="label">Beta Cutoffs:</td>
                <td class="value" id="betaCutoffs">-</td>
              </tr>
              <tr>
                <td class="label">Total Cutoffs:</td>
                <td class="value" id="totalCutoffs">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="counter-section">
          <h3>Decision Info</h3>
          <div class="info-item">
            <span class="label">Best Move:</span>
            <span class="value" id="bestMove">-</span>
          </div>
          <div class="info-item">
            <span class="label">Best Score:</span>
            <span class="value" id="bestScore">0</span>
          </div>
        </div>

        <div class="counter-section">
          <button id="clearStatsBtn" class="clear-btn">Clear Stats</button>
        </div>
      </div>
    `;

    // Setup event listeners
    document.getElementById('clearStatsBtn')?.addEventListener('click', () => this.clearStats());
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * UPDATE FUNCTIONS
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Update algorithm display
   * @param {string} algorithm - 'minimax' atau 'alphabeta'
   */
  updateAlgorithm(algorithm) {
    const element = document.getElementById('algorithm');
    if (element) {
      element.textContent = algorithm === 'minimax' ? 'Minimax' : 'Alpha-Beta Pruning';
    }
  }

  /**
   * Update search depth
   * @param {number} depth
   */
  updateDepth(depth) {
    const element = document.getElementById('depth');
    if (element) {
      element.textContent = depth;
    }
  }

  /**
   * Update nodes evaluated
   * @param {number} count
   */
  updateNodesEvaluated(count) {
    const element = document.getElementById('nodesEvaluated');
    if (element) {
      element.textContent = formatNumber(count);
    }
    this._updateTotalNodes();
  }

  /**
   * Update nodes pruned
   * @param {number} count
   */
  updateNodesPruned(count) {
    const element = document.getElementById('nodesPruned');
    if (element) {
      element.textContent = formatNumber(count);
    }
    this._updateTotalNodes();
  }

  /**
   * Update total nodes internally
   * @private
   */
  _updateTotalNodes() {
    const evaluatedText = document.getElementById('nodesEvaluated')?.textContent || '0';
    const prunedText = document.getElementById('nodesPruned')?.textContent || '0';

    const evaluated = parseInt(evaluatedText.replace(/,/g, ''));
    const pruned = parseInt(prunedText.replace(/,/g, ''));
    const total = evaluated + pruned;

    const totalElement = document.getElementById('totalNodes');
    if (totalElement) {
      totalElement.textContent = formatNumber(total);
    }

    // Update efficiency
    if (total > 0) {
      const efficiency = ((pruned / total) * 100).toFixed(1);
      const efficiencyElement = document.getElementById('efficiency');
      if (efficiencyElement) {
        efficiencyElement.textContent = efficiency + '%';
      }
    }
  }

  /**
   * Update execution time
   * @param {number} time - milliseconds
   */
  updateExecutionTime(time) {
    const element = document.getElementById('executionTime');
    if (element) {
      element.textContent = time.toFixed(2) + 'ms';
    }

    // Update throughput (nodes/sec)
    this._updateThroughput();
  }

  /**
   * Update throughput (nodes per second)
   * @private
   */
  _updateThroughput() {
    const timeText = document.getElementById('executionTime')?.textContent || '0ms';
    const nodesText = document.getElementById('nodesEvaluated')?.textContent || '0';

    const time = parseFloat(timeText) / 1000; // Convert to seconds
    const nodes = parseInt(nodesText.replace(/,/g, ''));

    if (time > 0) {
      const throughput = (nodes / time).toFixed(0);
      const element = document.getElementById('throughput');
      if (element) {
        element.textContent = formatNumber(throughput);
      }
    }
  }

  /**
   * Update Alpha-Beta cutoff statistics
   * @param {Object} stats - {cutoffsAlpha, cutoffsBeta}
   */
  updateAlphaBetaCutoffs(stats) {
    const alphaElement = document.getElementById('alphaCutoffs');
    const betaElement = document.getElementById('betaCutoffs');
    const totalElement = document.getElementById('totalCutoffs');

    if (alphaElement) {
      alphaElement.textContent = stats.cutoffsAlpha || '-';
    }
    if (betaElement) {
      betaElement.textContent = stats.cutoffsBeta || '-';
    }
    if (totalElement) {
      const total = (stats.cutoffsAlpha || 0) + (stats.cutoffsBeta || 0);
      totalElement.textContent = total || '-';
    }
  }

  /**
   * Update best move information
   * @param {Object} move - {row, col}
   * @param {number} score
   */
  updateBestMove(move, score) {
    if (!move) {
      document.getElementById('bestMove').textContent = '-';
      document.getElementById('bestScore').textContent = '0';
      return;
    }

    const colLetter = String.fromCharCode(97 + move.col);
    const rowNumber = 8 - move.row;
    const notation = `${colLetter}${rowNumber}`;

    const moveElement = document.getElementById('bestMove');
    const scoreElement = document.getElementById('bestScore');

    if (moveElement) moveElement.textContent = notation;
    if (scoreElement) scoreElement.textContent = score;
  }

  /**
   * Update complete statistics
   * @param {Object} stats - Statistics object dari AI
   */
  updateStats(stats) {
    if (!stats) return;

    if (stats.nodesEvaluated !== undefined) {
      this.updateNodesEvaluated(stats.nodesEvaluated);
    }
    if (stats.nodesPruned !== undefined) {
      this.updateNodesPruned(stats.nodesPruned);
    }
    if (stats.executionTime !== undefined) {
      this.updateExecutionTime(stats.executionTime);
    }
    if (stats.algorithm) {
      this.updateAlgorithm(stats.algorithm);
    }
    if (stats.depth) {
      this.updateDepth(stats.depth);
    }
    if (stats.cutoffsAlpha !== undefined || stats.cutoffsBeta !== undefined) {
      this.updateAlphaBetaCutoffs(stats);
    }
    if (stats.bestMove && stats.bestScore !== undefined) {
      this.updateBestMove(stats.bestMove, stats.bestScore);
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * UTILITY FUNCTIONS
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Clear all statistics
   */
  clearStats() {
    document.getElementById('nodesEvaluated').textContent = '0';
    document.getElementById('nodesPruned').textContent = '0';
    document.getElementById('totalNodes').textContent = '0';
    document.getElementById('executionTime').textContent = '0ms';
    document.getElementById('efficiency').textContent = '0%';
    document.getElementById('throughput').textContent = '0';
    document.getElementById('alphaCutoffs').textContent = '-';
    document.getElementById('betaCutoffs').textContent = '-';
    document.getElementById('totalCutoffs').textContent = '-';
    document.getElementById('bestMove').textContent = '-';
    document.getElementById('bestScore').textContent = '0';
  }

  /**
   * Show loading animation
   */
  showLoading() {
    const container = this.containerElement;
    if (container) {
      container.classList.add('loading');
    }
  }

  /**
   * Hide loading animation
   */
  hideLoading() {
    const container = this.containerElement;
    if (container) {
      container.classList.remove('loading');
    }
  }

  /**
   * Get current stats as object
   * @returns {Object}
   */
  getStats() {
    return {
      algorithm: document.getElementById('algorithm')?.textContent,
      depth: parseInt(document.getElementById('depth')?.textContent) || 0,
      nodesEvaluated: parseInt(
        document.getElementById('nodesEvaluated')?.textContent.replace(/,/g, '') || 0
      ),
      nodesPruned: parseInt(
        document.getElementById('nodesPruned')?.textContent.replace(/,/g, '') || 0
      ),
      executionTime: parseFloat(document.getElementById('executionTime')?.textContent) || 0,
      efficiency: parseFloat(document.getElementById('efficiency')?.textContent) || 0,
    };
  }
}

export default CounterPanel;
