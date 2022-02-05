export class Node {
  constructor(label) {
    this.label = label;
    this._x = 0;
    this._y = 0;
    this._onChange = undefined;
    this._highlight = false;
    this._active = false;
  }

  get highlight() { return this._highlight; }
  set highlight(value) {
    this._highlight = !!value;
    this.onChange();
  }

  get active() { return this._active; }
  set active(value) {
    this._active = !!value;
    this.onChange();
  }

  get x() { return this._x; }
  get y() { return this._y; }

  clone() {
    const N = new Node(this.label);
    N._x = this._x;
    N._y = this._y;
    N._onChange = this._onChange;
    return N;
  }

  onChange() {
    if (typeof this._onChange === 'function') this._onChange();
  }

  draw(ctx) {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Node.radius, 0, Node.pi2);
    ctx.fillStyle = "white";
    ctx.strokeStyle = this.highlight ? "red" : "black";
    ctx.fill();
    ctx.stroke();

    if (this.active) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, Node.radius - 1, 0, Node.pi2);
      ctx.fillStyle = "rgba(255, 0, 160, 0.7)";
      ctx.fill();
    }

    ctx.fillStyle = this.active ? 'yellow' : 'mediumblue';
    ctx.font = (this.active ? 'bold ' : '') + '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.label, this.x, this.y);
  }

  move(nx, ny) {
    this._x = nx;
    this._y = ny;
    this.onChange();
  }

  isMouseOver(x, y) {
    let r = Node.radius;
    if (x < this.x - r || x > this.x + r || y < this.y - r || y > this.y + r) return false;
    return true;
  }

  onClick(nodes, callback) {
    let label = window.prompt("Node name", this.label);
    if (label != null) {
      if (isValidLabel(label)) {
        for (let node of nodes) {
          if (node.label === label) {
            callback(false);
            return window.alert(`Node '${label}' already exists`);
          }
        }
        this.label = label;
        this.onChange();
        callback(true);
      } else {
        callback(false);
        window.alert("Invalid label value (must be length 0-3 and not start with '_')");
      }
    } else {
      callback(false);
    }
  }
}

export const isValidLabel = label => label[0] !== '_' && label.length !== 0 && label.length < 3;

Node.radius = 25;
Node.pi2 = 2 * Math.PI;