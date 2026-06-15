/**
 * heuristic.js
 * =============
 * Fungsi evaluasi (heuristic) untuk board Othello.
 * Digunakan oleh Minimax dan Alpha-Beta untuk mengevaluasi posisi board.
 * 
 * Heuristic yang baik adalah kunci untuk AI yang kuat.
 * Mengkombinasikan multiple factors untuk evaluasi akurat.
 */

import {
  BOARD_SIZE,
  WEIGHT_MATRIX,
  CORNERS,
  BLACK,
  WHITE,
  EMPTY,
  INFINITY,
  NEG_INFINITY,
} from '../utils/constants.js';

import {
  coordsToIndex,
  indexToCoords,
  countDiscs,
  getPlayerDiscs,
} from '../utils/helpers.js';

import {
  countValidMoves,
  generateMoves,
} from './moveGenerator.js';

/**
 * ─────────────────────────────────────────────────────────────────────────
 * EVALUATION COMPONENTS
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Coin Parity (Material Count)
 * Selisih antara jumlah disc player dengan opponent
 * 
 * Range: -64 hingga 64
 * Positif = player winning (lebih banyak disc)
 * 
 * @param {number[]} board - Board 1D
 * @param {number} player - Pemain (BLACK atau WHITE)
 * @returns {number} Selisih disc (player - opponent)
 */
export function evaluateCoinParity(board, player) {
  const { black, white } = countDiscs(board);
  const opponent = -player;
  
  const playerCount = player === BLACK ? black : white;
  const opponentCount = opponent === BLACK ? black : white;
  
  return playerCount - opponentCount;
}

/**
 * Mobility (Available Moves)
 * Jumlah move yang bisa dilakukan player vs opponent
 * 
 * Semakin banyak move = semakin banyak kontrol = semakin baik
 * Terutama penting di endgame
 * 
 * Range: -60 hingga 60 (approx)
 * 
 * @param {number[]} board - Board 1D
 * @param {number} player - Pemain
 * @returns {number} Selisih mobility
 */
export function evaluateMobility(board, player) {
  const opponent = -player;
  
  const playerMoves = countValidMoves(board, player);
  const opponentMoves = countValidMoves(board, opponent);
  
  // Jika total moves sedikit (endgame), weight lebih tinggi
  const totalMoves = playerMoves + opponentMoves;
  const weight = totalMoves < 16 ? 3 : 1; // Endgame weight 3x
  
  return (playerMoves - opponentMoves) * weight;
}

/**
 * Corner Occupancy
 * Kontrol sudut board (paling stabil, sangat berharga)
 * 
 * Corners: [0,0], [0,7], [7,0], [7,7]
 * Sudut tidak bisa di-flip = fundamental advantage
 * 
 * @param {number[]} board - Board 1D
 * @param {number} player - Pemain
 * @returns {number} Selisih kontrol sudut (score * 50)
 */
export function evaluateCornerOccupancy(board, player) {
  const opponent = -player;
  
  let playerCorners = 0;
  let opponentCorners = 0;
  
  for (const [row, col] of CORNERS) {
    const index = coordsToIndex(row, col);
    const cell = board[index];
    
    if (cell === player) playerCorners++;
    else if (cell === opponent) opponentCorners++;
  }
  
  // Corner sangat penting, weight 50 per corner
  return (playerCorners - opponentCorners) * 50;
}

/**
 * X-Square Safety
 * Cell yang adjacent ke corner (dangerous!)
 * Jika opponent kontrol X-square, opponent bisa ambil corner
 * 
 * X-squares: [0,1], [1,0], [1,1], dll (12 cell total)
 * 
 * @param {number[]} board - Board 1D
 * @param {number} player - Pemain
 * @returns {number} Penalti untuk X-squares yang dikontrol opponent
 */
export function evaluateXSquareSafety(board, player) {
  const opponent = -player;
  
  const X_SQUARES = [
    [0, 1], [1, 0], [1, 1],          // Near corner [0,0]
    [0, 6], [1, 6], [1, 7],          // Near corner [0,7]
    [6, 0], [6, 1], [7, 1],          // Near corner [7,0]
    [6, 6], [6, 7], [7, 6],          // Near corner [7,7]
  ];
  
  let playerXSquares = 0;
  let opponentXSquares = 0;
  
  for (const [row, col] of X_SQUARES) {
    const index = coordsToIndex(row, col);
    const cell = board[index];
    
    if (cell === player) playerXSquares++;
    else if (cell === opponent) opponentXSquares++;
  }
  
  // X-square sangat berbahaya untuk opponent, penalti besar
  return (playerXSquares - opponentXSquares) * (-25);
}

