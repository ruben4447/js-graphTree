import { Node } from './node.js';
import { Connection } from './connection.js';

export class Graph {
  constructor(opts = {}) {
    this._canvas = opts.canvas;
    if (opts.height != undefined) this._canvas.width = opts.width;
    if (opts.width != undefined) this._canvas.height = opts.height;
    this.ctx = this._canvas?.getContext('2d');

    this._nodes = [];
    this._conns = [];

    this._drawLoop = false;
    this._changed = true;
    this._additionalDrawFn = undefined;
  }

  get drawLoop() { return this._drawLoop; }
  set drawLoop(v) {
    v = !!v;
    if (v !== this._drawLoop) {
      this._drawLoop = !!v;
      if (v) {
        this._changed = true;
        this.draw();
      }
    }
  }

  draw() {
    if (this._changed) {
      this.ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
      if (typeof this._additionalDrawFn === 'function') this._additionalDrawFn(this.ctx);
      this._conns.forEach(obj => obj.draw(this.ctx));
      this._nodes.forEach(node => node.draw(this.ctx));
      this._changed = false;
    }

    if (this.drawLoop) requestAnimationFrame(this.draw.bind(this));
  }

  /** Return Node object with the given label, or null */
  getNode(label) {
    for (const node of this._nodes) {
      if (node.label === label) return node;
    }
    return null;
  }

  /** Return random node, or null if no nodes in graph */
  getRandomNode() {
    return this._nodes.length === 0 ? null : this._nodes[Math.floor(Math.random() * this._nodes.length)];
  }

  /** Return array of nodes in alphabetical order */
  getNodesAlphabetically() {
    return [...this._nodes].sort((a, b) => a.label.charCodeAt(0) > b.label.charCodeAt(0) ? 1 : -1);
  }

  createNode(label) {
    if (this.getNode(label) !== null) throw new Error(`Node with label '${label}' already exists`);

    const node = new Node(label);
    this._nodes.push(node);
    node._onChange = () => this._changed = true;
    return node;
  }

  removeNode(label) {
    let found = false;
    for (let i = this._nodes.length - 1; i >= 0; i--) {
      if (this._nodes[i].label === label) {
        // Remove from _nodes
        this._nodes.splice(i, 1);
        found = true;
        break;
      }
    }
    if (found) {
      for (let i = this._conns.length - 1; i >= 0; i--) {
        if (this._conns[i].src.label === label || this._conns[i].dst.label === label) {
          // Remove connection
          this._conns.splice(i, 1);
        }
      }
    }
    return found;
  }

  createConnection(src, dst, value) {
    if (this.getConnection(src.label, dst.label)) {
      throw new Error(`Connection ${src.label} -> ${dst.label} already exists`);
    }

    const conn = new Connection(src, dst, value);
    conn._onChange = () => this._changed = true;
    this._conns.push(conn);
    this._changed = true;
    return conn;
  }

  // Gets connection between src and dst (not directed)

  getConnection(labelA, labelB) {
    for (const conn of this._conns) {
      if ((conn.src.label === labelA && conn.dst.label === labelB) || (conn.dst.label === labelA && conn.src.label === labelB)) {
        return conn;
      }
    }
    return null;
  }

  /** @return {{[node: string]: number}}  { node: weight } */
  getNeighbors(nodeLabel) {
    let neighbors = {};
    if (this.getNode(nodeLabel) != null) {
      for (const conn of this._conns) {
        if (conn.src.label === nodeLabel) {
          neighbors[conn.dst.label] = conn.weight;
        } else if (conn.dst.label === nodeLabel) {
          neighbors[conn.src.label] = conn.weight;
        }
      }
    }
    return neighbors;
  }

