import { BOARD_SIZE, COLORS, BLACK, WHITE, EMPTY, ANIMATION } from '../utils/constants.js';
import { indexToCoords, coordsToIndex } from '../utils/helpers.js';

export class BoardRenderer {
  constructor(container, cellSize = 50) {
    if (typeof container === 'string') {
      this.containerElement = document.querySelector(container);
    } else {
      this.containerElement = container;
    }

    if (!this.containerElement) {
      throw new Error('Container element not found');
    }

    this.cellSize = cellSize;
    this.boardSize = BOARD_SIZE;

    // State
    this.currentBoard = new Array(BOARD_SIZE * BOARD_SIZE).fill(EMPTY);
    this.lastMove = null;
    this.validMoves = [];
    this.animatingDiscs = new Set();
    this.cells = [];
    
    this.clickListener = null;

    this._initializeDOM();
  }

  _initializeDOM() {
    this.containerElement.innerHTML = '';
    
    this.boardContainer = document.createElement('div');
    this.boardContainer.className = 'board-container';
    
    for (let i = 0; i < this.boardSize * this.boardSize; i++) {
      const [row, col] = indexToCoords(i);
      
      const cell = document.createElement('div');
      cell.className = 'board-cell';
      cell.dataset.row = row;
      cell.dataset.col = col;
      
      cell.addEventListener('click', () => {
        if (this.clickListener) this.clickListener({ row, col });
      });
      
      this.boardContainer.appendChild(cell);
      this.cells.push(cell);
    }
    
    this.containerElement.appendChild(this.boardContainer);
  }

  render(board, options = {}) {
    this.currentBoard = [...board];
    this.lastMove = options.lastMove || null;
    this.validMoves = options.validMoves || [];

    for (let i = 0; i < this.boardSize * this.boardSize; i++) {
      const cell = this.cells[i];
      const [row, col] = indexToCoords(i);
      const value = board[i];
      
      // Clear cell
      cell.innerHTML = '';
      cell.className = 'board-cell';
      
      // Last move highlight
      if (this.lastMove && this.lastMove.row === row && this.lastMove.col === col) {
        cell.classList.add('last-move');
      }
      
      // Valid move indicator
      const isValid = this.validMoves.some(m => m.row === row && m.col === col);
      if (isValid) {
        cell.classList.add('valid-move');
      }

      // Draw disc
      if (value !== EMPTY) {
        const disc = document.createElement('div');
        disc.className = `disc ${value === BLACK ? 'black-disc' : 'white-disc'}`;
        
        // Handle animation
        if (this.animatingDiscs.has(i)) {
          disc.classList.add('flip-disc');
          setTimeout(() => {
            this.animatingDiscs.delete(i);
            disc.classList.remove('flip-disc');
          }, ANIMATION.FLIP_DURATION || 400);
        }
        
        cell.appendChild(disc);
      }
    }
  }

  animateFlip(row, col, duration = ANIMATION.FLIP_DURATION) {
    const index = coordsToIndex(row, col);
    this.animatingDiscs.add(index);
  }

  animateFlips(flips, duration = ANIMATION.FLIP_DURATION) {
    for (const flip of flips) {
      if (flip.row !== undefined && flip.col !== undefined) {
         this.animateFlip(flip.row, flip.col, duration);
      } else {
         this.animatingDiscs.add(flip);
      }
    }
  }

  onCellClick(callback) {
    this.clickListener = callback;
  }

  destroy() {
    if (this.boardContainer && this.boardContainer.parentNode) {
      this.boardContainer.parentNode.removeChild(this.boardContainer);
    }
  }
}

export default BoardRenderer;
