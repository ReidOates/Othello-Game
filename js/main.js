/**
 * main.js
 * =======
 * Entry point aplikasi Othello AI.
 * Menghubungkan Game logic, AI algorithms, dan UI components.
 * Mengatur game flow dan event handling.
 */

import Game from './game.js';
import { BOARD_SIZE, BLACK, WHITE, GAME_MODE, ALGORITHM } from '../utils/constants.js';
import Minimax from '../ai/minimax.js';
import AlphaBeta from '../ai/alphabeta.js';
import { formatNumber, log, coordsToNotation } from '../utils/helpers.js';

// UI Components
import BoardRenderer from '../ui/renderer.js';
import StatusPanel from '../ui/statusPanel.js';
import CounterPanel from '../ui/counterPanel.js';
import SettingsPanel from '../ui/settingsPanel.js';
import TreeVisualizer from '../ui/treeVisualizer.js';

/** 
 * ═══════════════════════════════════════════════════════════════════════════
 * APPLICATION STATE
 * ═══════════════════════════════════════════════════════════════════════════
 */

let gameInstance = null;
let currentAlgorithm = ALGORITHM.MINIMAX;
let currentDepth = 3;
let isAIThinking = false;

// UI Component Instances
let boardRenderer = null;
let statusPanel = null;
let counterPanel = null;
let settingsPanel = null;
let treeVisualizer = null;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INITIALIZATION
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Initialize aplikasi
 */
async function initializeApp() {
  log('🚀 Initializing Othello AI Application...');

  try {
    // Create game instance dengan callbacks
    gameInstance = new Game({
      gameMode: GAME_MODE.HUMAN_VS_AI,
      algorithm: currentAlgorithm,
      depth: currentDepth,
      humanPlayer: BLACK,
      callbacks: {
        onBoardChange: handleBoardChange,
        onTurnChange: handleTurnChange,
        onMoveExecuted: handleMoveExecuted,
        onGameOver: handleGameOver,
        onPass: handlePassMove,
      },
    });

    // Initialize UI Components
    initializeUIComponents();

    // Setup event listeners
    setupEventListeners();

    // Load theme preference
    loadThemePreference();

    log('✅ Application initialized successfully!');

    // Initial render
    renderBoard();
    updateStatusPanel();
    updateCounterPanel();

  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    showNotification('Failed to initialize application: ' + error.message, 'error');
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * UI COMPONENTS INITIALIZATION
 * ─────────────────────────────────────────────────────────────────────────
 */

function initializeUIComponents() {
  log('Initializing UI components...');

  // Board Renderer
  const boardContainer = document.getElementById('board-container');
  if (boardContainer) {
    boardRenderer = new BoardRenderer(boardContainer, 50);
    boardRenderer.onCellClick(({ row, col }) => handleBoardClick(row, col));
  }

  // Status Panel & Tombol Restart
  const statusPanelContainer = document.getElementById('status-panel-container');
  if (statusPanelContainer) {
    statusPanel = new StatusPanel(statusPanelContainer);

    const restartBtn = document.getElementById('restartGameBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        if (gameInstance) {
          gameInstance.newGame();
          renderBoard();
          updateStatusPanel();
          updateCounterPanel();
          if (treeVisualizer) treeVisualizer.clear();
        }
      });
    }
  }

  // Counter Panel (Statistics)
  const counterPanelContainer = document.getElementById('counter-panel-container');
  if (counterPanelContainer) {
    counterPanel = new CounterPanel(counterPanelContainer);
    const clearBtn = counterPanel.containerElement.querySelector('#clearStatsBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        counterPanel.clearStats();
      });
    }
  }

  // Settings Panel & Listeners
  const settingsPanelContainer = document.getElementById('settings-panel-container');
  if (settingsPanelContainer) {
    settingsPanel = new SettingsPanel(settingsPanelContainer);

    // Register settings callbacks
    settingsPanel.on('onAlgorithmChange', handleAlgorithmChange);
    settingsPanel.on('onDepthChange', handleDepthChange);
    settingsPanel.on('onGameModeChange', handleGameModeChange);
    settingsPanel.on('onSettingsApply', handleSettingsApply);

    // Render ulang board ketika checkbox valid moves diubah
    settingsPanel.on('onShowValidMovesChange', renderBoard);

    // Tampilkan/Sembunyikan Tree Section seketika saat checkbox dicentang
    settingsPanel.on('onShowGameTreeChange', (isChecked) => {
      const treeSection = document.getElementById('treeSection');
      if (treeSection) {
        treeSection.style.display = isChecked ? 'block' : 'none';
      }
    });
  }

  // Tree Visualizer
  const treeContainer = document.getElementById('tree-visualizer-container');
  if (treeContainer) {
    treeVisualizer = new TreeVisualizer(treeContainer, 1200, 600);
  }

  log('✓ UI components initialized');
}

