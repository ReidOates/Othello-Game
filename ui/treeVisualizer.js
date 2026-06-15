/**
 * treeVisualizer.js
 * ==================
 * Visualisasi game tree (Minimax / Alpha-Beta) dalam canvas atau SVG.
 * Menampilkan nodes, edges, pruned nodes, best path, etc.
 * Mendukung fitur Pan, Zoom, dan Expand/Collapse.
 */

import { getTreeStats, getNodesAtDepth } from '../ai/treeBuilder.js';

export class TreeVisualizer {
  constructor(container, width = 1200, height = 600) {
    if (typeof container === 'string') {
      this.containerElement = document.querySelector(container);
    } else {
      this.containerElement = container;
    }

    if (!this.containerElement) {
      throw new Error('Container element not found');
    }

    this.width = width;
    this.height = height;
    this.tree = null;

    // Viewport state for Pan & Zoom
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;

    this._initializeCanvas();
  }

  _initializeCanvas() {
    // Create SVG container
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'tree-visualizer-svg';
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', this.height);
    svg.style.border = '1px solid #ccc';
    svg.style.backgroundColor = '#f9f9f9';
    svg.style.display = 'block';
    svg.style.cursor = 'grab';

    // Main group for transformations
    this.treeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(this.treeGroup);

    this.svgElement = svg;
    this.containerElement.appendChild(svg);
    this.containerElement.style.position = 'relative';

    // Event Listeners for Zoom & Pan
    svg.addEventListener('wheel', (e) => this._handleZoom(e), { passive: false });
    svg.addEventListener('mousedown', (e) => this._handleDragStart(e));
    svg.addEventListener('mousemove', (e) => this._handleDragMove(e));
    svg.addEventListener('mouseup', () => this._handleDragEnd());
    svg.addEventListener('mouseleave', () => this._handleDragEnd());
  }

  _handleZoom(e) {
    e.preventDefault();
    const zoomFactor = 0.1;
    const direction = e.deltaY < 0 ? 1 : -1;
    
    let newScale = this.scale + direction * zoomFactor;
    newScale = Math.max(0.2, Math.min(newScale, 3)); // Restrict scale between 0.2 and 3

    // Get mouse position relative to SVG
    const rect = this.svgElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Adjust translation so it zooms into mouse position
    this.translateX = mouseX - (mouseX - this.translateX) * (newScale / this.scale);
    this.translateY = mouseY - (mouseY - this.translateY) * (newScale / this.scale);
    this.scale = newScale;

    this._applyTransform();
  }

  _handleDragStart(e) {
    this.isDragging = true;
    this.dragStartX = e.clientX - this.translateX;
    this.dragStartY = e.clientY - this.translateY;
    this.svgElement.style.cursor = 'grabbing';
  }

  _handleDragMove(e) {
    if (!this.isDragging) return;
    this.translateX = e.clientX - this.dragStartX;
    this.translateY = e.clientY - this.dragStartY;
    this._applyTransform();
  }

  _handleDragEnd() {
    this.isDragging = false;
    this.svgElement.style.cursor = 'grab';
  }

  _applyTransform() {
    this.treeGroup.setAttribute('transform', `translate(${this.translateX}, ${this.translateY}) scale(${this.scale})`);
  }

  render(tree, options = {}) {
    if (!tree) {
      console.warn('No tree to visualize');
      return;
    }

    this.tree = tree;

    // Reset view if options says so
    if (options.resetView) {
      this.scale = 1;
      this.translateX = 0;
      this.translateY = 0;
      this._applyTransform();
    }

    // Clear previous rendering in group
    this.treeGroup.innerHTML = '';

    // Calculate layout
    const layout = this._calculateLayout(tree, options);

    // Center tree on first render or reset
    if (this.translateX === 0 && this.translateY === 0) {
      const rootPos = layout.get(tree.id);
      if (rootPos) {
        this.translateX = (this.svgElement.clientWidth / 2) - rootPos.x;
        this.translateY = 50;
        this._applyTransform();
      }
    }

    // Draw edges first
    this._drawEdges(tree, layout, options);
    
    // Draw nodes
    this._drawNodes(tree, layout, options);

    // Legend
    this._updateLegend(options);
  }

  _calculateLayout(tree, options = {}) {
    const nodeSpacingX = options.nodeSpacingX || 60;
    const nodeSpacingY = options.nodeSpacingY || 80;
    const layout = new Map();

    // Reingold-Tilford simplified (assigning X based on leaves)
    let currentX = 0;

    const postOrder = (node, depth) => {
      if (node._collapsed || !node.children || node.children.length === 0) {
        layout.set(node.id, { x: currentX, y: depth * nodeSpacingY, depth });
        currentX += nodeSpacingX;
        return layout.get(node.id).x;
      }

      let minX = Infinity;
      let maxX = -Infinity;

      for (const child of node.children) {
        const childX = postOrder(child, depth + 1);
        minX = Math.min(minX, childX);
        maxX = Math.max(maxX, childX);
      }

      const x = (minX + maxX) / 2;
      layout.set(node.id, { x, y: depth * nodeSpacingY, depth });
      return x;
    };

    postOrder(tree, 0);

    return layout;
  }

