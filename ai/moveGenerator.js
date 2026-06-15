/**
 * moveGenerator.js
 * ================
 * Logika untuk generate valid moves dalam permainan Othello.
 * Sesuai aturan Othello standar: move valid harus flip minimal 1 disc opponent.
 */

import { 
  BOARD_SIZE, 
  DIRECTIONS, 
  EMPTY, 
  BLACK, 
  WHITE 
} from '../utils/constants.js';

import { 
  isValidCoord, 
  coordsToIndex,
  indexToCoords 
} from '../utils/helpers.js';

/**
 * ─────────────────────────────────────────────────────────────────────────
 * BASIC MOVE VALIDATION
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Cek apakah posisi (row, col) dapat di-flip ke arah tertentu
 * Menghitung jumlah disc opponent yang dapat di-flip.
 * 
 * @param {number[]} board - Board 1D
 * @param {number} row - Baris target
 * @param {number} col - Kolom target
 * @param {number} player - Pemain (BLACK=1 atau WHITE=-1)
 * @param {[number, number]} direction - Arah [dRow, dCol]
 * @returns {{flipped: number[], count: number}} Array index yang di-flip dan jumlahnya
 * 
 * ALGORITMA:
 * 1. Jalan ke arah tertentu mulai dari (row, col)
 * 2. Jika ketemu disc opponent, tambah ke flipped array
 * 3. Jika ketemu disc player sendiri, return flipped (valid flip)
 * 4. Jika ketemu cell kosong atau keluar board, return empty (invalid)
 */
export function getFlipsInDirection(board, row, col, player, direction) {
  const opponent = -player; // Opponent dari player
  const flipped = [];
  
  let r = row + direction[0];
  let c = col + direction[1];
  
  // Jalan ke arah tertentu sampai ketemu disc player atau kondisi stop lainnya
  while (isValidCoord(r, c)) {
    const index = r * BOARD_SIZE + c;
    const cell = board[index];
    
    if (cell === EMPTY) {
      // Ketemu cell kosong = tidak ada flip
      return { flipped: [], count: 0 };
    }
    
    if (cell === opponent) {
      // Ketemu disc opponent, simpan dan lanjut
      flipped.push(index);
    } else if (cell === player) {
      // Ketemu disc player = flip valid!
      return { flipped, count: flipped.length };
    }
    
    r += direction[0];
    c += direction[1];
  }
  
  // Keluar board tanpa ketemu disc player = tidak valid
  return { flipped: [], count: 0 };
}

/**
 * Dapatkan semua disc yang akan di-flip jika player move ke (row, col)
 * @param {number[]} board - Board 1D
 * @param {number} row - Baris target
 * @param {number} col - Kolom target
 * @param {number} player - Pemain (BLACK=1 atau WHITE=-1)
 * @returns {number[]} Array index semua disc yang akan di-flip
 */
export function getAllFlips(board, row, col, player) {
  const index = row * BOARD_SIZE + col;
  
  // Move invalid jika cell tidak kosong
  if (board[index] !== EMPTY) {
    return [];
  }
  
  const allFlips = [];
  
  // Cek setiap 8 arah
  for (let dir of DIRECTIONS) {
    const { flipped, count } = getFlipsInDirection(board, row, col, player, dir);
    if (count > 0) {
      allFlips.push(...flipped);
    }
  }
  
  return allFlips;
}

/**
 * Cek apakah move (row, col) valid untuk player
 * Move valid jika minimal ada 1 disc opponent yang bisa di-flip
 * 
 * @param {number[]} board - Board 1D
 * @param {number} row - Baris target
 * @param {number} col - Kolom target
 * @param {number} player - Pemain
 * @returns {boolean}
 */
export function isValidMove(board, row, col, player) {
  if (!isValidCoord(row, col)) return false;
  
  const index = row * BOARD_SIZE + col;
  if (board[index] !== EMPTY) return false;
  
  const flips = getAllFlips(board, row, col, player);
  return flips.length > 0;
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * MOVE GENERATION
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Dapatkan semua valid moves untuk player pada board tertentu
 * Gunakan move ordering heuristic untuk optimasi Alpha-Beta
 * 
 * @param {number[]} board - Board 1D
 * @param {number} player - Pemain (BLACK=1 atau WHITE=-1)
 * @returns {Array} Array objects {index, row, col, flips}
 * 
 * Move ordering prioritas:
 * 1. Corner moves (paling penting)
 * 2. Edge moves
 * 3. Interior moves dengan banyak flip
 * 4. Interior moves dengan sedikit flip
 */
export function generateMoves(board, player) {
  const moves = [];
  
  // Scan setiap cell di board
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (isValidMove(board, row, col, player)) {
        const index = row * BOARD_SIZE + col;
        const flips = getAllFlips(board, row, col, player);
        
        moves.push({
          index,
          row,
          col,
          flips,
          flipCount: flips.length,
        });
      }
    }
  }
  
  // Sort moves dengan move ordering heuristic
  return sortMovesByHeuristic(moves);
}

/**
 * Generate moves dengan kategori untuk visualisasi
 * @param {number[]} board
 * @param {number} player
 * @returns {Object} {corner, edge, interior}
 */