/**
 * Setup event listeners untuk UI
 */
function setupEventListeners() {
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', handleThemeToggle);
  }
  document.addEventListener('keydown', handleKeyboard);
  log('✓ Event listeners setup');
}

/**
 * Handle settings apply
 */
function handleSettingsApply(settings) {
  log('Settings applied:', settings);
  renderBoard();
  updateStatusPanel();
  updateCounterPanel();

  const treeSection = document.getElementById('treeSection');
  if (treeSection) {
    treeSection.style.display = settings.showGameTree ? 'block' : 'none';
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GAME LOGIC HANDLERS
 * ═══════════════════════════════════════════════════════════════════════════
 */

function handleBoardClick(row, col) {
  if (!gameInstance || gameInstance.isGameOver() || isAIThinking) {
    if (isAIThinking) showNotification('⏳ AI is thinking...', 'warning');
    return;
  }

  if (!gameInstance.isHumanTurn()) {
    showNotification('⚠️ Not your turn', 'warning');
    return;
  }

  try {
    const moveSuccess = gameInstance.playerMove(row, col);
    if (moveSuccess) {
      log(`✓ Player moved to (${row}, ${col})`);
      renderBoard();
      updateStatusPanel();

      if (gameInstance.isAITurn() && !gameInstance.isGameOver()) {
        setTimeout(handleAIMove, 500);
      }
    } else {
      showNotification('❌ Invalid move!', 'error');
    }
  } catch (error) {
    console.error('Move error:', error);
    showNotification('Error executing move: ' + error.message, 'error');
  }
}

async function handleAIMove() {
  if (!gameInstance || gameInstance.isGameOver() || !gameInstance.isAITurn()) return;

  isAIThinking = true;
  updateStatusPanel();
  showNotification('🤖 AI is thinking...', 'info');

  try {
    const board = gameInstance.getBoard();
    const player = gameInstance.getCurrentPlayer();

    // Flag untuk AI biar dia tau harus ngebangun struktur tree atau enggak
    const showTree = settingsPanel?.getSettings().showGameTree;

    let solver;
    if (currentAlgorithm === ALGORITHM.MINIMAX) {
      solver = new Minimax({ maxDepth: currentDepth, buildTree: showTree });
    } else {
      solver = new AlphaBeta({ maxDepth: currentDepth, buildTree: showTree });
    }

    const startTime = performance.now();
    const result = solver.findBestMove(board, player);
    const endTime = performance.now();

    if (result && result.bestMove) {
      const stats = {
        nodesEvaluated: result.stats?.nodesEvaluated || 0,
        nodesPruned: result.stats?.nodesPruned || 0,
        cutoffsAlpha: result.stats?.cutoffsAlpha || 0,
        cutoffsBeta: result.stats?.cutoffsBeta || 0,
        executionTime: result.stats?.executionTime || (endTime - startTime),
        algorithm: currentAlgorithm,
        depth: currentDepth,
        bestScore: result.evaluation,
        bestMove: result.bestMove,
      };

      gameInstance.aiMove(result.bestMove.row, result.bestMove.col, stats);
      log(`✓ AI moved to (${result.bestMove.row}, ${result.bestMove.col}) - Score: ${result.evaluation}`);

      renderBoard();
      updateStatusPanel();
      updateCounterPanel();

      // Render Tree jika diaktifkan dan datanya ada
      if (treeVisualizer && showTree) {
        if (result.tree) {
          treeVisualizer.render(result.tree, { resetView: true });
        } else {
          treeVisualizer.clear();
        }
      }

      const moveNotation = coordsToNotation(result.bestMove.row, result.bestMove.col);
      showNotification(`🤖 AI moved to ${moveNotation} (score: ${result.evaluation})`, 'success');

      if (!gameInstance.isHumanTurn() && !gameInstance.isGameOver()) {
        showNotification('⚠️ You must pass your turn', 'warning');
        setTimeout(() => {
          gameInstance.pass();
          renderBoard();
          updateStatusPanel();
          setTimeout(handleAIMove, 500);
        }, 1000);
      }
    } else {
      showNotification('❌ No valid move found', 'error');
      if (gameInstance.pass()) {
        renderBoard();
        updateStatusPanel();
      }
    }
  } catch (error) {
    console.error('AI error:', error);
    showNotification('❌ AI error: ' + error.message, 'error');
  } finally {
    isAIThinking = false;
    updateStatusPanel();
  }
}

function handlePassMove(player) {
  log(`⚠️ ${player === BLACK ? 'Black' : 'White'} has no valid moves - pass`);
  showNotification(`⚠️ ${player === BLACK ? 'Black' : 'White'} must pass`, 'warning');
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * GAME CALLBACK HANDLERS
 * ─────────────────────────────────────────────────────────────────────────
 */

function handleBoardChange(board) {
  console.log('Board changed');
}

function handleTurnChange(player) {
  console.log(`Turn changed to ${player === BLACK ? 'BLACK' : 'WHITE'}`);
  updateStatusPanel();
}

function handleMoveExecuted(moveResult) {
  console.log(`Move executed: (${moveResult.row}, ${moveResult.col}), flips: ${moveResult.flipCount}`);
  if (boardRenderer && moveResult.flips && settingsPanel?.getSettings().enableAnimations) {
    boardRenderer.animateFlips(moveResult.flips);
  }
}

function handleGameOver(result) {
  console.log('Game over:', result);
  updateStatusPanel();
  updateCounterPanel();

  let message = '';
  if (result.status === 'black_win') {
    message = `Black wins! (${result.scores.black} - ${result.scores.white})`;
  } else if (result.status === 'white_win') {
    message = `White wins! (${result.scores.white} - ${result.scores.black})`;
  } else if (result.status === 'draw') {
    message = `Draw! (${result.scores.black} - ${result.scores.white})`;
  }

  showNotification(message, 'success');
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SETTING CHANGE HANDLERS
 * ─────────────────────────────────────────────────────────────────────────
 */

function handleAlgorithmChange(algorithm) {
  currentAlgorithm = algorithm;
  if (gameInstance) gameInstance.setAlgorithm(algorithm);
  log(`Algorithm changed to ${algorithm}`);
  showNotification(`🔧 Algorithm changed to ${algorithm}`, 'info');
}

function handleDepthChange(depth) {
  currentDepth = depth;
  if (gameInstance) gameInstance.setDepth(depth);
  log(`Search depth changed to ${depth}`);
  showNotification(`🔧 Search depth changed to ${depth}`, 'info');
}

function handleGameModeChange(gameMode) {
  if (gameInstance) {
    gameInstance.setGameMode(gameMode);
    gameInstance.newGame();
  }
  renderBoard();
  updateStatusPanel();
  updateCounterPanel();
  if (treeVisualizer) treeVisualizer.clear();
  log(`Game mode changed to ${gameMode}`);
  showNotification(`🔧 Game mode changed to ${gameMode}`, 'info');
}

function handleThemeToggle() {
  const body = document.body;
  const moonIcon = document.querySelector('.icon-moon');
  const sunIcon = document.querySelector('.icon-sun');

  if (body.classList.contains('dark-mode')) {
    body.classList.remove('dark-mode');
    body.classList.add('light-mode');
    if (moonIcon) moonIcon.classList.add('hidden');
    if (sunIcon) sunIcon.classList.remove('hidden');
    localStorage.setItem('theme', 'light');
  } else {
    body.classList.remove('light-mode');
    body.classList.add('dark-mode');
    if (moonIcon) moonIcon.classList.remove('hidden');
    if (sunIcon) sunIcon.classList.add('hidden');
    localStorage.setItem('theme', 'dark');
  }
  log('Theme toggled');
}

function handleKeyboard(event) {
  switch (event.key.toLowerCase()) {
    case 'n':
      if (event.ctrlKey) {
        event.preventDefault();
        if (gameInstance) gameInstance.newGame();
        renderBoard();
        updateStatusPanel();
        updateCounterPanel();
      }
      break;
    case 'z':
      if (event.ctrlKey) {
        event.preventDefault();
        if (gameInstance) gameInstance.undo();
        renderBoard();
        updateStatusPanel();
      }
      break;
    case 'p':
      if (event.ctrlKey) {
        event.preventDefault();
        if (gameInstance) gameInstance.pass();
        renderBoard();
        updateStatusPanel();
      }
      break;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RENDERING FUNCTIONS
 * ═══════════════════════════════════════════════════════════════════════════
 */

function renderBoard() {
  if (!gameInstance || !boardRenderer) return;

  const board = gameInstance.getBoard();
  const lastMove = gameInstance.getLastMove();
  const validMoves = gameInstance.getValidMoves();

  boardRenderer.render(board, {
    lastMove,
    validMoves: settingsPanel?.getSettings().showValidMoves ? validMoves : [],
  });
}

function updateStatusPanel() {
  if (!gameInstance || !statusPanel) return;

  const state = gameInstance.getGameState();
  statusPanel.updateCurrentTurn(state.currentPlayer);
  statusPanel.updateGameStatus(state.gameStatus);
  statusPanel.updateDiscCounts(state.discCounts); // Diubah agar sesuai dengan perombakan StatusPanel
  statusPanel.updateMoveCount(state.moveCount);
}

function updateCounterPanel() {
  if (!gameInstance || !counterPanel) return;

  const stats = gameInstance.getStats();

  counterPanel.updateStats({
    algorithm: currentAlgorithm,
    depth: currentDepth,
    nodesEvaluated: stats.nodesEvaluated || 0,
    nodesPruned: stats.nodesPruned || 0,
    cutoffsAlpha: stats.cutoffsAlpha || 0,
    cutoffsBeta: stats.cutoffsBeta || 0,
    executionTime: stats.executionTime || 0,
    nodesPerSecond: stats.executionTime > 0 ? (stats.nodesEvaluated / stats.executionTime * 1000).toFixed(0) : 0,
    efficiency: stats.nodesEvaluated + stats.nodesPruned > 0
      ? ((stats.nodesPruned / (stats.nodesEvaluated + stats.nodesPruned)) * 100).toFixed(1)
      : 0,
    bestMove: stats.bestMove,
    bestScore: stats.bestScore || stats.bestMoveScore,
  });
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UTILITY FUNCTIONS
 * ═══════════════════════════════════════════════════════════════════════════
 */

function showNotification(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
}

function loadThemePreference() {
  const theme = localStorage.getItem('theme') || 'dark';
  const body = document.body;
  const moonIcon = document.querySelector('.icon-moon');
  const sunIcon = document.querySelector('.icon-sun');

  if (theme === 'light') {
    body.classList.remove('dark-mode');
    body.classList.add('light-mode');
    if (moonIcon) moonIcon.classList.add('hidden');
    if (sunIcon) sunIcon.classList.remove('hidden');
  } else {
    body.classList.remove('light-mode');
    body.classList.add('dark-mode');
    if (moonIcon) moonIcon.classList.remove('hidden');
    if (sunIcon) sunIcon.classList.add('hidden');
  }
}

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * PUBLIC API & EXPORTS
 * ═════════════════════════════════════════════════════════════════════════════
 */

export {
  gameInstance,
  boardRenderer,
  statusPanel,
  counterPanel,
  settingsPanel,
  treeVisualizer,
  initializeApp,
  renderBoard,
  updateStatusPanel,
  updateCounterPanel,
  handleBoardClick,
  handleAIMove,
  handleThemeToggle,
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

export default {
  initializeApp,
  gameInstance,
};