/**
 * alphabeta.js
 * =============
 * Implementasi Alpha-Beta Pruning Algorithm dari nol (TIDAK copy-paste).
 * Optimasi dari Minimax dengan pruning branches yang tidak perlu.
 * * ALPHA-BETA PRUNING ALGORITMA:
 * ─────────────────────────────
 * Alpha = best score yang MAX bisa guarantee saat ini
 * Beta = best score yang MIN bisa guarantee saat ini
 * * Pruning: Jika score < alpha atau score > beta di MIN/MAX node,
 * stop searching di subtree itu (sudah tidak berguna)
 * * Efficiency: Mengurangi node evaluation hingga 90% dalam best case!
 * Complexity: O(b^(d/2)) vs Minimax O(b^d)
 * * Move ordering sangat penting untuk pruning effectiveness!
 */

import { BLACK, WHITE } from '../utils/constants.js';
import { generateMoves, applyMove, hasValidMoves } from './moveGenerator.js';
import { evaluateBoard, evaluateTerminal } from './heuristic.js';
import { sortMovesByHeuristic } from './moveGenerator.js';
import { createTreeNode } from './treeBuilder.js';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ALPHA-BETA CLASS
 * ═══════════════════════════════════════════════════════════════════════════
 */

export class AlphaBeta {
  /**
   * Constructor
   * @param {Object} config
   * @param {number} config.maxDepth - Maksimal depth (1-5)
   * @param {Object} config.callbacks - Callback functions
   * @param {boolean} config.buildTree - Build tree structure?
   * @param {boolean} config.debug - Debug mode?
   */
  constructor(config = {}) {
    this.maxDepth = config.maxDepth || 3;
    this.callbacks = config.callbacks || {};
    this.buildTree = config.buildTree || false;
    this.debug = config.debug || false;

    // Statistics
    this.stats = {
      nodesEvaluated: 0,
      nodesPruned: 0,
      cutoffsAlpha: 0,  // Alpha cutoffs
      cutoffsBeta: 0,   // Beta cutoffs
      executionTime: 0,
      depthReached: 0,
      bestMove: null,
      bestScore: 0,
      efficiencyGain: 0, // Persentase nodes yang di-prune vs total
    };

    // Game tree (untuk visualisasi)
    this.gameTree = null;

    // Move ordering cache (untuk optimasi)
    this.moveOrderingCache = new Map();
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * MAIN ALPHA-BETA ENTRY POINT
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Find best move menggunakan Alpha-Beta Pruning
   *
   * @param {number[]} board - Current board state
   * @param {number} player - Player yang akan move (Maximizing player)
   * @returns {Object} {bestMove, evaluation, stats}
   * - bestMove: {index, row, col, flips, score}
   * - evaluation: Score dari best position
   * - stats: Statistics tentang search
   */
  findBestMove(board, player) {
    // Reset statistics
    this.stats = {
      nodesEvaluated: 0,
      nodesPruned: 0,
      cutoffsAlpha: 0,
      cutoffsBeta: 0,
      executionTime: 0,
      depthReached: 0,
      bestMove: null,
      bestScore: 0,
      efficiencyGain: 0,
    };

    const startTime = performance.now();

    // Get all valid moves (dengan move ordering)
    const moves = generateMoves(board, player);

    if (moves.length === 0) {
      console.warn('No valid moves available');
      return {
        bestMove: null,
        evaluation: 0,
        stats: this.stats,
      };
    }

    // Initialize root node for tree building
    let rootNode = null;
    if (this.buildTree) {
      rootNode = createTreeNode({ type: 'MAX', depth: this.maxDepth, move: null });
    }

    // Alpha-Beta search
    let bestScore = NEG_INFINITY;
    let bestMove = null;

    // Initial alpha and beta
    let alpha = NEG_INFINITY;
    let beta = INFINITY;

    for (const move of moves) {
      const newBoard = applyMove(board, move.row, move.col, player);
      if (!newBoard) continue;

      let childNode = null;
      if (this.buildTree) {
        childNode = createTreeNode({ type: 'MIN', depth: this.maxDepth - 1, move: move });
        rootNode.children.push(childNode);
      }

      // Recursive alpha-beta untuk child position
      const opponent = -player;
      const score = this._alphaBeta(
        newBoard,
        this.maxDepth - 1,
        opponent,      // Next player
        player,        // Original maximizing player
        alpha,
        beta,
        false,         // Next node is minimizing
        childNode
      );

      if (childNode) childNode.score = score;

      // Update best move
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
        alpha = Math.max(alpha, bestScore);
      }

      // Beta cutoff at root level (jarang terjadi)
      if (alpha >= beta) {
        break;
      }
    }

    if (rootNode) rootNode.score = bestScore;

    this.stats.executionTime = performance.now() - startTime;
    this.stats.bestMove = bestMove;
    this.stats.bestScore = bestScore;
    this.gameTree = rootNode;

    // Calculate efficiency gain
    const worstCaseNodes = Math.pow(10, this.maxDepth);
    const efficiencyPercent = ((worstCaseNodes - this.stats.nodesEvaluated) / worstCaseNodes) * 100;
    this.stats.efficiencyGain = Math.max(0, efficiencyPercent);

    return {
      bestMove: bestMove ? { ...bestMove, score: bestScore } : null,
      evaluation: bestScore,
      tree: this.gameTree,
      stats: this.stats,
    };
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * RECURSIVE ALPHA-BETA IMPLEMENTATION
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Recursive Alpha-Beta function dengan pruning
   *
   * PSEUDOCODE:
   * ```
   * alphaBeta(board, depth, player, maxPlayer, alpha, beta, isMaximizing):
   * 1. Base case: depth == 0 atau game over
   * → return evaluateBoard(board)
   * 2. Get valid moves (dengan move ordering!)
   * 3. If Maximizing:
   * → for each move:
   * score = alphaBeta(child, depth-1, ..., alpha, beta, false)
   * alpha = max(alpha, score)
   * if alpha >= beta: BREAK (Beta cutoff)
   * → return alpha
   * 4. If Minimizing:
   * → for each move:
   * score = alphaBeta(child, depth-1, ..., alpha, beta, true)
   * beta = min(beta, score)
   * if alpha >= beta: BREAK (Alpha cutoff)
   * → return beta
   * ```
   *
   * @param {number[]} board - Current board
   * @param {number} depth - Remaining depth
   * @param {number} currentPlayer - Player to move
   * @param {number} maxPlayer - Original maximizing player
   * @param {number} alpha - Alpha value
   * @param {number} beta - Beta value
   * @param {boolean} isMaximizing - Is this a MAX node?
   * @param {Object} parentNode - Parent tree node
   * @returns {number} Evaluation score
   * @private
   */
  _alphaBeta(board, depth, currentPlayer, maxPlayer, alpha, beta, isMaximizing, parentNode) {
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
        return this._alphaBeta(board, depth, opponent, maxPlayer, alpha, beta, !isMaximizing, parentNode);
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

        const score = this._alphaBeta(newBoard, depth - 1, -currentPlayer, maxPlayer, alpha, beta, false, childNode);
        if (childNode) childNode.score = score;

        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, maxScore);

        if (parentNode) parentNode.score = maxScore;
        if (parentNode) parentNode.alpha = alpha;

        if (alpha >= beta) {
          this.stats.nodesPruned += moves.length - moves.indexOf(move) - 1;
          this.stats.cutoffsBeta++;
          break;
        }
      }
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