export function generateMovesWithCategory(board, player) {
  const moves = generateMoves(board, player);
  
  const categories = {
    corner: [],
    edge: [],
    interior: [],
  };
  
  for (let move of moves) {
    const { row, col } = move;
    const isCorner = (row === 0 || row === 7) && (col === 0 || col === 7);
    const isEdge = (row === 0 || row === 7 || col === 0 || col === 7) && !isCorner;
    
    if (isCorner) {
      categories.corner.push(move);
    } else if (isEdge) {
      categories.edge.push(move);
    } else {
      categories.interior.push(move);
    }
  }
  
  return categories;
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * MOVE ORDERING HEURISTIC
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Hitung prioritas (score) untuk move ordering
 * Prioritas tinggi = kemungkinan move terbaik lebih besar
 * 
 * Scoring:
 * - Corner: +1000 (paling stabil, sulit di-flip)
 * - Edge: +500 (cukup stabil)
 * - Adjacent to corner: -100 (dangerous, dapat memberi opponent corner)
 * - Jumlah flips: +2 per flip (lebih banyak flip = lebih baik strategis)
 * 
 * @param {Array} moves - Array move objects
 * @returns {Array} Moves dengan property 'priority' dan di-sort descending
 */
export function sortMovesByHeuristic(moves) {
  const CORNERS = [[0,0], [0,7], [7,0], [7,7]];
  const X_SQUARES = [[0,1], [1,0], [1,1], [0,6], [1,6], [1,7],
                     [6,0], [6,1], [7,1], [6,7], [7,6], [6,6]];
  
  const withPriority = moves.map(move => {
    let priority = 0;
    const { row, col, flipCount } = move;
    
    // Check if corner
    if (CORNERS.some(([r, c]) => r === row && c === col)) {
      priority += 1000;
    }
    // Check if X-square (adjacent to corner) - dangerous!
    else if (X_SQUARES.some(([r, c]) => r === row && c === col)) {
      priority -= 100;
    }
    // Check if edge
    else if (row === 0 || row === 7 || col === 0 || col === 7) {
      priority += 500;
    }
    
    // Add bonus untuk flip count
    priority += flipCount * 2;
    
    return { ...move, priority };
  });
  
  // Sort descending by priority
  return withPriority.sort((a, b) => b.priority - a.priority);
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * GAME STATE QUERIES
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Cek apakah player memiliki valid moves
 * @param {number[]} board
 * @param {number} player
 * @returns {boolean}
 */
export function hasValidMoves(board, player) {
  const moves = generateMoves(board, player);
  return moves.length > 0;
}

/**
 * Cek apakah game sudah berakhir (kedua player tidak ada move)
 * @param {number[]} board
 * @returns {boolean}
 */
export function isGameOver(board) {
  return !hasValidMoves(board, BLACK) && !hasValidMoves(board, WHITE);
}

/**
 * Cek apakah player current harus skip (pass) karena tidak ada move
 * @param {number[]} board
 * @param {number} currentPlayer
 * @returns {boolean}
 */
export function mustPass(board, currentPlayer) {
  return !hasValidMoves(board, currentPlayer);
}

/**
 * Count valid moves untuk move ordering analysis
 * @param {number[]} board
 * @param {number} player
 * @returns {number}
 */
export function countValidMoves(board, player) {
  return generateMoves(board, player).length;
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * MOVE EXECUTION
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Apply move ke board (return new board, jangan mutate original)
 * 
 * @param {number[]} board - Board original 1D
 * @param {number} row - Baris move
 * @param {number} col - Kolom move
 * @param {number} player - Pemain yang move
 * @returns {number[]} Board baru setelah move, atau null jika move invalid
 */
export function applyMove(board, row, col, player) {
  // Validasi move
  if (!isValidMove(board, row, col, player)) {
    console.warn(`Invalid move: (${row}, ${col}) for player ${player}`);
    return null;
  }
  
  // Clone board biar jangan mutate original
  const newBoard = [...board];
  const index = row * BOARD_SIZE + col;
  
  // Place player's disc
  newBoard[index] = player;
  
  // Flip semua opponent discs yang ter-capture
  const flips = getAllFlips(board, row, col, player);
  for (let flipIndex of flips) {
    newBoard[flipIndex] = player;
  }
  
  return newBoard;
}

/**
 * Get next legal moves set (untuk game flow)
 * @param {number[]} board
 * @param {number} currentPlayer
 * @param {number} nextPlayer
 * @returns {{canMove: boolean, player: number}} Next player yang bisa move
 */
export function getNextPlayer(board, currentPlayer, nextPlayer) {
  // Cek apakah next player bisa move
  if (hasValidMoves(board, nextPlayer)) {
    return { canMove: true, player: nextPlayer };
  }
  
  // Next player tidak bisa move, current player bisa move lagi (pass)?
  if (hasValidMoves(board, currentPlayer)) {
    return { canMove: true, player: currentPlayer, pass: true };
  }
  
  // Kedua player tidak bisa move = game over
  return { canMove: false, player: null };
}

export default {
  // Basic validation
  getFlipsInDirection,
  getAllFlips,
  isValidMove,
  
  // Move generation
  generateMoves,
  generateMovesWithCategory,
  sortMovesByHeuristic,
  
  // Game state
  hasValidMoves,
  isGameOver,
  mustPass,
  countValidMoves,
  
  // Move execution
  applyMove,
  getNextPlayer,
};
