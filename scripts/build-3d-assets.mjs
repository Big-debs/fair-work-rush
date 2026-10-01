import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

class NodeFileReader {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onload?.({ target: this });
    this.onloadend?.({ target: this });
  }

  async readAsDataURL(blob) {
    const bytes = Buffer.from(await blob.arrayBuffer());
    this.result = `data:${blob.type || 'application/octet-stream'};base64,${bytes.toString('base64')}`;
    this.onload?.({ target: this });
    this.onloadend?.({ target: this });
  }
}

globalThis.FileReader ??= NodeFileReader;

const palette = {
  indigo: 0x253d59,
  indigoDark: 0x172238,
  terracotta: 0xd97745,
  teal: 0x287d78,
  wood: 0x9b6b43,
  plaster: 0xe8d8bd,
  cream: 0xf7f0e4,
  gold: 0xf2c078,
  green: 0x3f8f72,
  steel: 0xb9c2c8,
  skin: 0x71442f,
  cloth: 0x72538f,
  black: 0x1b1a1a
};

function material(name, color, options = {}) {
  const value = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? .72,
    metalness: options.metalness ?? 0,
    emissive: options.emissive ?? 0x000000,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1
  });
  value.name = `mat_${name}`;
  return value;
}

const mats = {
  indigo: material('paint_indigo', palette.indigo),
  indigoDark: material('paint_indigo_dark', palette.indigoDark),
  terracotta: material('paint_terracotta', palette.terracotta),
  teal: material('paint_teal', palette.teal),
  wood: material('wood_warm', palette.wood, { roughness: .86 }),
  plaster: material('plaster_warm', palette.plaster, { roughness: .95 }),
  cream: material('counter_cream', palette.cream, { roughness: .82 }),
  gold: material('accent_gold', palette.gold),
  green: material('food_green', palette.green),
  steel: material('steel_brushed', palette.steel, { roughness: .38, metalness: .58 }),
  skin: material('skin_deep_brown', palette.skin, { roughness: .76 }),
  cloth: material('cloth_violet', palette.cloth, { roughness: .92 }),
  black: material('rubber_black', palette.black, { roughness: .9 }),
  glass: material('glass_window', 0x9cc6d4, { roughness: .2, metalness: .05, transparent: true, opacity: .35 }),
  flame: material('flame', 0xff9e38, { emissive: 0xff5a00, roughness: .35 })
};

function mesh(name, geometry, mat, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const value = new THREE.Mesh(geometry, mat);
  value.name = name;
  value.position.set(...position);
  value.rotation.set(...rotation);
  value.castShadow = true;
  value.receiveShadow = true;
  return value;
}

function box(name, size, mat, position, rotation) {
  return mesh(name, new THREE.BoxGeometry(...size), mat, position, rotation);
}

function cylinder(name, radii, height, mat, position, rotation = [0, 0, 0], segments = 20) {
  return mesh(name, new THREE.CylinderGeometry(radii[0], radii[1], height, segments), mat, position, rotation);
}

function anchor(parent, name, position, rotation = [0, 0, 0]) {
  const value = new THREE.Object3D();
  value.name = name;
  value.position.set(...position);
  value.rotation.set(...rotation);
  parent.add(value);
  return value;
}

