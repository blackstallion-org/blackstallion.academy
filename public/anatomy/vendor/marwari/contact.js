// Generated from components/3d/contact.ts by scripts/build-anatomy-vendor.mjs. Do not edit.
/**
 * Where the horse touches the ground.
 *
 * `HoofContacts`: four small soft blobs, one under each hoof, that follow the hoof bones every frame. A blob is darkest while the
 * hoof is down and fades and spreads as it lifts, which is how ambient occlusion reads under a planted foot. The film also has a
 * real sun shadow; the blobs add the soft occlusion right at the sole that a single shadow map cannot resolve.
 *
 * `groundPatch`: the hero's stand-in for a floor, a broad soft shadow of the body and a faint pool of light, drawn on the
 * transparent canvas so the horse is lit from above on a dark stage instead of floating.
 */
import * as THREE from "three";
const HOOVES = ["Hoof_F_L", "Hoof_F_R", "Hoof_B_L", "Hoof_B_R"];
/** Length of the hoof bone (rig audit): the toe point is this far along the bone's +Y axis. */
const HOOF_LENGTH = 0.14;
/** Height of the toe point above the sole when the hoof rests on the surface. */
const TOE_ABOVE_SOLE = 0.019;
function radialTexture(stops, size = 128) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    if (g) {
        const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        for (const [at, colour] of stops)
            grad.addColorStop(at, colour);
        g.fillStyle = grad;
        g.fillRect(0, 0, size, size);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}
export class HoofContacts {
    group = new THREE.Group();
    /** Height of the ground under (x, z). The studio stands on y = 0; the film swaps in the terrain. */
    ground = () => 0;
    /** 0..1 overall darkness; the film lowers it because the sun already casts a real shadow. */
    strength = 1;
    blobs = [];
    head = new THREE.Vector3();
    toe = new THREE.Vector3();
    pos = new THREE.Vector3();
    scale = new THREE.Vector3();
    quat = new THREE.Quaternion();
    texture = radialTexture([[0, "rgba(255,255,255,0.95)"], [0.35, "rgba(255,255,255,0.55)"], [0.7, "rgba(255,255,255,0.14)"], [1, "rgba(255,255,255,0)"]]);
    constructor(bones) {
        this.group.name = "hoof-contacts";
        const geo = new THREE.PlaneGeometry(1, 1);
        geo.rotateX(-Math.PI / 2);
        for (const name of HOOVES) {
            const bone = bones[name];
            if (!bone)
                continue;
            const material = new THREE.MeshBasicMaterial({ map: this.texture, color: 0x000000, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
            const mesh = new THREE.Mesh(geo, material);
            mesh.frustumCulled = false;
            mesh.matrixAutoUpdate = false;
            mesh.renderOrder = 2;
            mesh.name = `contact-${name}`;
            mesh.onBeforeRender = () => this.place(bone, mesh, material);
            this.group.add(mesh);
            this.blobs.push({ bone, mesh, material });
        }
    }
    place(bone, mesh, material) {
        this.head.setFromMatrixPosition(bone.matrixWorld);
        this.toe.set(0, HOOF_LENGTH, 0).applyMatrix4(bone.matrixWorld);
        const x = (this.head.x + this.toe.x) / 2;
        const z = (this.head.z + this.toe.z) / 2;
        const gy = this.ground(x, z);
        // how far the lowest point of the hoof is above the surface
        const lift = Math.max(0, Math.min(this.head.y, this.toe.y - TOE_ABOVE_SOLE) - gy);
        const down = 1 - THREE.MathUtils.smoothstep(lift, 0.012, 0.32);
        material.opacity = 0.72 * this.strength * down;
        mesh.visible = material.opacity > 0.01;
        const s = 0.42 + 1.3 * lift;
        this.scale.set(s * 1.05, 1, s * 1.25);
        this.pos.set(x, gy + 0.012, z);
        mesh.matrixWorld.compose(this.pos, this.quat, this.scale);
    }
    dispose() {
        this.texture.dispose();
        for (const b of this.blobs)
            b.material.dispose();
        this.blobs[0]?.mesh.geometry.dispose();
        this.blobs.length = 0;
    }
}
/** The hero's ground: a broad soft shadow under the body and a faint pool of warm light. Named so the film can hide it. */
export function groundPatch(width = 2.6, depth = 3.6) {
    const group = new THREE.Group();
    group.name = "contact-shadow";
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshBasicMaterial({ map: radialTexture([[0, "rgba(0,0,0,0.62)"], [0.45, "rgba(0,0,0,0.26)"], [1, "rgba(0,0,0,0)"]]), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.002, 0.3);
    shadow.renderOrder = 1;
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: radialTexture([[0, "rgba(255,226,190,0.085)"], [0.5, "rgba(255,226,190,0.03)"], [1, "rgba(255,226,190,0)"]]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(0, 0.001, 0.2);
    pool.renderOrder = 0;
    group.add(pool, shadow);
    return group;
}
