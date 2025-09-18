export class Grid3D {
  constructor(size, fill = 0) {
    this.size = size;
    this.data = new Uint8Array(size * size * size).fill(fill);
    this.active = []; // track live cells
  }

  _idx(x, y, z) {
    return x + y * this.size + z * this.size * this.size;
  }

  _wrap(i) {
    return (i + this.size) % this.size;
  }

  get(x, y, z) {
    return this.data[this._idx(x, y, z)];
  }

  set(x, y, z, val) {
    const idx = this._idx(x, y, z);
    const prev = this.data[idx];
    this.data[idx] = val;

    if (val === 1 && prev === 0) {
      this.active.push([x, y, z]);
    } else if (val === 0 && prev === 1) {
      // Remove from active (O(n), can be optimized with a Set or map)
      this.active = this.active.filter(([ax, ay, az]) => ax !== x || ay !== y || az !== z);
    }
  }

  cloneEmpty() {
    return new Grid3D(this.size, 0);
  }
}