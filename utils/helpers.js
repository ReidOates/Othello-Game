/**
 * helpers.js
 * ==========
 * Fungsi-fungsi utility dan helper yang digunakan di seluruh project.
 * Memusatkan logika umum untuk reusability dan maintainability.
 */

import { BOARD_SIZE, DIRECTIONS } from '../utils/constants.js';

/**
 * ─────────────────────────────────────────────────────────────────────────
 * ARRAY & BOARD MANIPULATION
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Konversi index 1D ke koordinat 2D (row, col)
 * @param {number} index - Index 1D (0-63)
 * @returns {[number, number]} [row, col]
 */
export function indexToCoords(index) {
  return [Math.floor(index / BOARD_SIZE), index % BOARD_SIZE];
}

/**
 * Konversi koordinat 2D (row, col) ke index 1D
 * @param {number} row - Baris (0-7)
 * @param {number} col - Kolom (0-7)
 * @returns {number} Index 1D (0-63)
 */
export function coordsToIndex(row, col) {
  return row * BOARD_SIZE + col;
}

/**
 * Cek apakah koordinat valid (dalam board)
 * @param {number} row - Baris
 * @param {number} col - Kolom
 * @returns {boolean}
 */
export function isValidCoord(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/**
 * Clone board (copy deep array 1D)
 * @param {number[]} board - Board original
 * @returns {number[]} Board yang di-clone
 */
export function cloneBoard(board) {
  return [...board];
}

/**
 * Clone board 2D jika dibutuhkan
 * @param {number[][]} board2D - Board 2D
 * @returns {number[][]} Board 2D yang di-clone
 */
export function cloneBoard2D(board2D) {
  return board2D.map(row => [...row]);
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * BOARD VISUALIZATION & CONVERSION
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Ubah board 1D ke format 2D (matrix 8×8)
 * @param {number[]} board1D - Array 1D dengan 64 elemen
 * @returns {number[][]} Array 2D 8×8
 */
export function board1DTo2D(board1D) {
  const board2D = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    board2D.push(board1D.slice(i * BOARD_SIZE, (i + 1) * BOARD_SIZE));
  }
  return board2D;
}

/**
 * Ubah board 2D ke format 1D
 * @param {number[][]} board2D - Array 2D 8×8
 * @returns {number[]} Array 1D dengan 64 elemen
 */
export function board2DTo1D(board2D) {
  return board2D.flat();
}

/**
 * Print board ke console untuk debugging
 * @param {number[]} board - Board 1D
 */
export function printBoard(board) {
  console.log('┌─────────────────────┐');
  for (let row = 0; row < BOARD_SIZE; row++) {
    let line = '│ ';
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = board[coordsToIndex(row, col)];
      if (cell === 1) line += '● ';        // Black disc
      else if (cell === -1) line += '○ '; // White disc
      else line += '· ';                  // Empty
    }
    console.log(line + '│');
  }
  console.log('└─────────────────────┘');
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * GAME STATE ANALYSIS
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Hitung jumlah disc untuk setiap pemain
 * @param {number[]} board - Board 1D
 * @returns {{black: number, white: number}} Jumlah disc
 */
export function countDiscs(board) {
  let black = 0, white = 0;
  for (let cell of board) {
    if (cell === 1) black++;
    else if (cell === -1) white++;
  }
  return { black, white };
}

/**
 * Hitung jumlah cell kosong
 * @param {number[]} board - Board 1D
 * @returns {number}
 */
export function countEmpty(board) {
  return board.filter(cell => cell === 0).length;
}

/**
 * Ambil semua posisi disc tertentu
 * @param {number[]} board - Board 1D
 * @param {number} player - Pemain (1 atau -1)
 * @returns {number[]} Array index posisi disc
 */
export function getPlayerDiscs(board, player) {
  return board
    .map((cell, index) => (cell === player ? index : -1))
    .filter(index => index !== -1);
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DIRECTION HELPERS
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Dapatkan nama arah (untuk debugging)
 * @param {number} dirIndex - Index dalam DIRECTIONS array (0-7)
 * @returns {string}
 */
export function getDirectionName(dirIndex) {
  const names = [
    'NW (↖)', 'N (↑)', 'NE (↗)',
    'W (←)',           'E (→)',
    'SW (↙)', 'S (↓)', 'SE (↘)',
  ];
  return names[dirIndex] || 'unknown';
}

/**
 * Cek apakah dua koordinat bersampingan (adjacent)
 * @param {number} row1 - Baris pertama
 * @param {number} col1 - Kolom pertama
 * @param {number} row2 - Baris kedua
 * @param {number} col2 - Kolom kedua
 * @returns {boolean}
 */
export function isAdjacent(row1, col1, row2, col2) {
  const dRow = Math.abs(row1 - row2);
  const dCol = Math.abs(col1 - col2);
  return dRow <= 1 && dCol <= 1 && (dRow !== 0 || dCol !== 0);
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * PERFORMANCE & TIMING
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Hitung waktu eksekusi dalam milliseconds
 * @param {Function} fn - Fungsi yang akan diukur
 * @returns {{result: *, time: number}} Hasil fungsi dan waktu eksekusi
 */
export function measureTime(fn) {
  const start = performance.now();
  const result = fn();
  const time = performance.now() - start;
  return { result, time };
}

/**
 * Format waktu dalam string yang readable
 * @param {number} ms - Milliseconds
 * @returns {string}
 */
export function formatTime(ms) {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * STATISTICS HELPERS
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Hitung efficiency (pruned nodes / total nodes yang di-explore)
 * @param {number} pruned - Nodes yang dipangkas
 * @param {number} total - Total nodes
 * @returns {number} Efficiency dalam persen (0-100)
 */
export function calculateEfficiency(pruned, total) {
  if (total === 0) return 0;
  return ((pruned / total) * 100).toFixed(2);
}

/**
 * Format besar angka dengan separator (1000 -> "1,000")
 * @param {number} num - Angka
 * @returns {string}
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * MOVE NOTATION & CONVERSION
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Konversi koordinat ke notasi chess (a1, h8, dll)
 * Baris 0 = 8, Baris 7 = 1
 * Kolom 0 = a, Kolom 7 = h
 * @param {number} row - Baris (0-7)
 * @param {number} col - Kolom (0-7)
 * @returns {string} Notasi (misal "e4")
 */
export function coordsToNotation(row, col) {
  const colLetter = String.fromCharCode(97 + col); // a-h
  const rowNumber = 8 - row; // 8-1
  return `${colLetter}${rowNumber}`;
}

/**
 * Konversi notasi chess ke koordinat
 * @param {string} notation - Notasi (misal "e4")
 * @returns {[number, number]} [row, col] atau null jika invalid
 */
export function notationToCoords(notation) {
  if (notation.length !== 2) return null;
  const col = notation.charCodeAt(0) - 97; // a-h to 0-7
  const row = 8 - parseInt(notation[1]);   // 1-8 to 7-0
  
  if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) {
    return null;
  }
  return [row, col];
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DEBUG UTILITIES
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Log dengan prefix waktu
 * @param {string} message
 * @param {*} data
 */
export function log(message, data = '') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`, data);
}

/**
 * Log warning
 * @param {string} message
 */
export function warn(message) {
  console.warn(`⚠️  ${message}`);
}

/**
 * Log error
 * @param {string} message
 */
export function error(message) {
  console.error(`❌ ${message}`);
}

/**
 * Validasi board integrity
 * @param {number[]} board
 * @returns {boolean}
 */
export function validateBoard(board) {
  if (board.length !== BOARD_SIZE * BOARD_SIZE) {
    error('Board length invalid');
    return false;
  }
  
  for (let cell of board) {
    if (cell !== 0 && cell !== 1 && cell !== -1) {
      error('Board contains invalid cell value: ' + cell);
      return false;
    }
  }
  
  return true;
}

export default {
  // Coordinates
  indexToCoords,
  coordsToIndex,
  isValidCoord,
  
  // Board operations
  cloneBoard,
  cloneBoard2D,
  board1DTo2D,
  board2DTo1D,
  printBoard,
  
  // Game analysis
  countDiscs,
  countEmpty,
  getPlayerDiscs,
  
  // Directions
  getDirectionName,
  isAdjacent,
  
  // Performance
  measureTime,
  formatTime,
  
  // Statistics
  calculateEfficiency,
  formatNumber,
  
  // Notation
  coordsToNotation,
  notationToCoords,
  
  // Debug
  log,
  warn,
  error,
  validateBoard,
};
