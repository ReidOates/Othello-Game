/**
 * board.js
 * ========
 * Manajemen state board Othello dan logika permainan.
 * Bertanggung jawab atas:
 * - Inisialisasi board awal
 * - Track state permainan
 * - Record history moves (untuk undo)
 * - Query board state
 */

import { 
  BOARD_SIZE, 
  EMPTY, 
  BLACK, 
  WHITE 
} from '../utils/constants.js';

import { 
  cloneBoard, 
  coordsToIndex, 
  countDiscs 
} from '../utils/helpers.js';

import { 
  applyMove, 
  getAllFlips,
  generateMoves 
} from '../ai/moveGenerator.js';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BOARD CLASS
 * ═══════════════════════════════════════════════════════════════════════════
 */

export class Board {
  /**
   * Constructor - Inisialisasi board Othello 8×8 dengan setup awal standar
   * 
   * Setup awal:
   *   d4 = Black (1)
   *   e5 = Black (1)
   *   d5 = White (-1)
   *   e4 = White (-1)
   * 
   * Notasi chess-like: a1 = bottom-left, h8 = top-right
   */
  constructor() {
    this.board = new Array(BOARD_SIZE * BOARD_SIZE).fill(EMPTY);
    this.history = [];
    this.moveHistory = [];
    
    // Setup awal (4 disc di tengah board)
    // d4 (row=4, col=3): Black
    this.board[coordsToIndex(4, 3)] = BLACK;
    // e5 (row=3, col=4): Black
    this.board[coordsToIndex(3, 4)] = BLACK;
    // d5 (row=3, col=3): White
    this.board[coordsToIndex(3, 3)] = WHITE;
    // e4 (row=4, col=4): White
    this.board[coordsToIndex(4, 4)] = WHITE;
    
    // Save initial state to history
    this.history.push(cloneBoard(this.board));
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * BOARD STATE QUERIES
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Get current board state (1D array)
   * @returns {number[]}
   */
  getBoard() {
    return cloneBoard(this.board);
  }

  /**
   * Get cell value at (row, col)
   * @param {number} row
   * @param {number} col
   * @returns {number} EMPTY(0), BLACK(1), WHITE(-1)
   */
  getCell(row, col) {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      return null;
    }
    return this.board[coordsToIndex(row, col)];
  }