/**
 * Positional Weight Evaluation
 * Evaluasi board berdasarkan WEIGHT_MATRIX (strategic positions)
 * 
 * Sudut = +100 (paling berharga)
 * Edge = +10
 * Interior = +1 hingga -5
 * 
 * @param {number[]} board - Board 1D
 * @param {number} player - Pemain
 * @returns {number} Weighted score
 */
export function evaluatePositionalWeight(board, player) {
  const opponent = -player;
  
  let playerScore = 0;
  let opponentScore = 0;
  
  for (let i = 0; i < board.length; i++) {
    const cell = board[i];
    if (cell === EMPTY) continue;
    
    const [row, col] = indexToCoords(i);
    const weight = WEIGHT_MATRIX[row][col];
    
    if (cell === player) {
      playerScore += weight;
    } else if (cell === opponent) {
      opponentScore += weight;
    }
  }
  
  return playerScore - opponentScore;
}

/**
 * Stability Analysis
 * Hitung disc yang stabil (tidak mudah di-flip)
 * 
 * Disc stabil jika:
 * - Di sudut (100% stabil)
 * - Tidak bisa di-flip dari setiap arah
 * 
 * @param {number[]} board - Board 1D
 * @param {number} player - Pemain
 * @returns {number} Selisih stable disc (player - opponent)
 */
export function evaluateStability(board, player) {
  const opponent = -player;
  
  const playerDiscs = getPlayerDiscs(board, player);
  const opponentDiscs = getPlayerDiscs(board, opponent);
  
  const playerStable = countStableDiscs(board, playerDiscs, player, opponent);
  const opponentStable = countStableDiscs(board, opponentDiscs, opponent, player);
  
  return (playerStable - opponentStable) * 10;
}

/**
 * Count stable discs untuk list disc tertentu
 * @private
 */
function countStableDiscs(board, discIndices, player, opponent) {
  const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
  ];
  
  let stableCount = 0;
  
  for (const index of discIndices) {
    const [row, col] = indexToCoords(index);
    
    // Corner disc selalu stabil
    if ((row === 0 || row === 7) && (col === 0 || col === 7)) {
      stableCount++;
      continue;
    }
    
    let isStable = true;
    
    // Check setiap arah apakah disc bisa di-flip
    for (const dir of DIRECTIONS) {
      if (canBeFlipped(board, row, col, player, opponent, dir)) {
        isStable = false;
        break;
      }
    }
    
    if (isStable) stableCount++;
  }
  
  return stableCount;
}

/**
 * Check apakah disc di (row, col) bisa di-flip ke arah tertentu
 * @private
 */
function canBeFlipped(board, row, col, player, opponent, direction) {
  let r = row + direction[0];
  let c = col + direction[1];
  
  let hasOpponent = false;
  
  while (isValidCoord(r, c)) {
    const index = coordsToIndex(r, c);
    const cell = board[index];
    
    if (cell === EMPTY) {
      return hasOpponent; // Bisa di-flip jika ada opponent disc sebelum empty
    }
    
    if (cell === opponent) {
      hasOpponent = true;
    } else if (cell === player) {
      return false; // Ada disc player sendiri = tidak bisa di-flip
    }
    
    r += direction[0];
    c += direction[1];
  }
  
  return false;
}

/**
 * Helper: Check valid coordinate
 * @private
 */
