/**
 * The terrain surface as a coarse grid on the CPU, rasterised from the same triangles the GPU draws: where a marker stands, how high
 * the focus point is, and how low the camera may go. Cells with no terrain (water) read as the water level.
 */
export class HeightField {
  readonly nx: number;
  readonly nz: number;
  private readonly data: Float32Array;

  constructor(
    private readonly x0: number,
    private readonly x1: number,
    private readonly z0: number,
    private readonly z1: number,
    cell = 0.04,
  ) {
    this.nx = Math.ceil((x1 - x0) / cell);
    this.nz = Math.ceil((z1 - z0) / cell);
    this.data = new Float32Array(this.nx * this.nz).fill(Number.NaN);
  }

  /** Rasterise the first `triangles` triangles of an indexed mesh (the terrain's top surface, not its walls). */
  static fromMesh(position: Float32Array, index: Uint32Array, triangles: number, plate: { x: [number, number]; z: [number, number] }, cell = 0.04) {
    const hf = new HeightField(plate.x[0], plate.x[1], plate.z[0], plate.z[1], cell);
    const { x0, z0, nx, nz, data } = hf;
    const sx = nx / (hf.x1 - x0);
    const sz = nz / (hf.z1 - z0);
    for (let t = 0; t < triangles; t++) {
      const a = index[t * 3] * 3, b = index[t * 3 + 1] * 3, c = index[t * 3 + 2] * 3;
      const ax = (position[a] - x0) * sx, az = (position[a + 2] - z0) * sz;
      const bx = (position[b] - x0) * sx, bz = (position[b + 2] - z0) * sz;
      const cx = (position[c] - x0) * sx, cz = (position[c + 2] - z0) * sz;
      const ay = position[a + 1], by = position[b + 1], cy = position[c + 1];
      const minI = Math.max(0, Math.floor(Math.min(ax, bx, cx) - 0.5));
      const maxI = Math.min(nx - 1, Math.ceil(Math.max(ax, bx, cx) - 0.5));
      const minJ = Math.max(0, Math.floor(Math.min(az, bz, cz) - 0.5));
      const maxJ = Math.min(nz - 1, Math.ceil(Math.max(az, bz, cz) - 0.5));
      const den = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
      if (Math.abs(den) < 1e-12) continue;
      for (let j = minJ; j <= maxJ; j++) {
        for (let i = minI; i <= maxI; i++) {
          const px = i + 0.5, pz = j + 0.5;
          const l1 = ((bz - cz) * (px - cx) + (cx - bx) * (pz - cz)) / den;
          const l2 = ((cz - az) * (px - cx) + (ax - cx) * (pz - cz)) / den;
          const l3 = 1 - l1 - l2;
          const e = -0.02;
          if (l1 < e || l2 < e || l3 < e) continue;
          const y = l1 * ay + l2 * by + l3 * cy;
          const k = j * nx + i;
          if (!(data[k] >= y)) data[k] = y;
        }
      }
    }
    return hf;
  }

  private cell(i: number, j: number) {
    const v = this.data[Math.min(this.nz - 1, Math.max(0, j)) * this.nx + Math.min(this.nx - 1, Math.max(0, i))];
    return Number.isNaN(v) ? 0 : v;
  }

  /** Height at (x, z), bilinear over the grid. */
  at(x: number, z: number) {
    const fx = (x - this.x0) / (this.x1 - this.x0) * this.nx - 0.5;
    const fz = (z - this.z0) / (this.z1 - this.z0) * this.nz - 0.5;
    const i = Math.floor(fx), j = Math.floor(fz);
    const u = fx - i, v = fz - j;
    const h00 = this.cell(i, j), h10 = this.cell(i + 1, j), h01 = this.cell(i, j + 1), h11 = this.cell(i + 1, j + 1);
    return (h00 * (1 - u) + h10 * u) * (1 - v) + (h01 * (1 - u) + h11 * u) * v;
  }

  /** The highest cell within `r` of (x, z): a floor the camera and the markers can rely on. */
  maxNear(x: number, z: number, r: number) {
    let m = this.at(x, z);
    const steps = 4;
    for (let a = 0; a < 8; a++) {
      for (let s = 1; s <= steps; s++) {
        const rr = (r * s) / steps;
        m = Math.max(m, this.at(x + Math.cos((a * Math.PI) / 4) * rr, z + Math.sin((a * Math.PI) / 4) * rr));
      }
    }
    return m;
  }
}
