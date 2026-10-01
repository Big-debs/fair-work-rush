import { readFile, stat } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

globalThis.ProgressEvent ??= class ProgressEvent {
  constructor(type, values = {}) {
    this.type = type;
    Object.assign(this, values);
  }
};

async function load(path) {
  const bytes = await readFile(path);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return new GLTFLoader().parseAsync(buffer, '');
}

function requireNodes(root, names, path) {
  for (const name of names) {
    if (!root.getObjectByName(name)) throw new Error(`${path} is missing ${name}`);
  }
}

const environmentPath = 'public/assets/3d/environments/kitchen-a.glb';
const propsPath = 'public/assets/3d/props/kitchen-props-a.glb';
const workerPath = 'public/assets/3d/characters/worker-a.glb';
const [environment, props, worker] = await Promise.all([
  load(environmentPath),
  load(propsPath),
  load(workerPath)
]);

for (const path of [environmentPath, propsPath, workerPath]) {
  const details = await stat(path);
  if (details.size > 150 * 1024) throw new Error(`${path} exceeds the 150 KB prototype budget`);
}

requireNodes(environment.scene, [
  'environment_kitchen_a', 'fixture_sink_basin', 'fixture_cooker',
  'hotspot_wash', 'hotspot_ingredients', 'hotspot_cook', 'hotspot_serve'
], environmentPath);
requireNodes(props.scene, [
  'props_kitchen_a', 'prop_pot_01', 'prop_bowl_01', 'prop_cloth_01',
  'state_ingredients_grouped', 'state_burner_lit', 'state_food_ready', 'state_meal_served'
], propsPath);
requireNodes(worker.scene, [
  'worker_root', 'worker_head', 'arm_r', 'arm_l', 'anchor_grip_r', 'anchor_grip_l'
], workerPath);

const requiredClips = ['idle', 'wash-hands', 'pick-up', 'stir', 'serve'];
const clips = new Set(worker.animations.map((clip) => clip.name));
for (const name of requiredClips) {
  if (!clips.has(name)) throw new Error(`${workerPath} is missing animation ${name}`);
}
for (const animation of worker.animations) {
  if (animation.tracks.some((track) => track.name.includes('worker_root.position'))) {
    throw new Error(`${workerPath} animation ${animation.name} overrides authored work-zone positions`);
  }
}

const kitchenBounds = new THREE.Box3().setFromObject(environment.scene);
const kitchenSize = kitchenBounds.getSize(new THREE.Vector3());
if (kitchenSize.x > 11 || kitchenSize.y > 5.5 || kitchenSize.z > 7) {
  throw new Error(`Kitchen dimensions exceed the authored camera volume: ${kitchenSize.toArray().join(' × ')}`);
}

console.log('Validated kitchen environment, breakfast props, interaction anchors and worker animations.');