  /** Return nodes {left: Node, right: Node} of the given node */
  getBinaryChildren(parentNode) {
    let parentNodeObj = this.getNode(parentNode);
    let leftX = parentNodeObj.x, leftNode;
    let rightX = parentNodeObj.x, rightNode;
    for (const conn of this._conns) {
      let node;
      if (conn.src.label === parentNode && conn.dst.y > parentNodeObj.y) {
        node = conn.dst;
      } else if (conn.dst.label === parentNode && conn.src.y > parentNodeObj.y) {
        node = conn.src;
      } else {
        continue;
      }
      if (node.x < leftX) {
        leftX = node.x;
        leftNode = node;
      }
      if (node.x > rightX) {
        rightX = node.x;
        rightNode = node;
      }
    }
    return { left: leftNode, right: rightNode };
  }

  removeConnection(labelA, labelB) {
    for (let i = this._conns.length - 1; i >= 0; i--) {
      if ((this._conns[i].src.label === labelA && this._conns[i].dst.label === labelB) || (this._conns[i].src.label === labelB && this._conns[i].dst.label === labelA)) {
        this._conns.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  getConnectionsFrom(label) {
    const data = {};
    this._conns.filter(obj => obj.src.label === label).forEach(obj => { data[obj.dst.label] = obj.weight; });
    // this._conns.filter(obj => obj.dst.label === label).forEach(obj => { data[obj.src.label] = obj.weight; });
    return data;
  }

  /** Return all arcs in format [src, dst, weight][] */
  getArcs() {
    const conns = this._conns.sort((a, b) => a.weight > b.weight ? 1 : -1);
    return conns.map(c => ([c.src.label, c.dst.label, c.weight]));
  }

  /** Return distance matrix */
  getDistanceMatrix(alphabetical = false) {
    const dm = [];
    const nodes = alphabetical ? this.getNodesAlphabetically() : this._nodes;
    nodes.forEach((rowNode, i) => {
      const row = [];
      nodes.forEach((colNode, j) => {
        if (rowNode === colNode) {
          row.push(NaN);
        } else {
          const conn = this.getConnection(rowNode.label, colNode.label);
          if (conn) {
            row.push(conn.weight);
          } else {
            row.push(Infinity);
          }
        }
      });
      dm.push(row);
    });
    return dm;
  }

  toObject() {
    const nodes = {};
    this._nodes.forEach(node => {
      nodes[node.label] = this.getConnectionsFrom(node.label);
      nodes[node.label]['_'] = [Math.round(node.x), Math.round(node.y)];
    });
    return nodes;
  }

  fromObject(obj) {
    this._nodes.length = 0;
    this._conns.length = 0;

    for (const node in obj) {
      if (obj.hasOwnProperty(node)) {
        let nobj = this.createNode(node);
        nobj.move(...obj[node]['_']);
      }
    }

    for (const node in obj) {
      if (obj.hasOwnProperty(node)) {
        for (const dst in obj[node]) {
          if (dst[0] != '_' && obj[node].hasOwnProperty(dst)) {
            let dstNode = this.getNode(dst);
            if (dstNode) {
              try {
                this.createConnection(this.getNode(node), dstNode, obj[node][dst]);
              } catch (e) {
                throw new Error(`Unable to create connection ${node} -> ${dst} : invalid weight value ${obj[node][dst]}`);
              }
            } else {
              throw new Error(`Connection ${node} -> ${dst} : node ${dst} doesn't exist`);
            }
          }
        }
      }
    }

    this._changed = true;
  }

  generateDijkstraTable() {
    let table = {};
    for (const node of this._nodes) table[node.label] = { visited: false, dist: Infinity, prev: undefined };
    return table;
  }

  /** Get unvisited neighbors from table */
  getUnvisitedNeighbors(table, node) {
    let unvisitedNeighbors = {};
    let neighbors = this.getNeighbors(node);
    for (let neighbor in neighbors) {
      if (!table[neighbor].visited) unvisitedNeighbors[neighbor] = neighbors[neighbor];
    }
    return unvisitedNeighbors;
  }

  populateDijkstraTable(table, start) {
    // Reset table
    for (let node in table) {
      table[node].visited = false;
      table[node].dist = Infinity;
    }

    if (table[start] == undefined) throw new Error(`Specifide starting node ${start} not found in table`);
    table[start].dist = 0;

    let currentNode = start;
    while (currentNode) {
      currentNode = this._pdtIteration(table, currentNode);
    }
  }

  /** Complete one iteration of Dijkstra's Algorithms */
  _pdtIteration(table, currentNode) {
    // Get neighbors to currentNode
    const neighbors = this.getUnvisitedNeighbors(table, currentNode);

    for (const neighbor in neighbors) {
      // console.log("\t", neighbor);

      // If first node, set to distance straight away
      let neighborToStart = neighbors[neighbor] + table[currentNode].dist;
      // console.log(`\tNeighbor ${neighbor} from ${currentNode}; ${neighbors[neighbor]} + ${table[currentNode].dist}`);
      if (neighborToStart < table[neighbor].dist) {
        table[neighbor].dist = neighborToStart;
        table[neighbor].prev = currentNode;
      }
      // let newDist = table[neighbor].dist + neighbors[neighbor];
      // console.log(`${neighbor} = ${table[neighbor].dist} + ${neighbors[neighbor]} = ${newDist}`)
    }

    table[currentNode].visited = true;

    // Get next node
    let minDistance = Infinity, nextNode;
    for (let node in table) {
      if (!table[node].visited && table[node].dist < minDistance) {
        minDistance = table[node].dist;
        nextNode = node;
      }
    }

    return nextNode;
  }

  searchDepthFirst(start) {
    let stack = [];
    let visited = [];
    let result = "";

    const getUnvisitedNeighbors = node => Object.keys(this.getNeighbors(node)).filter(node => visited.indexOf(node) === -1);

    stack.push(start);
    visited.push(start);
    while (stack.length !== 0) {
      let node = stack[stack.length - 1]; // Peek onto stack
      let neighbors = getUnvisitedNeighbors(node);
      if (neighbors.length === 0) {
        result = stack.pop() + result;
      } else {
        let next = neighbors[0];
        stack.push(next);
        visited.push(next);
      }
    }

    return result;
  }

  searchBreadthFirst(start) {
    let queue = [];
    let visited = [];
    let result = "";

    const getUnvisitedNeighbors = node => Object.keys(this.getNeighbors(node)).filter(node => visited.indexOf(node) === -1);

    queue.push(start);
    visited.push(start);

    // Visit initial neighbors from {start}
    let neighbors = getUnvisitedNeighbors(start);
    queue.push(...neighbors);
    visited.push(...neighbors);

    // Pop each item from queue, and visit all of their neighbors.
    while (queue.length !== 0) {
      let node = queue.shift();
      result += node;
      neighbors = getUnvisitedNeighbors(node);
      if (neighbors.length > 0) {
        queue.push(...neighbors);
        visited.push(...neighbors);
      }
    }

    return result;
  }

  /** Test: is this graph a tree? */
  isTree() {
    if (this._nodes.length === 0) return true;
    let node = this.getRandomNode(), from;
    const visited = new Map(); // Map visited node to which node it was visited from
    const queue = [{ node: node.label, from: undefined }]; // Contains node labels to visit
    let queueBP = 0;
    while (queueBP < queue.length) {
      ({ node, from } = queue[queueBP++]);
      if (visited.has(node)) { // Clash! We have seen this before.
        const traceback = (startNode, nodeVisitedFrom) => {
          let node = startNode, from = nodeVisitedFrom;
          const traceback = [];
          while (true) {
            traceback.push(node);
            node = from;
            if (from === undefined) break;
            from = queue.find(rec => rec.node === from).from;
          }
          return traceback.reverse();
        };
        return { tree: false, clash: node, traceback1: traceback(node, from), traceback2: traceback(node, visited.get(node)) };
      }
      visited.set(node, from); // Record as visited
      let neighbors = Object.keys(this.getNeighbors(node));
      neighbors = neighbors.filter(n => n !== from); // Remove node we just came from
      queue.push(...neighbors.map(n => ({ node: n, from: node }))); // Add neighbors to queue to explore
    }
    return { tree: true };
  }

  /** Kruskals Algorithm: minimum spanning tree. Return { arcs: Connection[], nodes: Node[] } */
  kruskals() {
    const conns = this._conns.sort((a, b) => a.weight > b.weight ? 1 : -1);
    const arcs = [], nodes = new Set();
    conns.forEach(conn => {
      const nArcs = [...arcs, conn];
      const nNodes = new Set(nodes);
      nNodes.add(conn.src);
      nNodes.add(conn.dst);
      const tmpG = new Graph();
      tmpG._nodes = Array.from(nNodes);
      tmpG._conns = nArcs;
      if (tmpG.isTree().tree) {
        arcs.push(conn);
        nodes.add(conn.src);
        nodes.add(conn.dst);
      }
    });
    return { arcs, nodes: Array.from(nodes) };
  }

  /** Prims Algorithm: minimum spanning tree. Return { arcs: Connection[], nodes: Node[] } */
  primms() {
    const mat = this.getDistanceMatrix(false);
    const visited = new Set(); // Set of indexes of visited cols
    const deletedRows = new Set(); // Set of indexes of seleted rows
    const arcs = [], nodes = new Set();
    let node = this.getRandomNode();
    while (true) {
      let ni = this._nodes.indexOf(node);
      visited.add(ni); // Mark column as visited
      deletedRows.add(ni); // Delete row
      nodes.add(node);

      let minWeight = Infinity, minNode = null;
      mat.forEach((row, i) => {
        if (!deletedRows.has(i)) {
          row.forEach((weight, j) => {
            if (visited.has(j)) {
              if (weight < minWeight) {
                minWeight = weight;
                minNode = this._nodes[i];
              }
            }
          });
        }
      });
      if (minNode === null) break;
      const conn = this.getConnection(node.label, minNode.label);
      arcs.push(conn);
      node = minNode;
    }
    return { arcs, nodes: Array.from(nodes) };
  }

  /** Pre-Order Traversal: current, left, right */
  traversePreOrder(rootNode) {
    let node = this.getNode(rootNode);
    const visited = [];
    const stack = [node];
    while (stack.length > 0) {
      node = stack.pop();
      visited.push(node);
      const { left, right } = this.getBinaryChildren(node.label);
      if (right) stack.push(right);
      if (left) stack.push(left);
    }
    return visited;
  }

  /** In-Order Traversal: left, current, current, right */
  traverseInOrder(rootNode) {
    let node = this.getNode(rootNode);
    const visited = [];
    const stack = [];
    while (stack.length > 0 || node != undefined) {
      if (node != undefined) { // Visit left branch
        stack.push(node);
        const { left } = this.getBinaryChildren(node.label);
        node = left;
      } else {
        let top = stack.pop();
        visited.push(top); // Visit current node
        const { right } = this.getBinaryChildren(top.label);
        node = right; // Visit right node
      }
    }
    return visited;
  }

  /** Post-Order Traversal: left, right, current */
  traversePostOrder(rootNode) {
    let node = this.getNode(rootNode);
    const visited = [];
    const stack = [];
    while (stack.length > 0 || node != undefined) {
      if (node != undefined) { // Visit left branch
        stack.push(node);
        const { left } = this.getBinaryChildren(node.label);
        node = left;
      } else {
        let top = stack[stack.length - 1];
        const { right } = this.getBinaryChildren(top.label);
        if (right && visited[visited.length - 1] !== right) { // Visit right branch if not visited
          node = right;
        } else { // Visit current node
          visited.push(stack.pop());
        }
      }
    }
    return visited;
  }

  /** Create graph explicitly from array of nodes and connections */
  static createExplicitly(opts, nodes, connections) {
    const G = new Graph(opts);
    G._nodes = nodes;
    G._conns = connections;
    return G;
  }
}