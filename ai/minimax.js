/**
 * minimax.js
 * ==========
 * Implementasi Minimax Algorithm dari nol (tidak copy-paste).
 * * MINIMAX ALGORITMA:
 * ─────────────────
 * 1. MAX player mencari move yang maximize score
 * 2. MIN player mencari move yang minimize score
 * 3. Alternating MAX-MIN di setiap level tree
 * 4. Base case: depth==0 atau game over → evaluate dengan heuristic
 * 5. Recursive case: evaluate semua child nodes, return best
 * * Complexity: O(b^d) di mana b=branch factor, d=depth
 * Board Othello: b ≈ 10, depth ≤ 5 → manageable
 */

import { BLACK, WHITE } from '../utils/constants.js';
import { generateMoves, applyMove, hasValidMoves, mustPass } from './moveGenerator.js';
import { evaluateBoard, evaluateTerminal, detectGamePhase } from './heuristic.js';
import { createTreeNode } from './treeBuilder.js';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MINIMAX CLASS
 * ═══════════════════════════════════════════════════════════════════════════
 */

export class Minimax {
  /**
   * Constructor
   * @param {Object} config
   * @param {number} config.maxDepth - Maksimal depth (1-5)
   * @param {Object} config.callbacks - Callback functions
   */
  constructor(config = {}) {
    this.maxDepth = config.maxDepth || 3;
    this.callbacks = config.callbacks || {};

    // Statistics
    this.stats = {
      nodesEvaluated: 0,
      nodesPruned: 0,
      executionTime: 0,
      movesCounted: 0,
      depthReached: 0,
      bestMove: null,
      bestScore: 0,
    };

    // Game tree structure (untuk visualisasi)
    this.gameTree = null;
    this.buildTree = config.buildTree || false;

    // Debug info
    this.debug = config.debug || false;
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * MAIN MINIMAX ENTRY POINT
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Find best move menggunakan Minimax
   * * @param {number[]} board - Current board state
   * @param {number} player - Player yang akan move (Maximizing player)
   * @returns {Object} {bestMove, evaluation, tree, stats}
   * - bestMove: {index, row, col, flips, score}
   * - evaluation: Score dari best position
   * - tree: Game tree (jika buildTree enabled)
   * - stats: Statistics tentang search
   */
  findBestMove(board, player) {
    // Reset statistics
    this.stats = {
      nodesEvaluated: 0,
      nodesPruned: 0,
      executionTime: 0,
      movesCounted: 0,
      depthReached: 0,
      bestMove: null,
      bestScore: 0,
    };

    const startTime = performance.now();

    // Get all valid moves for maximizing player
    const moves = generateMoves(board, player);

    if (moves.length === 0) {
      console.warn('No valid moves available');
      return {
        bestMove: null,
        evaluation: 0,
        tree: null,
        stats: this.stats,
      };
    }

    // Initialize root node if tree building is enabled
    let rootNode = null;
    if (this.buildTree) {
      rootNode = createTreeNode({ type: 'MAX', depth: this.maxDepth, move: null });
    }

    // Evaluate setiap move menggunakan minimax
    let bestScore = NEG_INFINITY;
    let bestMove = null;

    for (const move of moves) {
      // Apply move
      const newBoard = applyMove(board, move.row, move.col, player);
      if (!newBoard) continue;

      let childNode = null;
      if (this.buildTree) {
        childNode = createTreeNode({ type: 'MIN', depth: this.maxDepth - 1, move: move });
        rootNode.children.push(childNode);
      }

      // Minimax recursion untuk child position
      const opponent = -player;
      const score = this._minimax(
        newBoard,
        this.maxDepth - 1,
        opponent,    // Next player (minimizing)
        player,      // Original maximizing player (untuk evaluasi)
        false,       // Ini bukan maximizing node (next player is minimizing)
        childNode
      );

      if (childNode) childNode.score = score;

      // Update best move jika ini lebih baik
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    if (rootNode) rootNode.score = bestScore;

    this.stats.executionTime = performance.now() - startTime;
    this.stats.bestMove = bestMove;
    this.stats.bestScore = bestScore;
    this.gameTree = rootNode;

    return {
      bestMove: bestMove ? { ...bestMove, score: bestScore } : null,
      evaluation: bestScore,
      tree: this.gameTree,
      stats: this.stats,
    };
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * RECURSIVE MINIMAX IMPLEMENTATION
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Recursive Minimax function
   * * PSEUDOCODE:
   * ```
   * minimax(board, depth, currentPlayer, maxPlayer, isMaximizing):
   * 1. Base case: depth == 0 atau game over
   * → return evaluateBoard(board)
   * 2. Get valid moves
   * → if no moves, check if opponent has moves (pass?)
   * → if opponent also no moves, game over
   * 3. If Maximizing:
   * → return MAX of minimax(child) untuk semua child
   * 4. If Minimizing:
   * → return MIN of minimax(child) untuk semua child
   * ```
   * * @param {number[]} board - Current board
   * @param {number} depth - Remaining depth
   * @param {number} currentPlayer - Player to move (MAX or MIN based on isMaximizing)
   * @param {number} maxPlayer - Original maximizing player (untuk evaluasi)
   * @param {boolean} isMaximizing - Is this a MAX node?
   * @param {Object} parentNode - Node untuk tree building
   * @returns {number} Evaluation score
   * @private
   */
  _minimax(board, depth, currentPlayer, maxPlayer, isMaximizing, parentNode) {
    this.stats.nodesEvaluated++;
    this.stats.depthReached = Math.max(this.stats.depthReached, this.maxDepth - depth);

    // ─── BASE CASE 1: Depth limit reached ───
    if (depth === 0) {
      const score = evaluateBoard(board, maxPlayer);
      if (parentNode) parentNode.score = score;
      return score;
    }

    // ─── BASE CASE 2: Check for valid moves ───
    const moves = generateMoves(board, currentPlayer);

    if (moves.length === 0) {
      const opponent = -currentPlayer;
      if (hasValidMoves(board, opponent)) {
        return this._minimax(board, depth, opponent, maxPlayer, !isMaximizing, parentNode);
      } else {
        const score = evaluateTerminal(board, maxPlayer);
        if (parentNode) parentNode.score = score;
        return score;
      }
    }

    // ─── RECURSIVE CASE ───
    if (isMaximizing) {
      let maxScore = NEG_INFINITY;
      for (const move of moves) {
        const newBoard = applyMove(board, move.row, move.col, currentPlayer);
        if (!newBoard) continue;

        let childNode = null;
        if (this.buildTree && parentNode) {
          childNode = createTreeNode({ type: 'MIN', depth: depth - 1, move: move });
          parentNode.children.push(childNode);
        }

        const score = this._minimax(newBoard, depth - 1, -currentPlayer, maxPlayer, false, childNode);
        if (childNode) childNode.score = score;
        maxScore = Math.max(maxScore, score);
      }
      if (parentNode) parentNode.score = maxScore;
      return maxScore;
    } else {
      let minScore = INFINITY;
      for (const move of moves) {
        const newBoard = applyMove(board, move.row, move.col, currentPlayer);
        if (!newBoard) continue;

        let childNode = null;
        if (this.buildTree && parentNode) {
          childNode = createTreeNode({ type: 'MAX', depth: depth - 1, move: move });
          parentNode.children.push(childNode);
        }

        const score = this._minimax(newBoard, depth - 1, -currentPlayer, maxPlayer, true, childNode);
        if (childNode) childNode.score = score;
        minScore = Math.min(minScore, score);
      }
      if (parentNode) parentNode.score = minScore;
      return minScore;
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * STATISTICS & DEBUG
   * ─────────────────────────────────────────────────────────────────────────
   */

  getStats() { return { ...this.stats }; }
  getGamePhase(board) { return detectGamePhase(board); }

  logStats() {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║          MINIMAX STATISTICS                ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║ Nodes Evaluated:    ${String(this.stats.nodesEvaluated).padEnd(30)} ║`);
    console.log(`║ Nodes Pruned:       ${String(this.stats.nodesPruned).padEnd(30)} ║`);
    console.log(`║ Depth Reached:      ${String(this.stats.depthReached).padEnd(30)} ║`);
    console.log(`║ Execution Time:     ${String(this.stats.executionTime.toFixed(2) + 'ms').padEnd(30)} ║`);
    console.log(`║ Best Score:         ${String(this.stats.bestScore).padEnd(30)} ║`);
    if (this.stats.bestMove) {
      console.log(`║ Best Move:          ${String(this._formatMove(this.stats.bestMove)).padEnd(30)} ║`);
    }
    console.log('╚════════════════════════════════════════════╝\n');
  }

  _formatMove(move) {
    if (!move) return 'N/A';
    return `(${move.row}, ${move.col})`;
  }
}

const INFINITY = 999999;
const NEG_INFINITY = -999999;

export function minimaxSearch(board, depth, player) {
  const minimax = new Minimax({ maxDepth: depth });
  return minimax.findBestMove(board, player);
}

export default Minimax;