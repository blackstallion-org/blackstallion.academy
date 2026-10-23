import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const inputPath = "public/models/riding+gear+3d+model.glb";
const outDir = "public/models/equipment";
fs.mkdirSync(outDir, { recursive: true });

const buf = fs.readFileSync(inputPath);
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString("utf8", 20, 20 + jsonLen));
const binOffset = 20 + jsonLen;
const bin = buf.subarray(binOffset + 8);

const prim = gltf.meshes[0].primitives[0];
const posAcc = gltf.accessors[prim.attributes.POSITION];
const posBv = gltf.bufferViews[posAcc.bufferView];
const posData = new Float32Array(bin.buffer, bin.byteOffset + posBv.byteOffset, posAcc.count * 3);

const normAcc = gltf.accessors[prim.attributes.NORMAL];
const normBv = gltf.bufferViews[normAcc.bufferView];
const normData = new Float32Array(bin.buffer, bin.byteOffset + normBv.byteOffset, normAcc.count * 3);

const uvAcc = gltf.accessors[prim.attributes.TEXCOORD_0];
const uvBv = gltf.bufferViews[uvAcc.bufferView];
const uvData = new Float32Array(bin.buffer, bin.byteOffset + uvBv.byteOffset, uvAcc.count * 2);

const indAcc = gltf.accessors[prim.indices];
const indBv = gltf.bufferViews[indAcc.bufferView];
const indices = indAcc.componentType === 5125 
  ? new Uint32Array(bin.buffer, bin.byteOffset + indBv.byteOffset, indAcc.count)
  : new Uint16Array(bin.buffer, bin.byteOffset + indBv.byteOffset, indAcc.count);

const imgBv = gltf.bufferViews[gltf.images[0].bufferView];
const imgBytes = bin.subarray(imgBv.byteOffset, imgBv.byteOffset + imgBv.byteLength);

// Filter definitions for the 5 models
const parts = [
  {
    id: "helmet",
    name: "BSAH Riding Helmet",
    filter: (x, y, z) => x > 0.08 && y > 0.52 && z > -0.05,
    targetScale: 1.0,
  },
  {
    id: "saddle",
    name: "BSAH Cavalry Saddle",
    filter: (x, y, z) => x < 0.05 && y > 0.38,
    targetScale: 1.1,
  },
  {
    id: "bridle",
    name: "BSAH Leather Bridle",
    filter: (x, y, z) => x < 0.05 && y > 0.15 && y <= 0.38 && z > 0.02,
    targetScale: 1.0,
  },
  {
    id: "stirrups",
    name: "BSAH Stirrup Iron",
    filter: (x, y, z) => x > 0.10 && y > 0.12 && y <= 0.52 && z > -0.05 && z < 0.22,
    targetScale: 1.0,
  },
  {
    id: "boots",
    name: "BSAH Riding Boots",
    filter: (x, y, z) => y <= 0.15 || z < -0.15,
    targetScale: 1.05,
  },
];

