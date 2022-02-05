export const WIDTH = 3;

export class Connection {
  constructor(src, dst, weight = 0) {
    this.weight = weight;
    this.src = src;
    this.dst = dst;
    this._highlight = false;
    this._onChange = undefined;
  }

  get weight() { return this._weight; }
  set weight(w) {
    w = +w;
    if (w < 0 || isNaN(w) || !isFinite(w)) throw new Error(`#<Connection>.set weight: invalid weight value ${w}`);
    this._weight = w;
  }

  get highlight() { return this._highlight; }
  set highlight(value) {
    this._highlight = !!value;
    this.onChange();
  }

  clone() {
    const C = new Connection(this.src.clone(), this.dst.clone(), this.weight);
    return C;
  }

  onChange() {
    if (typeof this._onChange === 'function') this._onChange();
  }

  draw(ctx) {
    let midx = (this.src.x + this.dst.x) / 2;
    let midy = (this.src.y + this.dst.y) / 2;

    ctx.lineWidth = WIDTH;
    ctx.beginPath();
    ctx.strokeStyle = this.highlight ? "red" : "black";
    ctx.moveTo(this.src.x, this.src.y);
    ctx.lineTo(this.dst.x, this.dst.y);
    ctx.stroke();

    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.font = '14px Courier New';
    let d = 10;
    ctx.fillText(this.weight, midx + d, midy - d);
  }

  pointOnLine(x, y, delta = WIDTH) {
    // Check if {x} value is in bounds, first
    if (x < Math.min(this.src.x, this.dst.x) || x > Math.max(this.dst.x, this.src.x)) {
      return false;
    }

    // Get line gradient
    // m = (y2 - y1) / (x2 - x1)
    const m = (this.dst.y - this.src.y) / (this.dst.x - this.src.x);

    // Calculate actual y value we would expect at {x}
    // y = m*x - m*x1 + y1
    const actualY = (m * x) - (m * this.src.x) + this.src.y;

    if (delta == 0) {
      return actualY == y;
    } else {
      // Is y in range of actualY +- delta ?
      return y >= actualY - delta && y <= actualY + delta;
    }
  }

  onClick(callback) {
    let weight = window.prompt(`Connection weight ${this.toString()}`, this.weight);
    if (weight != null) {
      weight = +weight;
      if (weight < 0 || isNaN(weight) || !isFinite(weight)) {
        if (callback) callback(false);
        window.alert("Invalid weight");
      } else {
        this.weight = weight;
        this.onChange();
        if (callback) callback(true);
      }
    } else {
      if (callback) callback(false);
    }
  }

  toString() {
    return this.src.label + ' -> ' + this.dst.label;
  }
}