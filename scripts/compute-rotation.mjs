import * as THREE from "three";

// Local directions:
// local forward (face): (0, -0.3, 1).normalize()
// local up (ears): (0, 1, 0)
// local right (right cheek): (1, 0, 0)

// Target world directions:
// target forward (face): (+0.85, -0.4, 0.35).normalize()  // pointing right & down toward hand
// target up (ears): (0.1, 0.85, 0.5).normalize()          // pointing up and slightly forward

const targetForward = new THREE.Vector3(0.85, -0.45, 0.28).normalize();
const targetUp = new THREE.Vector3(-0.25, 0.75, 0.6).normalize();
const targetRight = new THREE.Vector3().crossVectors(targetUp, targetForward).normalize();
const recomputedUp = new THREE.Vector3().crossVectors(targetForward, targetRight).normalize();

const rotMatrix = new THREE.Matrix4().makeBasis(targetRight, recomputedUp, targetForward);
const euler = new THREE.Euler().setFromRotationMatrix(rotMatrix);

console.log("Calculated Euler (XYZ radians):", euler.x.toFixed(3), euler.y.toFixed(3), euler.z.toFixed(3));
console.log("Calculated Euler (degrees):", (euler.x * 180 / Math.PI).toFixed(1), (euler.y * 180 / Math.PI).toFixed(1), (euler.z * 180 / Math.PI).toFixed(1));