  _drawEdges(node, layout, options = {}) {
    if (!node || node._collapsed || !node.children) return;

    const fromPos = layout.get(node.id);
    for (const child of node.children) {
      const toPos = layout.get(child.id);
      if (fromPos && toPos) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        let strokeColor = '#999';
        let strokeWidth = 1.5;

        if (child.isPruned) {
          strokeColor = '#ff6b6b';
          strokeWidth = 2;
        } else if (child.isBest) {
          strokeColor = '#00c896';
          strokeWidth = 3;
        }

        line.setAttribute('x1', fromPos.x);
        line.setAttribute('y1', fromPos.y);
        line.setAttribute('x2', toPos.x);
        line.setAttribute('y2', toPos.y);
        line.setAttribute('stroke', strokeColor);
        line.setAttribute('stroke-width', strokeWidth);
        this.treeGroup.appendChild(line);
      }
      this._drawEdges(child, layout, options);
    }
  }

  _drawNodes(node, layout, options = {}) {
    if (!node) return;

    const pos = layout.get(node.id);
    if (pos) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.classList.add('tree-node');
      g.style.cursor = 'pointer';
      
      // Setup click listener for collapse/expand
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        if (node.children && node.children.length > 0) {
          node._collapsed = !node._collapsed;
          this.render(this.tree, { resetView: false });
        }
      });

      const radius = 20;
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pos.x);
      circle.setAttribute('cy', pos.y);
      circle.setAttribute('r', radius);

      let fillColor = '#fff';
      if (node.type === 'MAX') fillColor = '#4caf50';
      else if (node.type === 'MIN') fillColor = '#f44336';
      else if (node.type === 'LEAF') fillColor = '#2196f3';

      if (node.isPruned) fillColor = '#9e9e9e';
      else if (node.isBest) fillColor = '#ffeb3b';

      circle.setAttribute('fill', fillColor);
      circle.setAttribute('stroke', '#333');
      circle.setAttribute('stroke-width', 1.5);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', pos.x);
      text.setAttribute('y', pos.y + 4);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('fill', '#000');
      text.textContent = node.score;

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      label.textContent = `${node.type} [${node.score}]${node._collapsed ? ' (Collapsed)' : ''}`;

      g.appendChild(circle);
      g.appendChild(text);
      
      // Draw indicator if collapsed
      if (node._collapsed && node.children && node.children.length > 0) {
        const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        indicator.setAttribute('cx', pos.x);
        indicator.setAttribute('cy', pos.y + radius);
        indicator.setAttribute('r', 5);
        indicator.setAttribute('fill', '#fff');
        indicator.setAttribute('stroke', '#000');
        
        const plus = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        plus.setAttribute('x', pos.x);
        plus.setAttribute('y', pos.y + radius + 3.5);
        plus.setAttribute('text-anchor', 'middle');
        plus.setAttribute('font-size', '10');
        plus.setAttribute('font-weight', 'bold');
        plus.textContent = '+';
        
        g.appendChild(indicator);
        g.appendChild(plus);
      }

      g.appendChild(label);
      this.treeGroup.appendChild(g);
    }

    if (!node._collapsed && node.children) {
      for (const child of node.children) {
        this._drawNodes(child, layout, options);
      }
    }
  }

  _updateLegend(options = {}) {
    if (!this.tree) return;
    const stats = getTreeStats(this.tree);
    if (!stats) return;

    let legendEl = document.getElementById('tree-legend');
    if (!legendEl) {
      legendEl = document.createElement('div');
      legendEl.id = 'tree-legend';
      legendEl.style.position = 'absolute';
      legendEl.style.bottom = '10px';
      legendEl.style.left = '10px';
      legendEl.style.padding = '8px';
      legendEl.style.background = 'rgba(255, 255, 255, 0.9)';
      legendEl.style.border = '1px solid #ccc';
      legendEl.style.borderRadius = '4px';
      legendEl.style.fontSize = '12px';
      legendEl.style.color = '#333';
      legendEl.style.pointerEvents = 'none';
      legendEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      this.containerElement.appendChild(legendEl);
    }

    legendEl.innerHTML = `
      <strong>Tree Stats</strong><br/>
      Nodes: ${stats.totalNodes} | Leaves: ${stats.leafNodes} <br/>
      Pruned: ${stats.prunedNodes} | Depth: ${stats.depth}
    `;
  }

  getSVG() {
    return this.svgElement;
  }

  clear() {
    this.treeGroup.innerHTML = '';
    this.tree = null;
  }

  getStats() {
    if (!this.tree) return null;
    return getTreeStats(this.tree);
  }
}

export default TreeVisualizer;
