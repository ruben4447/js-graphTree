import { isValidLabel } from './node.js';
import { dtable } from './dijkstra.js';

function updateDtable() {
  dtable.update();
  dtable.show();
}

function adjustPos(event) {
  let x = event.clientX, y = event.clientY;
  let bb = event.target.getBoundingClientRect();
  return [x - bb.left, y - bb.top];
}
export function addEvents(g) {
  const canvas = g.canvas, graph = g.graph;

  let mousePos = undefined;
  let over = null;
  const mouseOver = x => {
    g.over = x;
    if (over) over.highlight = false;
    over = x;
    if (x) x.highlight = true;
    graph._changed = true;
  };
  let isMousePressed = false;

  let movedItem = false; // Have we moved the [over] item?

  const getThingOver = (x, y) => {
    for (const node of graph._nodes) {
      if (node.isMouseOver(x, y)) return node;
    }
    for (const conn of graph._conns) {
      if (conn.pointOnLine(x, y)) return conn;
    }
    return null;
  };

  let creatingConn; // If Node, means creating connection
  const creatingConnection = value => {
    creatingConn = value;
    graph._changed = true;
  };

  graph._additionalDrawFn = function (ctx) {
    if (creatingConn) {
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'purple';
      ctx.moveTo(creatingConn.x, creatingConn.y);
      ctx.lineTo(mousePos[0], mousePos[1]);
      ctx.stroke();
    }
  };

  canvas.addEventListener('mousedown', event => {
    isMousePressed = true;
  });

  canvas.addEventListener('contextmenu', ev => {
    ev.preventDefault();
    ev.stopPropagation();
  });

  canvas.addEventListener('mouseup', event => {
    isMousePressed = false;
    if (movedItem) {
      movedItem = false;
    } else {
      if (event.button === 0) {
        if (over) {
          // If click Left button
          if (typeof over.move === 'function') {
            over.onClick(g.graph._nodes, success => {
              if (success) updateDtable();
            });
          } else {
            over.onClick(success => {
              if (success) updateDtable();
            });
          }
        }
      } else if (event.button === 2) {
        // Click right button
        if (over) {
          if (creatingConn && creatingConn !== over && typeof over.move === 'function') {
            let conn;
            try {
              conn = graph.createConnection(creatingConn, over, 1);
            } catch (e) {
              window.alert(`Unable to create connection\n${e.message}`);
              conn = undefined;
            } finally {
              if (conn) conn.onClick();
              creatingConnection(undefined);
            }
          } else {
            creatingConnection(over);
          }
        } else {
          // Create new node
          let label = window.prompt(`Enter node label...`);
          if (label != null) {
            if (isValidLabel(label)) {
              if (graph.getNode(label) == null) {
                let node = graph.createNode(label);
                node.move(...mousePos);
                updateDtable();
                graph._changed = true;
              } else {
                window.alert(`Node with label '${label}' already exists`);
              }
            } else {
              window.alert(`Invalid node label '${label}`);
            }
          }
        }
      } else {
        if (typeof over.move === 'function') creatingConnection(over);
      }
    }
  });

  canvas.addEventListener('mousemove', event => {
    mousePos = adjustPos(event);
    const [x, y] = mousePos;

    if (isMousePressed) {
      if (over && typeof over.move === 'function') {
        movedItem = true;
        over.move(x, y);
      }
    } else {
      // Update new 'over' thing
      mouseOver(getThingOver(x, y));
    }
  });

  const keydownEventHandler = event => {
    if (event.key === 'Delete') {
      if (over) {
        if (typeof over.move === 'function') {
          if (window.confirm(`Delete node '${over.label}' ?`)) {
            let ok = graph.removeNode(over.label);
            if (ok) {
              graph._changed = true;
              updateDtable();
            }
          }
        } else {
          if (window.confirm(`Delete connection '${over.src.label}' -> '${over.dst.label}' ?`)) {
            let ok = graph._changed = graph.removeConnection(over.src.label, over.dst.label);
            if (ok) graph._changed = true;
          }
        }
      }
    } else if (event.key == 's') {
      if (over && typeof over.move === 'function') {
        dtable.start(over.label);
        dtable.show();
      }
    } else if (event.key == 'Enter') {
      if (over && typeof over.move === 'function') {
        dtable.startFinish(over.label);
        dtable.show();
      }
    }
  };

  window.addEventListener('keydown', keydownEventHandler);

  return function () {
    window.removeEventListener('keydown', keydownEventHandler);
  };
}