function createKitchen() {
  const root = new THREE.Group();
  root.name = 'environment_kitchen_a';

  root.add(box('architecture_floor', [10, .18, 6], mats.wood, [0, -.09, 0]));
  root.add(box('architecture_wall_back', [10, 4.8, .18], mats.plaster, [0, 2.4, -3]));
  root.add(box('architecture_wall_left', [.18, 4.8, 6], mats.plaster, [-5, 2.4, 0]));

  for (let x = -4.35; x <= 3.65; x += .82) {
    root.add(box(`cabinet_lower_${Math.round((x + 5) * 10)}`, [.74, 1.05, .78], mats.indigo, [x, .53, -2.46]));
  }
  root.add(box('counter_back', [9.1, .16, 1.05], mats.cream, [-.25, 1.13, -2.39]));
  root.add(box('counter_island_base', [3.7, 1.02, 1.1], mats.indigo, [1.2, .51, .85]));
  root.add(box('counter_island_top', [4.05, .15, 1.38], mats.cream, [1.2, 1.1, .85]));

  const sink = box('fixture_sink_basin', [1.45, .12, .62], mats.steel, [-3.15, 1.18, -2.33]);
  root.add(sink);
  root.add(mesh('fixture_sink_faucet', new THREE.TorusGeometry(.28, .045, 10, 20, Math.PI), mats.steel, [-3.15, 1.55, -2.45], [0, 0, Math.PI / 2]));

  const cooker = new THREE.Group();
  cooker.name = 'fixture_cooker';
  cooker.position.set(.1, 0, -2.31);
  cooker.add(box('cooker_body', [1.75, 1.08, .9], mats.steel, [0, .54, 0]));
  cooker.add(box('cooker_oven_door', [1.38, .58, .05], mats.indigoDark, [0, .48, .48]));
  for (const [index, x] of [-.52, .52].entries()) {
    cooker.add(cylinder(`cooker_burner_${index}`, [.25, .25], .035, mats.black, [x, 1.1, -.14]));
  }
  root.add(cooker);

  root.add(box('shelf_open', [3.2, .12, .48], mats.wood, [2.55, 2.75, -2.72]));
  root.add(box('window_glass', [2.25, 1.45, .04], mats.glass, [-3.05, 2.85, -2.89]));
  root.add(box('window_frame_top', [2.5, .1, .1], mats.wood, [-3.05, 3.62, -2.82]));
  root.add(box('window_frame_bottom', [2.5, .1, .1], mats.wood, [-3.05, 2.08, -2.82]));
  root.add(box('window_frame_left', [.1, 1.65, .1], mats.wood, [-4.25, 2.85, -2.82]));
  root.add(box('window_frame_right', [.1, 1.65, .1], mats.wood, [-1.85, 2.85, -2.82]));

  anchor(root, 'hotspot_wash', [-3.15, 1.4, -1.65]);
  anchor(root, 'hotspot_ingredients', [1.18, 1.35, .82]);
  anchor(root, 'hotspot_cook', [.1, 1.4, -1.55]);
  anchor(root, 'hotspot_serve', [2.4, 1.3, .85]);
  anchor(root, 'worker_start', [-1.9, 0, .2], [0, Math.PI, 0]);

  return root;
}

function createPot() {
  const pot = new THREE.Group();
  pot.name = 'prop_pot_01';
  pot.add(cylinder('pot_body', [.42, .36], .48, mats.steel, [0, .25, 0]));
  pot.add(cylinder('pot_lid', [.44, .44], .06, mats.steel, [0, .52, 0]));
  pot.add(cylinder('pot_lid_handle', [.07, .09], .11, mats.black, [0, .6, 0]));
  pot.add(box('pot_handle_left', [.35, .08, .1], mats.black, [-.53, .36, 0]));
  pot.add(box('pot_handle_right', [.35, .08, .1], mats.black, [.53, .36, 0]));
  anchor(pot, 'anchor_grip_l', [-.53, .36, 0]);
  anchor(pot, 'anchor_place', [0, 0, 0]);
  return pot;
}

function createBowl(name, radius, mat = mats.cream) {
  const bowl = new THREE.Group();
  bowl.name = name;
  bowl.add(mesh(`${name}_shell`, new THREE.CylinderGeometry(radius * .72, radius, radius * .45, 24, 1, true), mat, [0, radius * .22, 0]));
  anchor(bowl, 'anchor_grip_l', [-radius, radius * .3, 0]);
  anchor(bowl, 'anchor_place', [0, 0, 0]);
  return bowl;
}

