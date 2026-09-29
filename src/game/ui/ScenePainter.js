import Phaser from 'phaser';

const PROFILE_COLORS = {
  ada: { clothing: 0xb95739, accent: 0xf2c078, skin: 0x7a422d, hair: 0x241b1a },
  mariam: { clothing: 0x287d78, accent: 0xf0b45d, skin: 0x5f3427, hair: 0x211918 },
  chika: { clothing: 0x76538f, accent: 0xe3a34d, skin: 0x8a5136, hair: 0x211817 }
};

export function paintHousehold(scene, { profileId, top, bottom, reducedMotion }) {
  const { width } = scene.scale;
  const compact = width < 600;
  const centerX = width / 2;
  const height = bottom - top;
  const room = scene.add.container(0, 0);
  const colors = PROFILE_COLORS[profileId] || PROFILE_COLORS.ada;

  const wall = scene.add.rectangle(centerX, top + height * .38, width, height * .76, 0xf1ddc4);
  const floor = scene.add.rectangle(centerX, bottom - height * .12, width, height * .24, 0xc99b72);
  const floorLine = scene.add.rectangle(centerX, bottom - height * .24, width, 3, 0xa56f4b);
  room.add([wall, floor, floorLine]);

  const windowX = compact ? 65 : 135;
  const windowY = top + height * .3;
  const windowWidth = compact ? 86 : 135;
  const windowHeight = compact ? 92 : 116;
  const windowFrame = scene.add.rectangle(windowX, windowY, windowWidth, windowHeight, 0x9ec9d4)
    .setStrokeStyle(7, 0xfff5df);
  const windowCrossH = scene.add.rectangle(windowX, windowY, windowWidth - 8, 3, 0xfff5df);
  const windowCrossV = scene.add.rectangle(windowX, windowY, 3, windowHeight - 8, 0xfff5df);
  const curtain = scene.add.rectangle(windowX - windowWidth * .56, windowY, 18, windowHeight + 18, 0xd97745, .86);
  room.add([windowFrame, windowCrossH, windowCrossV, curtain]);

  const cabinetX = compact ? width - 46 : width - 110;
  const cabinetY = bottom - height * .24;
  const cabinet = scene.add.rectangle(cabinetX, cabinetY, compact ? 68 : 122, compact ? 56 : 70, 0x6f4937)
    .setStrokeStyle(2, 0x543528);
  const lampStem = scene.add.rectangle(cabinetX, cabinetY - 54, 4, 48, 0x4c5360);
  const lampShade = scene.add.triangle(cabinetX, cabinetY - 83, -24, 20, 24, 20, 15, -18, 0xf2c078);
  room.add([cabinet, lampStem, lampShade]);

  const rug = scene.add.ellipse(centerX, bottom - 18, compact ? 220 : 360, compact ? 35 : 48, 0xc65f43, .55);
  room.add(rug);

  const worker = scene.add.container(centerX, top + height * .52);
  const shadow = scene.add.ellipse(0, compact ? 87 : 102, compact ? 82 : 100, 18, 0x493a32, .24);
  const legs = scene.add.graphics().fillStyle(0x3d3d48, 1);
  legs.fillRoundedRect(-28, compact ? 46 : 52, 22, compact ? 48 : 58, 8);
  legs.fillRoundedRect(7, compact ? 46 : 52, 22, compact ? 48 : 58, 8);
  const body = scene.add.graphics().fillStyle(colors.clothing, 1);
  body.fillRoundedRect(compact ? -43 : -50, compact ? -17 : -20, compact ? 86 : 100, compact ? 72 : 84, 22);
  body.fillStyle(colors.accent, 1).fillRect(compact ? -43 : -50, compact ? 28 : 32, compact ? 86 : 100, 9);
  const neck = scene.add.rectangle(0, compact ? -29 : -34, 22, 18, colors.skin);
  const face = scene.add.circle(0, compact ? -56 : -66, compact ? 31 : 36, colors.skin);
  const hair = scene.add.arc(0, compact ? -67 : -78, compact ? 31 : 36, 180, 360, false, colors.hair);
  const bun = scene.add.circle(compact ? 20 : 23, compact ? -83 : -96, compact ? 13 : 15, colors.hair);
  const eyes = scene.add.graphics().fillStyle(0x241b1a, 1);
  eyes.fillCircle(-10, compact ? -58 : -68, 2.4).fillCircle(10, compact ? -58 : -68, 2.4);
  const smile = scene.add.arc(0, compact ? -49 : -57, 9, 20, 160, false)
    .setStrokeStyle(2, 0x3f241d);
  worker.add([shadow, legs, body, neck, face, hair, bun, eyes, smile]);
  room.add(worker);

  const coolOverlay = scene.add.rectangle(centerX, top + height / 2, width, height, 0x284766, 0)
    .setDepth(4);
  worker.setDepth(5);

  let idleTween = null;
  if (!reducedMotion) {
    idleTween = scene.tweens.add({
      targets: worker,
      scaleY: 1.018,
      y: worker.y - 2,
      duration: 1450,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1
    });
  }

  return { room, worker, coolOverlay, idleTween };
}

export function updateHouseholdMood(art, wellbeing, pressure) {
  if (!art?.coolOverlay) return;
  const fatigue = Phaser.Math.Clamp((70 - wellbeing) / 95, 0, .34);
  const demand = Phaser.Math.Clamp((pressure - 35) / 260, 0, .22);
  art.coolOverlay.setAlpha(fatigue + demand);
}
