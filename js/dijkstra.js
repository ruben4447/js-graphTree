export class DijkstraTable {
  constructor(graph) {
    this.graph = graph;
    this._currentNode = undefined;
    this._animate = false;
    this.reset();
  }

  reset() {
    this._done();
    this._ = this.graph.generateDijkstraTable();
    for (let node in this._) {
      this._[node].visited = false;
      this._[node].dist = Infinity;
    }
  }

  get currentNode() { return this._currentNode; }
  set currentNode(value) {
    if (this._animate) {
      let node = this.graph.getNode(this._currentNode);
      if (node) node.active = false;
      this._currentNode = value;
      node = this.graph.getNode(this._currentNode);
      if (node) node.active = true;
    } else {
      this._currentNode = value;
    }
  }

  /** Initialise data table */
  start(start, animate) {
    this.reset();
    this._[start].dist = 0;
    this._animate = animate;
    this.currentNode = start;
  }

  /** One iteration */
  step() {
    if (this.currentNode) {
      this.currentNode = this.graph._pdtIteration(this._, this.currentNode);
      return true;
    } else {
      this._done();
    }
  }

  /** COmplete table (call this.step() as many times as needed) */
  complete() {
    this._animate = false;
    while (this._currentNode) {
      this._currentNode = this.graph._pdtIteration(this._, this._currentNode);
    }
    this._done();
  }

  _done() {
    this._animate = false;
    this.graph._nodes.forEach(node => node.active = false);
  }

  getData() {
    return { ...this._ };
  }

  print() { console.table(this._); }

  isComplete() { return this.currentNode == undefined; }

  /**
   * Get shortest path from <end> to wherever <start> is
   * @return {string[]} The path
  */
  getShortestPath(end) {
    if (this._[end] == undefined) return [];
    let path = [end], row = this._[end];
    while (row.prev) {
      path.push(row.prev);
      row = this._[row.prev];
    }
    return path;
  }

  /** Return cost between <end> and <start> */
  getPathCost(end) { return this._[end].dist; }
}

// Dijkstra Table manager
export const dtable = {
  el: undefined,
  stateEl: undefined,
  toggleEl: undefined, // Element which will toggle, whether started or not
  _: undefined,
  _start: undefined, // Starting node

  new(graph) {
    this._ = new DijkstraTable(graph);
  },

  show() {
    if (this._) {
      let data = this._.getData();
      let html = `<table><thead><tr><th>Node</th><th>Visited</th><th>Distance</th><th>Previous</th></tr></thead><tbody>`;
      let nodes = Object.keys(data);
      nodes.sort();
      for (let node of nodes) html += `<tr><th>${node}</th><td>${data[node].visited ? 'Yes' : 'No'}</td><td>${data[node].dist == Infinity ? '&infin;' : data[node].dist}</td><td>${data[node].prev || '-'}</td></tr>`;
      html += '</tbody></table>';
      this.el.innerHTML = html;
    }
  },

  update() {
    this._.reset();
    this.show();
  },

  start(node) {
    this._start = node;
    this._.start(node, true);
    if (this.toggleEl) this.toggleEl.removeAttribute('hidden');
    if (this.stateEl) this.stateEl.innerText = 'Done: No. Current Node: ' + node;
  },

  step() {
    this._.step();
    let state = "Done: ";
    if (this._.currentNode == undefined) {
      state += `Yes. Algorithm traced from ${this._start}.`;
    } else {
      state += `No. Current Node: ${this._.currentNode}`;
    }
    if (this.stateEl) this.stateEl.innerText = state;
  },

  /** Run Dijkstra's algorithm to completion */
  startFinish(node) {
    this._start = node;
    this._.start(node);
    this._.complete();
    if (this.stateEl) this.stateEl.innerText = `Done: Yes. Algorithm traced from ${this._start}.`;
  },

  trace(src) {
    return this._.getShortestPath(src);
  },

  reset() {
    this._start = undefined;
    this._.reset();
    if (this.toggleEl) this.toggleEl.setAttribute('hidden', 'hidden');
    if (this.stateEl) this.stateEl.innerHTML = '';
  },

  remove() {
    this.reset();
    this._ = undefined;
  },
};