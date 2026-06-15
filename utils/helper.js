/**
 * helpers.js
 * ==========
 * Fungsi-fungsi utilitas umum yang digunakan di seluruh project.
 * Semua fungsi bersifat "pure" (tidak mengubah state global).
 */

import { BOARD_SIZE, BLACK, WHITE, EMPTY } from './constants.js';

// ─── Konversi Koordinat ───────────────────────────────────────────────────────

/**
 * Mengubah (row, col) menjadi indeks linear (0-63)
 * @param {number} row - Baris (0-7)
 * @param {number} col - Kolom (0-7)
 * @returns {number} Indeks linear
 */
export function toIndex(row, col) {
  return row * BOARD_SIZE + col;
}

/**
 * Mengubah indeks linear menjadi (row, col)
 * @param {number} index - Indeks linear (0-63)
 * @returns {{row: number, col: number}}
 */
export function toCoord(index) {
  return {
    row: Math.floor(index / BOARD_SIZE),
    col: index % BOARD_SIZE,
  };
}

// ─── Validasi ─────────────────────────────────────────────────────────────────

/**
 * Memeriksa apakah koordinat berada dalam batas board
 * @param {number} row
 * @param {number} col
 * @returns {boolean}
 */
export function inBounds(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

// ─── Board Operations ─────────────────────────────────────────────────────────

/**
 * Membuat salinan mendalam dari board (deep copy)
 * Penting: Minimax TIDAK boleh mengubah board asli
 * @param {number[][]} board - Board saat ini
 * @returns {number[][]} Salinan board
 */
export function copyBoard(board) {
  return board.map(row => [...row]);
}

/**
 * Membuat board kosong berukuran 8×8
 * @returns {number[][]} Board kosong (semua EMPTY)
 */
export function createEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
}

/**
 * Membuat board dengan posisi awal Othello
 * Posisi awal: 4 disc di tengah (2 hitam, 2 putih)
 * @returns {number[][]} Board dengan posisi awal
 */
export function createInitialBoard() {
  const board = createEmptyBoard();
  const mid = BOARD_SIZE / 2; // = 4

  // Posisi awal standar Othello
  board[mid - 1][mid - 1] = WHITE; // (3,3) = Putih
  board[mid - 1][mid]     = BLACK; // (3,4) = Hitam
  board[mid][mid - 1]     = BLACK; // (4,3) = Hitam
  board[mid][mid]         = WHITE; // (4,4) = Putih

  return board;
}

// ─── Hitung Disc ─────────────────────────────────────────────────────────────

/**
 * Menghitung jumlah disc pemain tertentu di board
 * @param {number[][]} board
 * @param {number} player - BLACK atau WHITE
 * @returns {number} Jumlah disc
 */
export function countDiscs(board, player) {
  let count = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === player) count++;
    }
  }
  return count;
}

/**
 * Menghitung skor kedua pemain sekaligus
 * @param {number[][]} board
 * @returns {{black: number, white: number, empty: number}}
 */
export function countAllDiscs(board) {
  let black = 0, white = 0, empty = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if      (board[r][c] === BLACK) black++;
      else if (board[r][c] === WHITE) white++;
      else                            empty++;
    }
  }
  return { black, white, empty };
}

// ─── Lawan ───────────────────────────────────────────────────────────────────

/**
 * Mendapatkan pemain lawan
 * @param {number} player - BLACK (1) atau WHITE (-1)
 * @returns {number} Lawan pemain
 */
export function opponent(player) {
  return -player; // BLACK (1) → WHITE (-1), dan sebaliknya
}

// ─── Notasi ──────────────────────────────────────────────────────────────────

/**
 * Mengubah (row, col) ke notasi Othello (misal: "D3")
 * @param {number} row
 * @param {number} col
 * @returns {string} Notasi seperti "D3"
 */
export function toNotation(row, col) {
  const colLetter = String.fromCharCode(65 + col); // A-H
  const rowNumber = row + 1;                        // 1-8
  return `${colLetter}${rowNumber}`;
}

/**
 * Mengubah notasi ke (row, col)
 * @param {string} notation - Misal "D3"
 * @returns {{row: number, col: number}}
 */
export function fromNotation(notation) {
  const col = notation.charCodeAt(0) - 65; // A→0, B→1, ...
  const row = parseInt(notation[1]) - 1;   // 1→0, 2→1, ...
  return { row, col };
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Format angka dengan pemisah ribuan
 * @param {number} num
 * @returns {string} Misal: 1234567 → "1,234,567"
 */
export function formatNumber(num) {
  return num.toLocaleString('id-ID');
}

/**
 * Format waktu dalam ms menjadi string yang mudah dibaca
 * @param {number} ms - Waktu dalam milidetik
 * @returns {string} Misal: "123.45 ms" atau "1.23 s"
 */
export function formatTime(ms) {
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(3)} s`;
}

/**
 * Format persentase
 * @param {number} value - Nilai (0-1 atau 0-100)
 * @param {boolean} isRatio - true jika value adalah rasio (0-1)
 * @returns {string} Misal: "75.50%"
 */
export function formatPercent(value, isRatio = false) {
  const pct = isRatio ? value * 100 : value;
  return `${pct.toFixed(2)}%`;
}

// ─── Waktu ────────────────────────────────────────────────────────────────────

/**
 * Mendapatkan timestamp saat ini dalam ms (high resolution)
 * @returns {number}
 */
export function now() {
  return performance.now();
}

/**
 * Menghitung selisih waktu dari timestamp awal
 * @param {number} startTime - Hasil dari now()
 * @returns {number} Selisih dalam ms
 */
export function elapsed(startTime) {
  return performance.now() - startTime;
}

// ─── Array / Random ───────────────────────────────────────────────────────────

/**
 * Mengacak urutan array (Fisher-Yates shuffle)
 * Digunakan untuk move ordering variasi
 * @param {Array} arr - Array yang akan diacak
 * @returns {Array} Array baru yang sudah diacak
 */
export function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Clamp nilai dalam rentang [min, max]
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// ─── Deep Clone ───────────────────────────────────────────────────────────────

/**
 * Deep clone objek JavaScript (tanpa fungsi)
 * Digunakan untuk menyimpan snapshot state game
 * @param {Object} obj
 * @returns {Object}
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ─── Debounce ─────────────────────────────────────────────────────────────────

/**
 * Debounce: menunda eksekusi fungsi sampai setelah delay
 * Berguna untuk resize event pada responsive
 * @param {Function} fn - Fungsi yang akan di-debounce
 * @param {number} delay - Delay dalam ms
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}