function createKitchenProps() {
  const root = new THREE.Group();
  root.name = 'props_kitchen_a';

  const pot = createPot();
  pot.position.set(.1, 1.14, -2.38);
  root.add(pot);

  const spoon = box('prop_spoon_01', [.08, .05, .62], mats.wood, [.42, 1.55, -2.25], [.25, 0, -.45]);
  anchor(spoon, 'anchor_grip_r', [0, 0, .25]);
  root.add(spoon);

  const bowl = createBowl('prop_bowl_01', .42);
  bowl.position.set(.5, 1.2, .75);
  root.add(bowl);

  const ingredients = new THREE.Group();
  ingredients.name = 'state_ingredients_grouped';
  ingredients.position.set(1.35, 1.18, .75);
  ingredients.add(mesh('ingredient_tomato_01', new THREE.SphereGeometry(.15, 12, 8), mats.terracotta, [-.28, .16, 0]));
  ingredients.add(mesh('ingredient_tomato_02', new THREE.SphereGeometry(.14, 12, 8), mats.terracotta, [0, .14, .12]));
  ingredients.add(mesh('ingredient_onion_01', new THREE.SphereGeometry(.13, 12, 8), mats.gold, [.28, .14, -.05]));
  ingredients.add(box('ingredient_bread_01', [.44, .22, .28], mats.cream, [.42, .13, .18]));
  root.add(ingredients);

  const flame = mesh('state_burner_lit', new THREE.RingGeometry(.12, .23, 18), mats.flame, [.1, 1.19, -2.39], [-Math.PI / 2, 0, 0]);
  root.add(flame);

  const food = cylinder('state_food_ready', [.3, .3], .035, mats.terracotta, [.1, 1.45, -2.38]);
  root.add(food);

  const tray = new THREE.Group();
  tray.name = 'state_meal_served';
  tray.position.set(2.38, 1.2, .82);
  tray.add(box('prop_tray_01', [1.05, .06, .62], mats.wood, [0, .03, 0]));
  tray.add(cylinder('prop_plate_01', [.24, .27], .045, mats.cream, [-.2, .1, 0]));
  tray.add(cylinder('prop_cup_01', [.1, .12], .25, mats.indigo, [.29, .17, .04]));
  anchor(tray, 'anchor_grip_l', [-.52, .08, 0]);
  anchor(tray, 'anchor_grip_r', [.52, .08, 0]);
  anchor(tray, 'anchor_place', [0, 0, 0]);
  root.add(tray);

  const cloth = box('prop_cloth_01', [.38, .025, .28], mats.teal, [-2.45, 1.22, -2.3]);
  anchor(cloth, 'anchor_grip_r', [.14, .03, 0]);
  anchor(cloth, 'anchor_place', [0, 0, 0]);
  root.add(cloth);

  return root;
}

function limb(name, length, radius, mat) {
  const pivot = new THREE.Group();
  pivot.name = name;
  const shape = cylinder(`${name}_mesh`, [radius, radius * .9], length, mat, [0, -length / 2, 0], [0, 0, 0], 12);
  pivot.add(shape);
  return pivot;
}

function quaternionValues(angles) {
  return angles.flatMap(([x, y, z]) => {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
    return [q.x, q.y, q.z, q.w];
  });
}

function clip(name, armRAngles, armLAngles) {
  const times = [0, .3, .65, .95, 1.25];
  return new THREE.AnimationClip(name, 1.25, [
    new THREE.QuaternionKeyframeTrack('arm_r.quaternion', times, quaternionValues(armRAngles)),
    new THREE.QuaternionKeyframeTrack('arm_l.quaternion', times, quaternionValues(armLAngles))
  ]);
}

