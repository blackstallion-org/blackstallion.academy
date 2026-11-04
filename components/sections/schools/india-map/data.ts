/**
 * The baked data of the sculpture (scripts/build-india-map.py): one gzipped binary per level of detail, one for the river lines,
 * and meta.json. Format: "IND1", a u32 header length, a JSON header, then typed arrays at 4-byte-aligned offsets.
 */

export type Meta = {
  version: number;
  unit_m: number;
  exaggeration: number;
  slab: number;
  floor: number;
  bevel: number;
  plate: { x: [number, number]; z: [number, number] };
  india: { x: [number, number]; z: [number, number] };
  max_elevation_m: number;
  places: { id: string; lon: number; lat: number; x: number; z: number; elevation_m: number; inside_india: boolean }[];
  coast: { file: string; width: number; height: number; falloff_km: number };
  variants: Record<"hi" | "lo", { vertices: number; triangles: number; bytes_gzip: number; error: Record<string, number> }>;
};

export type Terrain = {
  position: Float32Array;
  normal: Float32Array;
  ao: Float32Array;
  sd: Float32Array;
  index: Uint32Array;
  terrainTriangles: number;
  vertices: number;
};

export type River = { id: string; name: string; rank: number; flow: boolean; length_km: number; points: Float32Array };

const BASE = "/data/india-sculpture";

async function gunzip(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const head = new Uint8Array(buffer, 0, 2);
  // A server that already decoded the file hands over the raw bytes: only unzip what is still zipped.
  if (head[0] !== 0x1f || head[1] !== 0x8b) return buffer;
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}

async function fetchBinary(url: string, signal?: AbortSignal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const raw = await gunzip(await res.arrayBuffer());
  const view = new DataView(raw);
  const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (magic !== "IND1") throw new Error(`${url}: not a sculpture file`);
  const headLength = view.getUint32(4, true);
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(raw, 8, headLength))) as {
    counts?: Record<string, number>;
    bounds?: { x: [number, number]; y: [number, number]; z: [number, number] };
    rivers?: { id: string; name: string; rank: number; flow: boolean; length_km: number; start: number; count: number }[];
    arrays: Record<string, { type: string; offset: number; length: number }>;
  };
  const dataStart = 8 + headLength;
  const at = (name: string) => {
    const a = header.arrays[name];
    return [raw, dataStart + a.offset, a.length] as const;
  };
  return { header, at };
}

export async function loadMeta(signal?: AbortSignal): Promise<Meta> {
  const res = await fetch(`${BASE}/meta.json`, { signal });
  if (!res.ok) throw new Error(`meta.json: ${res.status}`);
  return res.json();
}

export const coastUrl = (file: string) => `${BASE}/${file}`;

export async function loadTerrain(level: "hi" | "lo", signal?: AbortSignal): Promise<Terrain> {
  const { header, at } = await fetchBinary(`${BASE}/terrain-${level}.bin.gz`, signal);
  const counts = header.counts!;
  const b = header.bounds!;
  const n = counts.vertices;
  const qx = new Uint16Array(...at("x"));
  const qy = new Uint16Array(...at("y"));
  const qz = new Uint16Array(...at("z"));
  const nrm = new Int8Array(...at("normal"));
  const aoQ = new Uint8Array(...at("ao"));
  const sdQ = new Int16Array(...at("sd"));
  const delta = new Int32Array(...at("index_delta"));
  const position = new Float32Array(n * 3);
  const normal = new Float32Array(n * 3);
  const ao = new Float32Array(n);
  const sd = new Float32Array(n);
  const dx = (b.x[1] - b.x[0]) / 65535;
  const dy = (b.y[1] - b.y[0]) / 65535;
  const dz = (b.z[1] - b.z[0]) / 65535;
  for (let i = 0; i < n; i++) {
    position[i * 3] = b.x[0] + qx[i] * dx;
    position[i * 3 + 1] = b.y[0] + qy[i] * dy;
    position[i * 3 + 2] = b.z[0] + qz[i] * dz;
    const x = nrm[i * 3], y = nrm[i * 3 + 1], z = nrm[i * 3 + 2];
    const l = Math.hypot(x, y, z) || 1;
    normal[i * 3] = x / l;
    normal[i * 3 + 1] = y / l;
    normal[i * 3 + 2] = z / l;
    ao[i] = aoQ[i] / 255;
    sd[i] = sdQ[i] / 10;
  }
  const index = new Uint32Array(delta.length);
  let acc = 0;
  for (let i = 0; i < delta.length; i++) {
    acc += delta[i];
    index[i] = acc;
  }
  return { position, normal, ao, sd, index, terrainTriangles: counts.terrainTriangles, vertices: n };
}

export async function loadRivers(signal?: AbortSignal): Promise<River[]> {
  const { header, at } = await fetchBinary(`${BASE}/lines.bin.gz`, signal);
  const pts = new Float32Array(...at("points"));
  return (header.rivers ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    rank: r.rank,
    flow: r.flow,
    length_km: r.length_km,
    points: pts.subarray(r.start * 4, (r.start + r.count) * 4),
  }));
}