function isValidCoord(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * GAME PHASE DETECTION
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Deteksi fase permainan untuk weight adjustment
 * 
 * Opening (0-20 moves): Fokus pada posisi
 * Midgame (20-50 moves): Balance semua faktor
 * Endgame (50-64 moves): Fokus pada mobility dan coin parity
 * 
 * @param {number[]} board - Board 1D
 * @returns {string} 'opening' | 'midgame' | 'endgame'
 */
export function detectGamePhase(board) {
  const { black, white } = countDiscs(board);
  const totalDiscs = black + white;
  
  if (totalDiscs < 20) return 'opening';
  if (totalDiscs < 50) return 'midgame';
  return 'endgame';
}

/**
 * Get weight untuk setiap evaluation factor berdasarkan game phase
 * @private
 */
function getPhaseWeights(phase) {
  switch (phase) {
    case 'opening':
      return {
        coinParity: 1,
        mobility: 1,
        cornerOccupancy: 3,      // Corner sangat penting early
        xSquareSafety: 2,
        positionalWeight: 2,
        stability: 1,
      };
    
    case 'midgame':
      return {
        coinParity: 2,
        mobility: 2,
        cornerOccupancy: 3,
        xSquareSafety: 2,
        positionalWeight: 2,
        stability: 1,
      };
    
    case 'endgame':
      return {
        coinParity: 4,            // Coin parity critical at end
        mobility: 3,
        cornerOccupancy: 2,
        xSquareSafety: 1,
        positionalWeight: 1,
        stability: 2,
      };
    
    default:
      return {
        coinParity: 1,
        mobility: 1,
        cornerOccupancy: 1,
        xSquareSafety: 1,
        positionalWeight: 1,
        stability: 1,
      };
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * MAIN EVALUATION FUNCTION
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Evaluate board position secara comprehensive
 * Menggabungkan semua faktor dengan weighted scoring
 * 
 * ALGORITMA:
 * 1. Deteksi game phase (opening/midgame/endgame)
 * 2. Calculate setiap evaluation factor
 * 3. Apply weight berdasarkan game phase
 * 4. Combine scores dengan weighted sum
 * 5. Return nilai evaluasi
 * 
 * Score interpretation:
 * - Positif = Player (Maximizing player) sedang unggul
 * - Negatif = Opponent (Minimizing player) sedang unggul
 * - 0 = Seimbang
 * 
 * Range (approx): -1000 hingga 1000
 * 
 * @param {number[]} board - Board 1D
 * @param {number} player - Pemain yang di-evaluate (usually Maximizing player)
 * @returns {number} Evaluation score
 */
export function evaluateBoard(board, player) {
  // Deteksi game phase untuk weight adjustment
  const phase = detectGamePhase(board);
  const weights = getPhaseWeights(phase);
  
  // Calculate setiap faktor
  const coinParity = evaluateCoinParity(board, player) * weights.coinParity;
  const mobility = evaluateMobility(board, player) * weights.mobility;
  const cornerOccupancy = evaluateCornerOccupancy(board, player) * weights.cornerOccupancy;
  const xSquareSafety = evaluateXSquareSafety(board, player) * weights.xSquareSafety;
  const positionalWeight = evaluatePositionalWeight(board, player) * weights.positionalWeight;
  const stability = evaluateStability(board, player) * weights.stability;
  
  // Combine scores
  const totalScore = 
    coinParity +
    mobility +
    cornerOccupancy +
    xSquareSafety +
    positionalWeight +
    stability;
  
  return Math.round(totalScore);
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * TERMINAL NODE EVALUATION
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Evaluate terminal board state (game over)
 * Return winning/losing/drawing score
 * 
 * @param {number[]} board - Board 1D
 * @param {number} player - Maximizing player
 * @returns {number} Win/Loss/Draw score
 */
export function evaluateTerminal(board, player) {
  const { black, white } = countDiscs(board);
  const opponent = -player;
  
  const playerCount = player === BLACK ? black : white;
  const opponentCount = opponent === BLACK ? black : white;
  
  if (playerCount > opponentCount) {
    // Player menang
    const diff = playerCount - opponentCount;
    return INFINITY - diff; // Prefer winning dengan margin besar
  } else if (playerCount < opponentCount) {
    // Player kalah
    const diff = opponentCount - playerCount;
    return NEG_INFINITY + diff; // Prefer losing dengan margin kecil
  } else {
    // Draw
    return 0;
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * DEBUG & ANALYSIS
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Get detailed evaluation breakdown (untuk debugging)
 * @param {number[]} board
 * @param {number} player
 * @returns {Object}
 */
export function getEvaluationBreakdown(board, player) {
  const phase = detectGamePhase(board);
  const weights = getPhaseWeights(phase);
  
  return {
    phase,
    weights,
    factors: {
      coinParity: evaluateCoinParity(board, player),
      mobility: evaluateMobility(board, player),
      cornerOccupancy: evaluateCornerOccupancy(board, player),
      xSquareSafety: evaluateXSquareSafety(board, player),
      positionalWeight: evaluatePositionalWeight(board, player),
      stability: evaluateStability(board, player),
    },
    weightedFactors: {
      coinParity: evaluateCoinParity(board, player) * weights.coinParity,
      mobility: evaluateMobility(board, player) * weights.mobility,
      cornerOccupancy: evaluateCornerOccupancy(board, player) * weights.cornerOccupancy,
      xSquareSafety: evaluateXSquareSafety(board, player) * weights.xSquareSafety,
      positionalWeight: evaluatePositionalWeight(board, player) * weights.positionalWeight,
      stability: evaluateStability(board, player) * weights.stability,
    },
    totalEvaluation: evaluateBoard(board, player),
  };
}

export default {
  // Individual factors
  evaluateCoinParity,
  evaluateMobility,
  evaluateCornerOccupancy,
  evaluateXSquareSafety,
  evaluatePositionalWeight,
  evaluateStability,
  
  // Game phase
  detectGamePhase,
  
  // Main evaluation
  evaluateBoard,
  evaluateTerminal,
  
  // Debug
  getEvaluationBreakdown,
};