for (const part of parts) {
  console.log(`Processing ${part.name} (${part.id})...`);
  
  // 1. Gather all triangles belonging to this part
  const partTriangles = [];
  for (let i = 0; i < indices.length; i += 3) {
    const i1 = indices[i], i2 = indices[i+1], i3 = indices[i+2];
    const cx = (posData[i1*3] + posData[i2*3] + posData[i3*3]) / 3;
    const cy = (posData[i1*3+1] + posData[i2*3+1] + posData[i3*3+1]) / 3;
    const cz = (posData[i1*3+2] + posData[i2*3+2] + posData[i3*3+2]) / 3;
    if (part.filter(cx, cy, cz)) {
      partTriangles.push(i1, i2, i3);
    }
  }

  // 2. Identify unique vertices and remap
  const oldToNew = new Map();
  const newPositions = [];
  const newNormals = [];
  const newUVs = [];
  const newIndices = [];

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  let sumX = 0, sumY = 0, sumZ = 0;

  for (let i = 0; i < partTriangles.length; i++) {
    const oldIdx = partTriangles[i];
    let newIdx = oldToNew.get(oldIdx);
    if (newIdx === undefined) {
      newIdx = oldToNew.size;
      oldToNew.set(oldIdx, newIdx);

      const x = posData[oldIdx * 3];
      const y = posData[oldIdx * 3 + 1];
      const z = posData[oldIdx * 3 + 2];

      sumX += x; sumY += y; sumZ += z;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;

      newPositions.push(x, y, z);
      newNormals.push(normData[oldIdx * 3], normData[oldIdx * 3 + 1], normData[oldIdx * 3 + 2]);
      newUVs.push(uvData[oldIdx * 2], uvData[oldIdx * 2 + 1]);
    }
    newIndices.push(newIdx);
  }

  const vertCount = oldToNew.size;
  const avgX = sumX / vertCount;
  const avgY = sumY / vertCount;
  const avgZ = sumZ / vertCount;

  // Center positions at origin and normalize
  const centeredPositions = new Float32Array(vertCount * 3);
  let cMinX = Infinity, cMaxX = -Infinity;
  let cMinY = Infinity, cMaxY = -Infinity;
  let cMinZ = Infinity, cMaxZ = -Infinity;

  for (let i = 0; i < vertCount; i++) {
    const cx = (newPositions[i * 3] - avgX) * part.targetScale;
    const cy = (newPositions[i * 3 + 1] - avgY) * part.targetScale;
    const cz = (newPositions[i * 3 + 2] - avgZ) * part.targetScale;
    centeredPositions[i * 3] = cx;
    centeredPositions[i * 3 + 1] = cy;
    centeredPositions[i * 3 + 2] = cz;

    if (cx < cMinX) cMinX = cx; if (cx > cMaxX) cMaxX = cx;
    if (cy < cMinY) cMinY = cy; if (cy > cMaxY) cMaxY = cy;
    if (cz < cMinZ) cMinZ = cz; if (cz > cMaxZ) cMaxZ = cz;
  }

  const finalNormals = new Float32Array(newNormals);
  const finalUVs = new Float32Array(newUVs);
  const finalIndices = new Uint32Array(newIndices);

  // 3. Assemble binary buffers with 4-byte padding
  const posBytes = Buffer.from(centeredPositions.buffer);
  const normBytes = Buffer.from(finalNormals.buffer);
  const uvBytes = Buffer.from(finalUVs.buffer);
  const indBytes = Buffer.from(finalIndices.buffer);

  function padBin(buf, align = 4) {
    const remainder = buf.length % align;
    if (remainder === 0) return buf;
    const padding = align - remainder;
    return Buffer.concat([buf, Buffer.alloc(padding, 0x00)]);
  }

  function padJson(buf, align = 4) {
    const remainder = buf.length % align;
    if (remainder === 0) return buf;
    const padding = align - remainder;
    return Buffer.concat([buf, Buffer.alloc(padding, 0x20)]); // Spaces for JSON chunk!
  }

  const paddedPos = padBin(posBytes);
  const paddedNorm = padBin(normBytes);
  const paddedUV = padBin(uvBytes);
  const paddedInd = padBin(indBytes);
  const paddedImg = padBin(imgBytes);

  let offset = 0;
  const bvPos = { buffer: 0, byteOffset: offset, byteLength: posBytes.length, target: 34962 };
  offset += paddedPos.length;
  const bvNorm = { buffer: 0, byteOffset: offset, byteLength: normBytes.length, target: 34962 };
  offset += paddedNorm.length;
  const bvUV = { buffer: 0, byteOffset: offset, byteLength: uvBytes.length, target: 34962 };
  offset += paddedUV.length;
  const bvInd = { buffer: 0, byteOffset: offset, byteLength: indBytes.length, target: 34963 };
  offset += paddedInd.length;
  const bvImg = { buffer: 0, byteOffset: offset, byteLength: imgBytes.length };
  offset += paddedImg.length;

  const binBuffer = Buffer.concat([paddedPos, paddedNorm, paddedUV, paddedInd, paddedImg]);

  // 4. Create glTF JSON structure
  const outGltf = {
    asset: { version: "2.0", generator: "BSAH 3D Equipment Exporter" },
    scene: 0,
    scenes: [{ name: part.name, nodes: [0] }],
    nodes: [{ name: part.id, mesh: 0 }],
    meshes: [
      {
        name: part.id,
        primitives: [
          {
            attributes: {
              POSITION: 0,
              NORMAL: 1,
              TEXCOORD_0: 2,
            },
            indices: 3,
            material: 0,
          },
        ],
      },
    ],
    materials: [
      {
        name: `${part.id}_material`,
        pbrMetallicRoughness: {
          baseColorTexture: { index: 0 },
          metallicFactor: 0.15,
          roughnessFactor: 0.65,
        },
      },
    ],
    textures: [{ sampler: 0, source: 0 }],
    images: [{ bufferView: 4, mimeType: "image/jpeg", name: `${part.id}_texture` }],
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: 5126,
        count: vertCount,
        type: "VEC3",
        max: [cMaxX, cMaxY, cMaxZ],
        min: [cMinX, cMinY, cMinZ],
      },
      {
        bufferView: 1,
        byteOffset: 0,
        componentType: 5126,
        count: vertCount,
        type: "VEC3",
      },
      {
        bufferView: 2,
        byteOffset: 0,
        componentType: 5126,
        count: vertCount,
        type: "VEC2",
      },
      {
        bufferView: 3,
        byteOffset: 0,
        componentType: 5125,
        count: finalIndices.length,
        type: "SCALAR",
      },
    ],
    bufferViews: [bvPos, bvNorm, bvUV, bvInd, bvImg],
    buffers: [{ byteLength: binBuffer.length }],
  };

  const jsonStr = JSON.stringify(outGltf);
  const jsonBuf = Buffer.from(jsonStr, "utf8");
  const paddedJsonBuf = padJson(jsonBuf, 4);

  // 5. Pack GLB
  const totalLength = 12 + 8 + paddedJsonBuf.length + 8 + binBuffer.length;
  const glbHeader = Buffer.alloc(12);
  glbHeader.writeUInt32LE(0x46546c67, 0); // glTF
  glbHeader.writeUInt32LE(2, 4); // version 2
  glbHeader.writeUInt32LE(totalLength, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(paddedJsonBuf.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4); // JSON

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(binBuffer.length, 0);
  binChunkHeader.writeUInt32LE(0x004e4942, 4); // BIN

  const rawGlb = Buffer.concat([glbHeader, jsonChunkHeader, paddedJsonBuf, binChunkHeader, binBuffer]);

  const rawOutPath = path.join(outDir, `${part.id}-raw.glb`);
  const dracoOutPath = path.join(outDir, `${part.id}.glb`);

  fs.writeFileSync(rawOutPath, rawGlb);
  console.log(`Wrote raw GLB: ${rawOutPath} (${(rawGlb.length / 1024 / 1024).toFixed(2)} MB)`);

  // Compress with Draco
  try {
    execSync(`npx -y @gltf-transform/cli draco "${rawOutPath}" "${dracoOutPath}"`, { stdio: "pipe" });
    const stat = fs.statSync(dracoOutPath);
    console.log(`Draco compressed: ${dracoOutPath} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
    fs.unlinkSync(rawOutPath);
  } catch (err) {
    console.error(`Draco compression failed for ${part.id}:`, err.message);
    fs.renameSync(rawOutPath, dracoOutPath);
  }
}

console.log("ALL 5 MODELS EXPORTED AND COMPRESSED!");