        const score = this._alphaBeta(newBoard, depth - 1, -currentPlayer, maxPlayer, alpha, beta, true, childNode);
        if (childNode) childNode.score = score;

        minScore = Math.min(minScore, score);
        beta = Math.min(beta, minScore);

        if (parentNode) parentNode.score = minScore;
        if (parentNode) parentNode.beta = beta;

        if (alpha >= beta) {
          this.stats.nodesPruned += moves.length - moves.indexOf(move) - 1;
          this.stats.cutoffsAlpha++;
          break;
        }
      }
      return minScore;
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * ALPHA-BETA WITH ITERATIVE DEEPENING
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Iterative deepening dengan Alpha-Beta
   * Search dengan depth 1, 2, 3, ... sampai time limit atau max depth
   * Memastikan selalu ada move valid dan meningkatkan quality progressively
   *
   * @param {number[]} board - Current board
   * @param {number} player - Player to move
   * @param {number} timeLimit - Time limit dalam ms (0 = unlimited)
   * @param {number} maxDepth - Maximum depth (1-5)
   * @returns {Object} {bestMove, evaluation, depthSearched, stats}
   */
  findBestMoveIterative(board, player, timeLimit = 0, maxDepth = 5) {
    const startTime = performance.now();
    let bestResult = null;

    for (let depth = 1; depth <= maxDepth; depth++) {
      this.maxDepth = depth;

      const result = this.findBestMove(board, player);

      if (result.bestMove) {
        bestResult = {
          ...result,
          depthSearched: depth,
        };
      }

      // Check time limit
      if (timeLimit > 0 && performance.now() - startTime > timeLimit) {
        break;
      }
    }

    return bestResult || { bestMove: null, evaluation: 0 };
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * QUIESCENCE SEARCH (OPTIONAL ENHANCEMENT)
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Quiescence search: continue searching di positions "quiet" 
   * untuk menghindari horizon effect
   * 
   * Dalam Othello: quiescence = positions dengan mobility stabil
   * (tidak banyak perubahan evaluation antar move)
   *
   * @param {number[]} board
   * @param {number} currentPlayer
   * @param {number} maxPlayer
   * @param {number} alpha
   * @param {number} beta
   * @param {boolean} isMaximizing
   * @returns {number}
   * @private
   */
  _quiescenceSearch(board, currentPlayer, maxPlayer, alpha, beta, isMaximizing) {
    // Evaluate position static
    const staticEval = evaluateBoard(board, maxPlayer);

    if (isMaximizing) {
      if (staticEval > alpha) alpha = staticEval;
      if (alpha >= beta) return alpha;
    } else {
      if (staticEval < beta) beta = staticEval;
      if (alpha >= beta) return beta;
    }

    // Get "forcing" moves (large captures)
    const moves = generateMoves(board, currentPlayer)
      .filter(m => m.flipCount >= 3); // Only significant captures

    if (moves.length === 0) {
      return staticEval;
    }

    if (isMaximizing) {
      let maxScore = staticEval;
      for (const move of moves) {
        const newBoard = applyMove(board, move.row, move.col, currentPlayer);
        const score = this._quiescenceSearch(
          newBoard,
          -currentPlayer,
          maxPlayer,
          alpha,
          beta,
          false
        );
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, maxScore);
        if (alpha >= beta) break;
      }
      return maxScore;
    } else {
      let minScore = staticEval;
      for (const move of moves) {
        const newBoard = applyMove(board, move.row, move.col, currentPlayer);
        const score = this._quiescenceSearch(
          newBoard,
          -currentPlayer,
          maxPlayer,
          alpha,
          beta,
          true
        );
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, minScore);
        if (alpha >= beta) break;
      }
      return minScore;
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * STATISTICS & DEBUG
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Get search statistics
   * @returns {Object}
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get pruning effectiveness
   * @returns {Object}
   */
  getPruningStats() {
    const totalNodes = this.stats.nodesEvaluated + this.stats.nodesPruned;
    const pruningRate = totalNodes > 0 ? (this.stats.nodesPruned / totalNodes * 100).toFixed(2) : 0;

    return {
      totalNodesWithoutPruning: totalNodes,
      actualNodesEvaluated: this.stats.nodesEvaluated,
      nodesPruned: this.stats.nodesPruned,
      pruningRate: `${pruningRate}%`,
      alphaAlphaNumbers: this.stats.cutoffsAlpha,
      betaCutoffs: this.stats.cutoffsBeta,
      totalCutoffs: this.stats.cutoffsAlpha + this.stats.cutoffsBeta,
    };
  }

  /**
   * Log statistics
   */
  logStats() {
    const pruneStats = this.getPruningStats();

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║        ALPHA-BETA STATISTICS               ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║ Nodes Evaluated:    ${String(this.stats.nodesEvaluated).padEnd(30)} ║`);
    console.log(`║ Nodes Pruned:       ${String(this.stats.nodesPruned).padEnd(30)} ║`);
    console.log(`║ Pruning Rate:       ${String(pruneStats.pruningRate).padEnd(30)} ║`);
    console.log(`║ Alpha Cutoffs:      ${String(this.stats.cutoffsAlpha).padEnd(30)} ║`);
    console.log(`║ Beta Cutoffs:       ${String(this.stats.cutoffsBeta).padEnd(30)} ║`);
    console.log(`║ Depth Reached:      ${String(this.stats.depthReached).padEnd(30)} ║`);
    console.log(`║ Execution Time:     ${String(this.stats.executionTime.toFixed(2) + 'ms').padEnd(30)} ║`);
    console.log(`║ Best Score:         ${String(this.stats.bestScore).padEnd(30)} ║`);
    console.log(`║ Efficiency Gain:    ${String(this.stats.efficiencyGain.toFixed(1) + '%').padEnd(30)} ║`);
    console.log('╚════════════════════════════════════════════╝\n');
  }

  /**
   * Compare dengan Minimax (untuk validasi)
   * @param {Object} minimaxStats
   */
  compareWithMinimax(minimaxStats) {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║     MINIMAX vs ALPHA-BETA COMPARISON       ║');
    console.log('╠════════════════════════════════════════════╣');

    const reduction = minimaxStats.nodesEvaluated - this.stats.nodesEvaluated;
    const reductionPercent = (reduction / minimaxStats.nodesEvaluated * 100).toFixed(2);

    console.log(`║ Minimax Nodes:      ${String(minimaxStats.nodesEvaluated).padEnd(30)} ║`);
    console.log(`║ Alpha-Beta Nodes:   ${String(this.stats.nodesEvaluated).padEnd(30)} ║`);
    console.log(`║ Nodes Reduced:      ${String(reduction).padEnd(30)} ║`);
    console.log(`║ Reduction %:        ${String(reductionPercent + '%').padEnd(30)} ║`);
    console.log(`║ Minimax Time:       ${String((minimaxStats.executionTime || 0).toFixed(2) + 'ms').padEnd(30)} ║`);
    console.log(`║ Alpha-Beta Time:    ${String(this.stats.executionTime.toFixed(2) + 'ms').padEnd(30)} ║`);
    console.log('╚════════════════════════════════════════════╝\n');
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONSTANTS
 * ═══════════════════════════════════════════════════════════════════════════
 */

const INFINITY = 999999;
const NEG_INFINITY = -999999;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SIMPLIFIED FUNCTIONS (untuk kompatibilitas)
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Simple alpha-beta function (procedural style)
 * @param {number[]} board
 * @param {number} depth
 * @param {number} player
 * @returns {Object} {bestMove, score, stats}
 */
export function alphaBetaSearch(board, depth, player) {
  const alphabeta = new AlphaBeta({ maxDepth: depth });
  return alphabeta.findBestMove(board, player);
}

/**
 * Iterative deepening search
 * @param {number[]} board
 * @param {number} player
 * @param {number} timeLimit - milliseconds
 * @param {number} maxDepth
 * @returns {Object}
 */
export function iterativeDeepeningSearch(board, player, timeLimit, maxDepth) {
  const alphabeta = new AlphaBeta({ maxDepth });
  return alphabeta.findBestMoveIterative(board, player, timeLimit, maxDepth);
}

export default AlphaBeta;
