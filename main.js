import { Graph } from './js/graph.js';
import { addEvents } from './js/events.js';
import { dtable } from './js/dijkstra.js';
import { readFileFromInput, downloadTextFile } from './js/file.js';

// Globals
window.g = {
  wrapper: undefined,
  canvas: undefined,
  width: 1000,
  height: 600,
  ctx: undefined,
  graph: undefined,
  addEventValue: undefined, // Return value from addEvents(...)
};

function createGraph(g) {
  g.canvas = document.createElement('canvas');
  g.wrapper.appendChild(g.canvas);
  g.graph = new Graph(g);
  g.addEventValue = addEvents(g);
  g.graph.drawLoop = true;
  dtable.new(g.graph);
  dtable.show();
}

function removeGraph(g) {
  g.canvas.remove();
  g.graph.drawLoop = false;
  g.graph = undefined;
  g.addEventValue();
  g.addEventValue = undefined;
  dtable.remove();
}

function _main() {
  g.wrapper = document.getElementById('wrapper');
  dtable.el = document.getElementById('dtable');
  dtable.stateEl = document.getElementById('dtable-state');
  dtable.toggleEl = document.getElementById('dtable-toggle');
  dtable.toggleEl.setAttribute('hidden', 'hidden');
  createGraph(g);

  // let node = g.graph.createNode('A');
  // node.move(200, 350);

  // node = g.graph.createNode('B');
  // node.move(500, 350);

  // g.graph.createConnection(g.graph.getNode('A'), g.graph.getNode('B'), 17);

  const file_input = document.getElementById('upload-file');
  file_input.addEventListener('change', async () => {
    let data = await readFileFromInput(file_input);
    if (typeof data === 'string') {
      let ok = true;
      if (g.graph) removeGraph(g);
      try {
        createGraph(g);
        g.graph.fromObject(JSON.parse(data));
        dtable.update();
      } catch (e) {
        ok = false;
        window.alert(`Unable to read file data\n[Error] :: ${e.message}`);
      }

      if (ok) {
        file_input.value = '';
      }
    } else {
      window.alert(`Unable to read file.`);
    }
  });

  const file_download = document.getElementById('download-file');
  file_download.addEventListener('click', () => {
    let object = g.graph.toObject();
    downloadTextFile(JSON.stringify(object), "graph.json", "application/json");
  });

  document.getElementById('dtable-step').addEventListener('click', () => {
    dtable.step();
    dtable.show();
  });
  document.getElementById('dtable-reset').addEventListener('click', () => {
    dtable.reset();
    dtable.show();
  });
  document.getElementById('dtable-trace').addEventListener('click', () => {
    if (dtable._start) {
      let src = window.prompt(`Trace from where? (destination node: ${dtable._start}) ?`);
      if (src) {
        if (dtable._._[src]) {
          let path = dtable.trace(src);
          let cost = dtable._._[src].dist;
          window.alert(`Shortest path from ${src} to ${dtable._start} :\n${path.join(' -> ')} \nTotal Cost: ${cost}`);
        } else {
          window.alert(`Cannot trace from ${src} to ${dtable._start} :\nCannot find node '${src}'`);
        }
      }
    } else {
      window.alert('Please run Dijkstra\'s algorithm first by pressing \'Enter\' over a node, or \'s\' to step through the algorithm.');
    }
  });

  // Breadth First Search
  document.getElementById('search-bf').addEventListener('click', () => {
    let start = window.prompt(`Start breadth-first traversal from node...`);
    if (start) {
      if (g.graph.getNode(start)) {
        let result = g.graph.searchBreadthFirst(start);
        window.alert(`Breadth-First Traversal:\n${result}`);
      } else {
        window.alert(`Node ${start} could not be found.`);
      }
    }
  });
  // Depth First Search
  document.getElementById('search-df').addEventListener('click', () => {
    let start = window.prompt(`Start depth-first traversal from node...`);
    if (start) {
      if (g.graph.getNode(start)) {
        let result = g.graph.searchDepthFirst(start);
        window.alert(`Depth-First Traversal:\n${result}`);
      } else {
        window.alert(`Node ${start} could not be found.`);
      }
    }
  });
  // Tree Test
  document.getElementById('tree-test').addEventListener('click', () => {
    const obj = g.graph.isTree();
    if (obj.tree) {
      alert(`This graph is also a tree`);
    } else {
      alert(`This graph is not a tree: path clash at node ${obj.clash}\nRoute 1: ${obj.traceback1.join('->')}\nRoute 2: ${obj.traceback2.join('->')}`);
    }
  });

  // ? DATA: GRAPH
  // const data = `{"A":{"B":0,"C":0,"_":[149,87]},"B":{"C":0,"D":0,"E":0,"_":[362,88]},"C":{"D":0,"F":0,"_":[255,195]},"D":{"E":0,"H":0,"_":[388,264]},"E":{"_":[526,198]},"F":{"G":0,"_":[166,332]},"G":{"_":[166,457]},"H":{"_":[386,460]}}`;
  // ? DATA: TREE
  const data = `{"F":{"G":1,"_":[513,63]},"G":{"I":1,"_":[609,133]},"I":{"H":1,"_":[691,218]},"H":{"_":[610,287]},"B":{"F":1,"D":1,"_":[404,125]},"A":{"B":1,"_":[328,196]},"D":{"C":1,"E":1,"_":[462,208]},"C":{"_":[393,281]},"E":{"_":[522,287]}}`;
  g.graph.fromObject(JSON.parse(data));
  dtable.update();
  dtable.show();
}

window.addEventListener('load', _main);