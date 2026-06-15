/**
 * treeBuilder.js
 * ===============
 * Utility untuk membangun dan analisis game tree.
 * Digunakan untuk visualisasi Minimax dan Alpha-Beta Pruning.
 * * Struktur tree node:
 * {
 * id: unique identifier
 * type: 'MAX' | 'MIN' | 'LEAF'
 * depth: kedalaman dalam tree
 * move: {row, col, flips} (null untuk root)
 * score: evaluation score
 * alpha: alpha value (Alpha-Beta)
 * beta: beta value (Alpha-Beta)
 * children: [child nodes]
 * isPruned: boolean (untuk visualisasi)
 * isBest: boolean (best path)
 * }
 */

import { BLACK, WHITE } from '../utils/constants.js';
import { applyMove, generateMoves } from './moveGenerator.js';
import { evaluateBoard, evaluateTerminal } from './heuristic.js';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TREE NODE BUILDER
 * ═══════════════════════════════════════════════════════════════════════════
 */

let NODE_COUNTER = 0; // Global counter untuk unique IDs

/**
 * Create tree node
 * @param {Object} config
 * @returns {Object} Tree node
 */
export function createTreeNode(config = {}) {
  return {
    id: `node_${NODE_COUNTER++}`,
    type: config.type || 'NODE', // MAX | MIN | LEAF
    depth: config.depth || 0,
    move: config.move || null,
    score: config.score !== undefined ? config.score : 0,
    alpha: config.alpha !== undefined ? config.alpha : null,
    beta: config.beta !== undefined ? config.beta : null,
    children: [],
    isPruned: config.isPruned || false,
    isBest: config.isBest || false,
    board: config.board || null, // Store board state (optional, heavy memory)
    label: config.label || null, // Tambahan: buat label cutoff/pruning
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * TREE BUILDING FUNCTIONS
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Build complete game tree (untuk small depths)
 * * ⚠️  Warning: Memory intensive! Gunakan hanya untuk depth 3-4
 * Depth 5 = jutaan nodes
 * * @param {number[]} board - Current board
 * @param {number} depth - Current depth
 * @param {number} maxDepth - Maximum depth
 * @param {number} currentPlayer - Current player to move
 * @param {number} maxPlayer - Maximizing player (untuk evaluasi)
 * @param {boolean} isMaximizing - Is this a MAX node?
 * @returns {Object} Root tree node
 */
export function buildGameTree(board, depth, maxDepth, currentPlayer, maxPlayer, isMaximizing) {
  NODE_COUNTER = 0; // Reset counter

  const rootNode = _buildTreeRecursive(
    board,
    depth,
    maxDepth,
    currentPlayer,
    maxPlayer,
    isMaximizing
  );

  // Mark best path (untuk visualisasi)
  markBestPath(rootNode);

  return rootNode;
}

/**
 * Recursive tree building
 * @private
 */
function _buildTreeRecursive(board, depth, maxDepth, currentPlayer, maxPlayer, isMaximizing) {
  // Create node
  const node = createTreeNode({
    type: isMaximizing ? 'MAX' : 'MIN',
    depth: maxDepth - depth,
  });

  // Base case: depth reached atau game over
  if (depth === 0) {
    node.type = 'LEAF';
    node.score = evaluateBoard(board, maxPlayer);
    return node;
  }

  // Get valid moves
  const moves = generateMoves(board, currentPlayer);

  if (moves.length === 0) {
    // No moves
    const opponent = -currentPlayer;
    if (generateMoves(board, opponent).length === 0) {
      // Game over
      node.type = 'LEAF';
      node.score = evaluateTerminal(board, maxPlayer);
      return node;
    } else {
      // Pass to opponent
      return _buildTreeRecursive(
        board,
        depth,
        maxDepth,
        opponent,
        maxPlayer,
        !isMaximizing
      );
    }
  }

  // Build children
  for (const move of moves) {
    const newBoard = applyMove(board, move.row, move.col, currentPlayer);
    if (!newBoard) continue;

    const childNode = _buildTreeRecursive(
      newBoard,
      depth - 1,
      maxDepth,
      -currentPlayer,
      maxPlayer,
      !isMaximizing
    );

    childNode.move = move;
    node.children.push(childNode);
  }

  // Calculate node score dari children
  if (node.children.length > 0) {
    if (isMaximizing) {
      node.score = Math.max(...node.children.map(c => c.score));
    } else {
      node.score = Math.min(...node.children.map(c => c.score));
    }
  }

  return node;
}

// (Fungsi markBestPath, markPrunedNodes, countNodes, dll... tetep sama, jangan diubah)
// Gw nggak tulis ulang biar lu tinggal timpa bagian atasnya aja.

/**
 * ─────────────────────────────────────────────────────────────────────────
 * TREE ANALYSIS FUNCTIONS
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Mark best path dari root ke best leaf
 * Best path = path yang menghasilkan best score
 * @param {Object} node - Tree node
 */
export function markBestPath(node) {
  if (!node || node.children.length === 0) return;

  // Find best child
  let bestChild;
  if (node.type === 'MAX') {
    bestChild = node.children.reduce((best, child) =>
      child.score > best.score ? child : best
    );
  } else {
    bestChild = node.children.reduce((best, child) =>
      child.score < best.score ? child : best
    );
  }

  if (bestChild) {
    bestChild.isBest = true;
    markBestPath(bestChild);
  }
}

/**
 * Mark pruned nodes (untuk Alpha-Beta visualization)
 * @param {Object} node - Tree node
 * @param {number[]} prunedNodeIds - Array of node IDs yang dipangkas
 */
export function markPrunedNodes(node, prunedNodeIds) {
  if (!node) return;

  if (prunedNodeIds.includes(node.id)) {
    node.isPruned = true;
  }

  for (const child of node.children) {
    markPrunedNodes(child, prunedNodeIds);
  }
}

/**
 * Count nodes dalam tree
 * @param {Object} node
 * @returns {number}
 */
export function countNodes(node) {
  if (!node) return 0;
  let count = 1;
  for (const child of node.children) {
    count += countNodes(child);
  }
  return count;
}

/**
 * Count leaf nodes
 * @param {Object} node
 * @returns {number}
 */
export function countLeafNodes(node) {
  if (!node) return 0;
  if (node.children.length === 0) return 1;

  let count = 0;
  for (const child of node.children) {
    count += countLeafNodes(child);
  }
  return count;
}

/**
 * Count pruned nodes
 * @param {Object} node
 * @returns {number}
 */
export function countPrunedNodes(node) {
  if (!node) return 0;

  let count = node.isPruned ? 1 : 0;
  for (const child of node.children) {
    count += countPrunedNodes(child);
  }
  return count;
}

/**
 * Get all nodes di level tertentu
 * @param {Object} node
 * @param {number} targetDepth
 * @returns {Array}
 */
export function getNodesAtDepth(node, targetDepth) {
  if (!node) return [];

  const nodes = [];

  function traverse(n, currentDepth) {
    if (currentDepth === targetDepth) {
      nodes.push(n);
      return;
    }
    for (const child of n.children) {
      traverse(child, currentDepth + 1);
    }
  }

  traverse(node, 0);
  return nodes;
}

/**
 * Get max depth dari tree
 * @param {Object} node
 * @returns {number}
 */
export function getTreeDepth(node) {
  if (!node || node.children.length === 0) return 0;

  let maxChildDepth = 0;
  for (const child of node.children) {
    maxChildDepth = Math.max(maxChildDepth, getTreeDepth(child));
  }
  return maxChildDepth + 1;
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * TREE TRAVERSAL FUNCTIONS
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Pre-order traversal (visit node sebelum children)
 * @param {Object} node
 * @param {Function} callback - callback(node)
 */
export function preOrderTraversal(node, callback) {
  if (!node) return;
  callback(node);
  for (const child of node.children) {
    preOrderTraversal(child, callback);
  }
}

/**
 * Post-order traversal (visit node setelah children)
 * @param {Object} node
 * @param {Function} callback
 */
export function postOrderTraversal(node, callback) {
  if (!node) return;
  for (const child of node.children) {
    postOrderTraversal(child, callback);
  }
  callback(node);
}

/**
 * Level-order traversal (breadth-first)
 * @param {Object} root
 * @param {Function} callback
 */
export function levelOrderTraversal(root, callback) {
  if (!root) return;

  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    callback(node);
    queue.push(...node.children);
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * TREE STATISTICS
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Get comprehensive tree statistics
 * @param {Object} root
 * @returns {Object}
 */
export function getTreeStats(root) {
  if (!root) return null;

  const totalNodes = countNodes(root);
  const leafNodes = countLeafNodes(root);
  const prunedNodes = countPrunedNodes(root);
  const depth = getTreeDepth(root);

  return {
    totalNodes,
    leafNodes,
    internalNodes: totalNodes - leafNodes,
    prunedNodes,
    depth,
    branchingFactor: leafNodes > 0 ? (totalNodes / leafNodes).toFixed(2) : 0,
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * TREE VISUALIZATION (TEXT FORMAT)
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Convert tree ke text format (untuk console visualization)
 * Hanya untuk small trees (depth <= 3)
 * 
 * @param {Object} node
 * @param {string} prefix
 * @param {boolean} isLast
 * @returns {string}
 */
export function treeToString(node, prefix = '', isLast = true) {
  if (!node) return '';

  let result = prefix;

  if (isLast) {
    result += '└── ';
    prefix += '    ';
  } else {
    result += '├── ';
    prefix += '│   ';
  }

  // Node label
  const moveStr = node.move ? `(${node.move.row},${node.move.col})` : 'ROOT';
  const scoreStr = `[${node.score}]`;
  const typeStr = node.type === 'MAX' ? '📈' : node.type === 'MIN' ? '📉' : '🍂';
  const pruneStr = node.isPruned ? '❌ PRUNED' : '';
  const bestStr = node.isBest ? '✓ BEST' : '';

  result += `${typeStr} ${moveStr} ${scoreStr} ${pruneStr} ${bestStr}\n`;

  // Children
  for (let i = 0; i < node.children.length; i++) {
    const isLastChild = i === node.children.length - 1;
    result += treeToString(node.children[i], prefix, isLastChild);
  }

  return result;
}

/**
 * Print tree ke console
 * @param {Object} node
 */
export function printTree(node) {
  console.log('\n' + treeToString(node));
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 * TREE EXPORT & SERIALIZATION
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Serialize tree ke JSON (tanpa board state untuk size)
 * @param {Object} node
 * @returns {Object}
 */
export function serializeTree(node) {
  if (!node) return null;

  return {
    id: node.id,
    type: node.type,
    depth: node.depth,
    move: node.move,
    score: node.score,
    alpha: node.alpha,
    beta: node.beta,
    isPruned: node.isPruned,
    isBest: node.isBest,
    children: node.children.map(serializeTree),
  };
}

/**
 * Get tree sebagai JSON string
 * @param {Object} node
 * @returns {string}
 */
export function treeToJSON(node) {
  return JSON.stringify(serializeTree(node), null, 2);
}

export default {
  // Node creation
  createTreeNode,

  // Tree building
  buildGameTree,

  // Analysis
  markBestPath,
  markPrunedNodes,
  countNodes,
  countLeafNodes,
  countPrunedNodes,
  getNodesAtDepth,
  getTreeDepth,
  getTreeStats,

  // Traversal
  preOrderTraversal,
  postOrderTraversal,
  levelOrderTraversal,

  // Visualization
  treeToString,
  printTree,

  // Export
  serializeTree,
  treeToJSON,
};
