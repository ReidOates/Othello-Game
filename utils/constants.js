/**
 * constants.js
 * ============
 * Semua konstanta global yang digunakan di seluruh project.
 * Memusatkan nilai-nilai tetap agar mudah diubah dan dipelihara.
 */

// ─── Ukuran Board ────────────────────────────────────────────────────────────
export const BOARD_SIZE = 8;           // Board 8×8
export const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE; // 64 sel

// ─── Identitas Pemain ────────────────────────────────────────────────────────
export const EMPTY  = 0;   // Sel kosong
export const BLACK  = 1;   // Pemain hitam (Human default)
export const WHITE  = -1;  // Pemain putih (AI default)

// ─── Mode Permainan ──────────────────────────────────────────────────────────
export const GAME_MODE = {
  HUMAN_VS_AI:    'human_vs_ai',
  HUMAN_VS_HUMAN: 'human_vs_human',
};

// ─── Algoritma AI ────────────────────────────────────────────────────────────
export const ALGORITHM = {
  MINIMAX:    'minimax',
  ALPHABETA:  'alphabeta',
};

// ─── Depth / Kedalaman Pencarian ─────────────────────────────────────────────
export const MIN_DEPTH = 1;
export const MAX_DEPTH = 5;
export const DEFAULT_DEPTH = 3;

// ─── Status Permainan ────────────────────────────────────────────────────────
export const GAME_STATUS = {
  PLAYING:    'playing',
  BLACK_WIN:  'black_win',
  WHITE_WIN:  'white_win',
  DRAW:       'draw',
  GAME_OVER:  'game_over',
};

// ─── Arah 8 Penjuru (digunakan untuk flip disc) ──────────────────────────────
export const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],  // Atas-kiri, Atas, Atas-kanan
  [ 0, -1],          [ 0, 1],  // Kiri,       (tengah), Kanan
  [ 1, -1], [ 1, 0], [ 1, 1],  // Bawah-kiri, Bawah, Bawah-kanan
];

// ─── Bobot Posisi (Positional Weight Matrix) ─────────────────────────────────
// Nilai tinggi = posisi strategis (sudut paling berharga)
// Nilai negatif = posisi berbahaya (dekat sudut)
export const WEIGHT_MATRIX = [
  [ 100, -20,  10,  5,  5,  10, -20, 100],
  [ -20, -40,  -5, -5, -5,  -5, -40, -20],
  [  10,  -5,   1,  1,  1,   1,  -5,  10],
  [   5,  -5,   1,  0,  0,   1,  -5,   5],
  [   5,  -5,   1,  0,  0,   1,  -5,   5],
  [  10,  -5,   1,  1,  1,   1,  -5,  10],
  [ -20, -40,  -5, -5, -5,  -5, -40, -20],
  [ 100, -20,  10,  5,  5,  10, -20, 100],
];

// ─── Posisi Sudut (Corner) ───────────────────────────────────────────────────
export const CORNERS = [
  [0, 0], [0, 7], [7, 0], [7, 7],
];

// ─── Nilai Infinity untuk Minimax ────────────────────────────────────────────
export const INFINITY     =  999999;
export const NEG_INFINITY = -999999;

// ─── Warna UI ────────────────────────────────────────────────────────────────
export const COLORS = {
  BLACK_DISC:   '#1a1a2e',
  WHITE_DISC:   '#f0f0f0',
  BOARD_GREEN:  '#1b5e20',
  BOARD_DARK:   '#0a3d0a',
  VALID_MOVE:   'rgba(255, 255, 0, 0.35)',
  LAST_MOVE:    'rgba(255, 100, 0, 0.5)',
  NODE_MAX:     '#4caf50',  // Hijau untuk node MAX
  NODE_MIN:     '#f44336',  // Merah untuk node MIN
  NODE_PRUNED:  '#9e9e9e',  // Abu untuk node dipangkas
  NODE_ACTIVE:  '#ffeb3b',  // Kuning untuk node aktif
  NODE_BEST:    '#00bcd4',  // Cyan untuk node terbaik
};

// ─── Animasi ─────────────────────────────────────────────────────────────────
export const ANIMATION = {
  FLIP_DURATION:    400,   // ms - durasi animasi flip disc
  AI_THINKING_MIN:  300,   // ms - minimum delay AI thinking
  MOVE_HIGHLIGHT:   1500,  // ms - durasi highlight langkah terakhir
};

// ─── Sound ───────────────────────────────────────────────────────────────────
export const SOUND = {
  ENABLED: true,
  VOLUME:  0.5,
};

// ─── Tree Visualizer ─────────────────────────────────────────────────────────
export const TREE_CONFIG = {
  NODE_RADIUS:    22,   // px
  LEVEL_HEIGHT:   90,   // px antar level
  MIN_SIBLING_GAP: 60,  // px antar sibling
  MAX_DISPLAY_DEPTH: 4, // kedalaman maksimal yang divisualisasikan
  ANIMATION_SPEED: 50,  // ms per node
};

// ─── LocalStorage Keys ───────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  THEME:      'othello_theme',
  SOUND:      'othello_sound',
  ALGORITHM:  'othello_algorithm',
  DEPTH:      'othello_depth',
  GAME_MODE:  'othello_game_mode',
  STATS:      'othello_stats',
};