  /**
   * Get board sebagai 2D array (untuk visualisasi)
   * @returns {number[][]} 8×8 matrix
   */
  getBoard2D() {
    const board2D = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      board2D.push(this.board.slice(i * BOARD_SIZE, (i + 1) * BOARD_SIZE));
    }
    return board2D;
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * MOVE EXECUTION
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Execute move untuk player
   * Return info tentang move (flips, dst) atau null jika invalid
   * 
   * @param {number} row - Target row
   * @param {number} col - Target col
   * @param {number} player - Player (BLACK atau WHITE)
   * @returns {Object|null} {row, col, flips, flipCount, boardBefore, boardAfter}
   */
  makeMove(row, col, player) {
    // Get current board state
    const boardBefore = cloneBoard(this.board);
    
    // Get flips yang akan happen
    const flips = getAllFlips(this.board, row, col, player);
    
    if (flips.length === 0) {
      console.warn(`Invalid move attempt: (${row}, ${col}) for player ${player}`);
      return null;
    }
    
    // Apply move
    const newBoard = applyMove(this.board, row, col, player);
    
    if (!newBoard) return null;
    
    // Update board
    this.board = newBoard;
    
    // Record to history
    this.history.push(cloneBoard(this.board));
    this.moveHistory.push({
      row,
      col,
      player,
      flips: [...flips],
      timestamp: Date.now(),
    });
    
    return {
      row,
      col,
      flips,
      flipCount: flips.length,
      boardBefore,
      boardAfter: cloneBoard(this.board),
    };
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * UNDO & HISTORY
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Undo last move (1 langkah ke belakang)
   * @returns {Object|null} Move yang di-undo, atau null jika tidak ada move
   */
  undoLastMove() {
    if (this.moveHistory.length === 0) {
      console.warn('No moves to undo');
      return null;
    }
    
    // Remove last move from history
    const lastMove = this.moveHistory.pop();
    this.history.pop();
    
    // Restore board to previous state
    if (this.history.length > 0) {
      this.board = cloneBoard(this.history[this.history.length - 1]);
    } else {
      // Reset ke initial state jika history kosong
      this.board = new Array(BOARD_SIZE * BOARD_SIZE).fill(EMPTY);
      this.board[coordsToIndex(4, 3)] = BLACK;
      this.board[coordsToIndex(3, 4)] = BLACK;
      this.board[coordsToIndex(3, 3)] = WHITE;
      this.board[coordsToIndex(4, 4)] = WHITE;
    }
    
    return lastMove;
  }

  /**
   * Get move history
   * @returns {Array} Array of moves
   */
  getMoveHistory() {
    return [...this.moveHistory];
  }

  /**
   * Get last move
   * @returns {Object|null}
   */
  getLastMove() {
    if (this.moveHistory.length === 0) return null;
    return this.moveHistory[this.moveHistory.length - 1];
  }

  /**
   * Get number of moves made
   * @returns {number}
   */
  getMoveCount() {
    return this.moveHistory.length;
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * BOARD STATISTICS
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Get disc counts
   * @returns {{black: number, white: number, empty: number}}
   */
  getDiscCounts() {
    const { black, white } = countDiscs(this.board);
    const empty = BOARD_SIZE * BOARD_SIZE - black - white;
    return { black, white, empty };
  }

  /**
   * Get score (black - white)
   * @returns {{black: number, white: number, diff: number}}
   */
  getScore() {
    const { black, white } = this.getDiscCounts();
    return {
      black,
      white,
      diff: black - white, // negative = white winning, positive = black winning
    };
  }

  /**
   * Hitung jumlah valid moves untuk player
   * @param {number} player
   * @returns {number}
   */
  countValidMoves(player) {
    const moves = generateMoves(this.board, player);
    return moves.length;
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * BOARD RESET
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Reset board ke initial state (setup awal)
   */
  reset() {
    this.board = new Array(BOARD_SIZE * BOARD_SIZE).fill(EMPTY);
    
    // Setup awal
    this.board[coordsToIndex(4, 3)] = BLACK;
    this.board[coordsToIndex(3, 4)] = BLACK;
    this.board[coordsToIndex(3, 3)] = WHITE;
    this.board[coordsToIndex(4, 4)] = WHITE;
    
    // Clear history
    this.history = [cloneBoard(this.board)];
    this.moveHistory = [];
  }

  /**
   * Create new game (alias untuk reset)
   */
  newGame() {
    this.reset();
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * BOARD ANALYSIS
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Get board state string untuk hashing / comparison
   * @returns {string}
   */
  getBoardHash() {
    return this.board.join('');
  }

  /**
   * Compare dengan board lain
   * @param {number[]} otherBoard
   * @returns {boolean}
   */
  isSameBoardState(otherBoard) {
    return this.getBoardHash() === otherBoard.join('');
  }

  /**
   * Get board complexity (heuristic untuk move ordering)
   * Semakin kompleks = semakin banyak disc = semakin akhir game
   * @returns {number} 0-1 scale
   */
  getComplexity() {
    const { black, white, empty } = this.getDiscCounts();
    const filled = black + white;
    return filled / (BOARD_SIZE * BOARD_SIZE);
  }

  /**
   * Get board pressure (heuristic mobility analysis)
   * Ratio antara mobility kedua player
   * @returns {{black: number, white: number, ratio: number}}
   */
  getBoardPressure() {
    const blackMobility = this.countValidMoves(BLACK);
    const whiteMobility = this.countValidMoves(WHITE);
    
    const total = blackMobility + whiteMobility;
    
    return {
      black: blackMobility,
      white: whiteMobility,
      ratio: total === 0 ? 0 : blackMobility / total,
    };
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * DEBUG & VISUALIZATION
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Print board state ke console
   */
  print() {
    console.log('\n┌─────────────────────────┐');
    for (let row = 0; row < BOARD_SIZE; row++) {
      let line = '│ ';
      for (let col = 0; col < BOARD_SIZE; col++) {
        const cell = this.getCell(row, col);
        if (cell === 1) line += '● ';
        else if (cell === -1) line += '○ ';
        else line += '· ';
      }
      console.log(line + '│');
    }
    console.log('└─────────────────────────┘\n');
  }

  /**
   * Get detailed board info
   * @returns {Object}
   */
  getInfo() {
    const { black, white, empty } = this.getDiscCounts();
    const { black: blackMoves, white: whiteMoves } = this.getBoardPressure();
    
    return {
      moveCount: this.getMoveCount(),
      discCounts: { black, white, empty },
      validMoves: { black: blackMoves, white: whiteMoves },
      boardHash: this.getBoardHash(),
      complexity: this.getComplexity(),
    };
  }
}

export default Board;
