/**
 * game.js
 * =======
 * Manajemen state game Othello dan game flow.
 * Mengatur:
 * - Turn (siapa main)
 * - Game mode (Human vs AI, Human vs Human)
 * - Algoritma AI (Minimax, Alpha-Beta)
 * - Game status (playing, game over, winner)
 * - Event callbacks untuk UI
 */

import { EMPTY, BLACK, WHITE, GAME_MODE, ALGORITHM } from '../utils/constants.js';
import { hasValidMoves, isGameOver, mustPass, generateMoves } from '../ai/moveGenerator.js';
import Board from './board.js';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GAME CLASS
 * ═══════════════════════════════════════════════════════════════════════════
 */

export class Game {
  /**
   * Constructor - Inisialisasi game
   * @param {Object} config - Configuration object
   * @param {string} config.gameMode - 'human_vs_ai' atau 'human_vs_human'
   * @param {string} config.algorithm - 'minimax' atau 'alphabeta'
   * @param {number} config.depth - Kedalaman search (1-5)
   * @param {number} config.humanPlayer - BLACK(1) atau WHITE(-1)
   * @param {Object} config.callbacks - Event callbacks
   */
  constructor(config = {}) {
    // Game configuration
    this.gameMode = config.gameMode || GAME_MODE.HUMAN_VS_AI;
    this.algorithm = config.algorithm || ALGORITHM.MINIMAX;
    this.depth = config.depth || 3;
    this.humanPlayer = config.humanPlayer || BLACK;
    
    // Board state
    this.board = new Board();
    
    // Game flow
    this.currentPlayer = BLACK; // Black always starts
    this.gameStatus = 'playing';
    this.winner = null;
    this.isAIThinking = false;
    this.lastMove = null;
    
    // Statistics
    this.stats = {
      nodesEvaluated: 0,
      nodesPruned: 0,
      executionTime: 0,
      algorithm: this.algorithm,
      depth: this.depth,
    };
    
    // Event callbacks
    this.callbacks = {
      onBoardChange: config.callbacks?.onBoardChange || (() => {}),
      onTurnChange: config.callbacks?.onTurnChange || (() => {}),
      onMoveExecuted: config.callbacks?.onMoveExecuted || (() => {}),
      onGameOver: config.callbacks?.onGameOver || (() => {}),
      onAIThinking: config.callbacks?.onAIThinking || (() => {}),
      onAIMoveSelected: config.callbacks?.onAIMoveSelected || (() => {}),
      onPass: config.callbacks?.onPass || (() => {}),
      ...config.callbacks,
    };
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * GAME STATE QUERIES
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Get current game state
   * @returns {Object}
   */
  getGameState() {
    const discCounts = this.board.getDiscCounts();
    return {
      gameMode: this.gameMode,
      algorithm: this.algorithm,
      depth: this.depth,
      currentPlayer: this.currentPlayer,
      gameStatus: this.gameStatus,
      winner: this.winner,
      isAIThinking: this.isAIThinking,
      discCounts,
      moveCount: this.board.getMoveCount(),
    };
  }

  /**
   * Get current player
   * @returns {number} BLACK atau WHITE
   */
  getCurrentPlayer() {
    return this.currentPlayer;
  }

  /**
   * Cek apakah current player adalah human
   * @returns {boolean}
   */
  isHumanTurn() {
    return this.currentPlayer === this.humanPlayer;
  }

  /**
   * Cek apakah current player adalah AI
   * @returns {boolean}
   */
  isAITurn() {
    return !this.isHumanTurn() && this.gameMode === GAME_MODE.HUMAN_VS_AI;
  }

  /**
   * Get game status
   * @returns {string} 'playing', 'black_win', 'white_win', 'draw', 'game_over'
   */
  getGameStatus() {
    return this.gameStatus;
  }

  /**
   * Cek apakah game sudah berakhir
   * @returns {boolean}
   */
  isGameOver() {
    return this.gameStatus !== 'playing';
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * MOVE EXECUTION
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Human player make move
   * @param {number} row - Target row
   * @param {number} col - Target col
   * @returns {boolean} true jika move valid dan executed
   */
  playerMove(row, col) {
    // Validasi turn
    if (this.currentPlayer !== this.humanPlayer) {
      console.warn('Not human turn');
      return false;
    }
    
    if (this.isAIThinking) {
      console.warn('AI is thinking, please wait');
      return false;
    }
    
    if (this.isGameOver()) {
      console.warn('Game already over');
      return false;
    }
    
    // Execute move
    const moveResult = this.board.makeMove(row, col, this.currentPlayer);
    if (!moveResult) {
      console.warn('Invalid move');
      return false;
    }
    
    this.lastMove = { row, col, player: this.currentPlayer };
    this.callbacks.onMoveExecuted(moveResult);
    
    // Update game state
    this._advanceTurn();
    
    return true;
  }

  /**
   * AI make move (internal function)
   * Called by AI evaluation functions
   * @param {number} row
   * @param {number} col
   */
  aiMove(row, col, stats = {}) {
    const moveResult = this.board.makeMove(row, col, this.currentPlayer);
    if (!moveResult) {
      console.warn('AI move invalid:', row, col);
      return false;
    }
    
    // Update stats
    this.stats = {
      ...this.stats,
      ...stats,
    };
    
    this.lastMove = { row, col, player: this.currentPlayer };
    this.callbacks.onMoveExecuted(moveResult);
    
    // Update game state
    this._advanceTurn();
    
    return true;
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * TURN MANAGEMENT
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Advance turn (internal)
   * Handle pass, end game, etc
   * @private
   */
  _advanceTurn() {
    const board = this.board.getBoard();
    const nextPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
    
    // Notify UI about board change
    this.callbacks.onBoardChange(this.board.getBoard());
    
    // Check if next player can move
    if (hasValidMoves(board, nextPlayer)) {
      // Next player can move
      this.currentPlayer = nextPlayer;
      this.callbacks.onTurnChange(this.currentPlayer);
    } else if (hasValidMoves(board, this.currentPlayer)) {
      // Next player must pass, current player moves again
      this.callbacks.onPass(nextPlayer);
      // Don't change currentPlayer, same player goes again
    } else {
      // Both players have no valid moves = game over
      this._endGame();
      return;
    }
  }

  /**
   * Skip turn (pass) - jika current player tidak punya move
   * Return true jika pass valid (current player punya no move)
   * @returns {boolean}
   */
  pass() {
    const board = this.board.getBoard();
    
    if (hasValidMoves(board, this.currentPlayer)) {
      console.warn('Current player still has valid moves');
      return false;
    }
    
    const nextPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
    
    if (hasValidMoves(board, nextPlayer)) {
      this.currentPlayer = nextPlayer;
      this.callbacks.onTurnChange(this.currentPlayer);
      return true;
    } else {
      // Both players have no move
      this._endGame();
      return true;
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * GAME END
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * End game dan tentukan winner
   * @private
   */
  _endGame() {
    const { black, white } = this.board.getDiscCounts();
    
    this.gameStatus = 'game_over';
    
    if (black > white) {
      this.gameStatus = 'black_win';
      this.winner = BLACK;
    } else if (white > black) {
      this.gameStatus = 'white_win';
      this.winner = WHITE;
    } else {
      this.gameStatus = 'draw';
      this.winner = null;
    }
    
    this.callbacks.onGameOver({
      status: this.gameStatus,
      winner: this.winner,
      scores: { black, white },
    });
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * UNDO & RESET
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Undo last move(s)
   * Jika Human vs AI:
   *   - Undo akan di-revert 2 moves (AI + Human)
   *   - Atau 1 move jika yang terakhir human (AI belum move)
   * Jika Human vs Human:
   *   - Undo 1 move
   * @returns {boolean} true jika undo successful
   */
  undo() {
    if (this.board.getMoveCount() === 0) {
      console.warn('No moves to undo');
      return false;
    }
    
    if (this.isGameOver()) {
      // Reset game status jika game over saat undo
      this.gameStatus = 'playing';
      this.winner = null;
    }
    
    // Undo 1 move
    this.board.undoLastMove();
    
    // Jika Human vs AI dan move terakhir adalah AI move, undo lagi
    if (this.gameMode === GAME_MODE.HUMAN_VS_AI && this.board.getMoveCount() > 0) {
      const lastMove = this.board.getLastMove();
      if (lastMove && lastMove.player !== this.humanPlayer) {
        this.board.undoLastMove();
      }
    }
    
    // Reset turn ke player yang seharusnya
    this.currentPlayer = BLACK;
    for (let move of this.board.getMoveHistory()) {
      this.currentPlayer = move.player === BLACK ? WHITE : BLACK;
    }
    
    this.callbacks.onBoardChange(this.board.getBoard());
    this.callbacks.onTurnChange(this.currentPlayer);
    
    return true;
  }

  /**
   * New game (reset)
   */
  newGame() {
    this.board.reset();
    this.currentPlayer = BLACK;
    this.gameStatus = 'playing';
    this.winner = null;
    this.isAIThinking = false;
    this.lastMove = null;
    this.stats = {
      nodesEvaluated: 0,
      nodesPruned: 0,
      executionTime: 0,
      algorithm: this.algorithm,
      depth: this.depth,
    };
    
    this.callbacks.onBoardChange(this.board.getBoard());
    this.callbacks.onTurnChange(this.currentPlayer);
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * CONFIGURATION CHANGES
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Change game algorithm
   * @param {string} algorithm - 'minimax' atau 'alphabeta'
   */
  setAlgorithm(algorithm) {
    if (algorithm !== ALGORITHM.MINIMAX && algorithm !== ALGORITHM.ALPHABETA) {
      console.warn('Invalid algorithm:', algorithm);
      return;
    }
    this.algorithm = algorithm;
    this.stats.algorithm = algorithm;
  }

  /**
   * Change search depth
   * @param {number} depth - 1-5
   */
  setDepth(depth) {
    if (depth < 1 || depth > 5) {
      console.warn('Depth must be 1-5');
      return;
    }
    this.depth = depth;
    this.stats.depth = depth;
  }

  /**
   * Change game mode
   * @param {string} gameMode - 'human_vs_ai' atau 'human_vs_human'
   */
  setGameMode(gameMode) {
    if (gameMode !== GAME_MODE.HUMAN_VS_AI && gameMode !== GAME_MODE.HUMAN_VS_HUMAN) {
      console.warn('Invalid game mode:', gameMode);
      return;
    }
    this.gameMode = gameMode;
  }

  /**
   * Set human player color
   * @param {number} player - BLACK(1) atau WHITE(-1)
   */
  setHumanPlayer(player) {
    if (player !== BLACK && player !== WHITE) {
      console.warn('Invalid player:', player);
      return;
    }
    this.humanPlayer = player;
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * STATISTICS
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Get game statistics
   * @returns {Object}
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Update stats dari AI
   * @param {Object} stats
   */
  updateStats(stats) {
    this.stats = {
      ...this.stats,
      ...stats,
    };
  }

  /**
   * Reset stats
   */
  resetStats() {
    this.stats = {
      nodesEvaluated: 0,
      nodesPruned: 0,
      executionTime: 0,
      algorithm: this.algorithm,
      depth: this.depth,
    };
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * BOARD ACCESS
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Get board reference (untuk AI algorithms)
   * @returns {Board}
   */
  getBoardInstance() {
    return this.board;
  }

  /**
   * Get board array
   * @returns {number[]}
   */
  getBoard() {
    return this.board.getBoard();
  }

  /**
   * Get board 2D
   * @returns {number[][]}
   */
  getBoard2D() {
    return this.board.getBoard2D();
  }

  /**
   * Get last move
   * @returns {Object|null}
   */
  getLastMove() {
    return this.lastMove;
  }

  /**
   * Get valid moves for the current player
   * @returns {Array} Array of move objects
   */
  getValidMoves() {
    return generateMoves(this.board.getBoard(), this.currentPlayer);
  }
}

export default Game;
