import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getAssetPlan } from '../../data/assetManifest.js';

const BREAKFAST_HOTSPOTS = ['hotspot_wash', 'hotspot_ingredients', 'hotspot_cook', 'hotspot_serve'];
const BREAKFAST_CLIPS = ['wash-hands', 'pick-up', 'stir', 'serve'];
const BREAKFAST_WORKER_POSITIONS = [
  [-2.45, 0, -.75],
  [-.05, 0, .1],
  [-.72, 0, -1.08],
  [1.15, 0, .05]
];

function prepareModel(root) {
  root.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
  });
}

function findRequiredNode(root, name) {
  const node = root.getObjectByName(name);
  if (!node) throw new Error(`3D asset is missing required node: ${name}`);
  return node;
}

function makeHotspot(anchor, stepIndex) {
  const material = new THREE.MeshStandardMaterial({
    color: 0xf2c078,
    emissive: 0x5a3218,
    roughness: .5,
    transparent: true,
    opacity: .72
  });
  const hotspot = new THREE.Mesh(new THREE.SphereGeometry(.24, 16, 10), material);
  const worldPosition = new THREE.Vector3();
  anchor.getWorldPosition(worldPosition);
  hotspot.name = `interaction_${stepIndex}`;
  hotspot.position.copy(worldPosition);
  hotspot.userData.stepIndex = stepIndex;
  hotspot.userData.baseY = worldPosition.y;
  hotspot.castShadow = false;
  return hotspot;
}

function disposeRoots(scene, roots, hotspots) {
  const geometries = new Set();
  const materials = new Set();
  [...roots, ...hotspots].forEach((root) => {
    root.traverse((node) => {
      if (!node.isMesh) return;
      geometries.add(node.geometry);
      const nodeMaterials = Array.isArray(node.material) ? node.material : [node.material];
      nodeMaterials.forEach((value) => materials.add(value));
    });
    scene.remove(root);
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((value) => value.dispose());
}

export async function loadBreakfastScene(scene, activity) {
  const plan = getAssetPlan(activity);
  if (!plan || plan.pack.id !== 'kitchen' || plan.pack.status !== 'ready') return null;

  const loader = new GLTFLoader();
  const [environment, props, worker] = await Promise.all([
    loader.loadAsync(plan.pack.environmentModel),
    loader.loadAsync(plan.pack.propModel),
    loader.loadAsync(plan.character.model)
  ]);
  const roots = [environment.scene, props.scene, worker.scene];
  const hotspotAnchors = BREAKFAST_HOTSPOTS.map((name) => findRequiredNode(environment.scene, name));
  const workerRoot = findRequiredNode(worker.scene, 'worker_root');
  ['state_ingredients_grouped', 'state_burner_lit', 'state_food_ready', 'state_meal_served']
    .forEach((name) => findRequiredNode(props.scene, name));
  roots.forEach((root) => {
    prepareModel(root);
    scene.add(root);
  });
  environment.scene.updateMatrixWorld(true);

  const hotspots = hotspotAnchors.map((hotspotAnchor, index) => (
    makeHotspot(hotspotAnchor, index)
  ));
  hotspots.forEach((hotspot) => scene.add(hotspot));

  const mixer = new THREE.AnimationMixer(workerRoot);
  const clips = new Map(worker.animations.map((animation) => [animation.name, animation]));
  let activeAction = null;

  const setVisible = (name, visible) => {
    const node = props.scene.getObjectByName(name);
    if (node) node.visible = visible;
  };

  const applyState = (completedSteps) => {
    setVisible('state_ingredients_grouped', completedSteps >= 2 && completedSteps < 4);
    setVisible('state_burner_lit', completedSteps === 2);
    setVisible('state_food_ready', completedSteps >= 3 && completedSteps < 4);
    setVisible('state_meal_served', completedSteps >= 4);
  };

  const playStep = (stepIndex) => {
    const clip = clips.get(BREAKFAST_CLIPS[stepIndex]);
    const position = BREAKFAST_WORKER_POSITIONS[stepIndex];
    if (position) workerRoot.position.set(...position);
    if (!clip) return 0;
    activeAction?.stop();
    activeAction = mixer.clipAction(clip);
    activeAction.reset().setLoop(THREE.LoopOnce, 1);
    activeAction.clampWhenFinished = true;
    activeAction.play();
    return Math.min(950, clip.duration * 760);
  };

  return {
    camera: plan.pack.camera,
    hotspots,
    update(deltaSeconds) {
      mixer.update(deltaSeconds);
    },
    applyState,
    playStep,
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(workerRoot);
      disposeRoots(scene, roots, hotspots);
    }
  };
}