function createWorker() {
  const root = new THREE.Group();
  root.name = 'worker_root';
  root.position.set(-1.9, 0, .2);

  root.add(box('worker_torso', [.72, 1.05, .38], mats.cloth, [0, 1.66, 0]));
  root.add(cylinder('worker_waist_apron', [.48, .38], .8, mats.terracotta, [0, .83, 0], [0, 0, 0], 18));
  root.add(mesh('worker_head', new THREE.SphereGeometry(.31, 18, 12), mats.skin, [0, 2.55, 0]));
  root.add(mesh('worker_hair', new THREE.SphereGeometry(.325, 16, 10, 0, Math.PI * 2, 0, Math.PI * .56), mats.black, [0, 2.62, -.03]));
  root.add(mesh('worker_hair_bun', new THREE.SphereGeometry(.16, 12, 8), mats.black, [0, 2.68, -.28]));

  const armR = limb('arm_r', .95, .105, mats.skin);
  armR.position.set(-.48, 2.04, 0);
  armR.rotation.z = -.1;
  root.add(armR);
  const armL = limb('arm_l', .95, .105, mats.skin);
  armL.position.set(.48, 2.04, 0);
  armL.rotation.z = .1;
  root.add(armL);

  const legR = limb('leg_r', 1.0, .13, mats.indigoDark);
  legR.position.set(-.22, .78, 0);
  root.add(legR);
  const legL = limb('leg_l', 1.0, .13, mats.indigoDark);
  legL.position.set(.22, .78, 0);
  root.add(legL);
  root.add(box('shoe_r', [.32, .12, .5], mats.black, [-.22, .07, .11]));
  root.add(box('shoe_l', [.32, .12, .5], mats.black, [.22, .07, .11]));
  anchor(root, 'anchor_grip_r', [-.48, 1.08, 0]);
  anchor(root, 'anchor_grip_l', [.48, 1.08, 0]);

  const neutralR = [-.1, 0, -.1];
  const neutralL = [-.1, 0, .1];
  const animations = [
    clip('idle', [neutralR, neutralR, neutralR, neutralR, neutralR], [neutralL, neutralL, neutralL, neutralL, neutralL]),
    clip('wash-hands', [neutralR, [-1.1, 0, -.45], [-1.2, .2, -.6], [-1.05, -.15, -.5], neutralR], [neutralL, [-1.1, 0, .45], [-1.2, -.2, .6], [-1.05, .15, .5], neutralL]),
    clip('pick-up', [neutralR, [-.65, 0, -.35], [-1.25, 0, -.2], [-.8, 0, -.25], neutralR], [neutralL, [-.55, 0, .3], [-1.15, 0, .2], [-.75, 0, .22], neutralL]),
    clip('stir', [neutralR, [-1.05, 0, -.35], [-1.05, .5, -.35], [-1.05, -.45, -.35], neutralR], [neutralL, [-.55, 0, .28], [-.55, 0, .28], [-.55, 0, .28], neutralL]),
    clip('serve', [neutralR, [-.8, 0, -.55], [-1.05, 0, -.7], [-.75, 0, -.5], neutralR], [neutralL, [-.8, 0, .55], [-1.05, 0, .7], [-.75, 0, .5], neutralL])
  ];

  return { root, animations };
}

async function exportGlb(object, outputPath, animations = []) {
  const exporter = new GLTFExporter();
  const arrayBuffer = await exporter.parseAsync(object, {
    binary: true,
    animations,
    onlyVisible: false,
    trs: true
  });
  const absolutePath = resolve(outputPath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(arrayBuffer));
  return Buffer.byteLength(Buffer.from(arrayBuffer));
}

const worker = createWorker();
const outputs = [
  ['public/assets/3d/environments/kitchen-a.glb', createKitchen(), []],
  ['public/assets/3d/props/kitchen-props-a.glb', createKitchenProps(), []],
  ['public/assets/3d/characters/worker-a.glb', worker.root, worker.animations]
];

const report = {};
for (const [path, object, animations] of outputs) {
  report[path] = await exportGlb(object, path, animations);
}

await mkdir('public/assets/3d', { recursive: true });
await writeFile('public/assets/3d/manifest.json', `${JSON.stringify({
  version: 1,
  units: 'metres',
  files: report
}, null, 2)}\n`);

console.log(`Generated ${outputs.length} GLB assets.`);
for (const [path, bytes] of Object.entries(report)) console.log(`${path}: ${(bytes / 1024).toFixed(1)} KB`);
