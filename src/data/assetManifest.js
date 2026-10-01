export const ASSET_PACKS = {
  kitchen: {
    id: 'kitchen',
    environmentModel: '/assets/3d/environments/kitchen-a.glb',
    propModel: '/assets/3d/props/kitchen-props-a.glb',
    camera: { position: [0, 4.8, 8.2], target: [0, 1.1, 0], fov: 40 },
    status: 'specified'
  },
  market: {
    id: 'market',
    environmentModel: '/assets/3d/environments/market-a.glb',
    propModel: '/assets/3d/props/market-props-a.glb',
    camera: { position: [0, 4.6, 9], target: [0, 1, 0], fov: 42 },
    status: 'specified'
  },
  'care-room': {
    id: 'care-room',
    environmentModel: '/assets/3d/environments/care-room-a.glb',
    propModel: '/assets/3d/props/care-props-a.glb',
    camera: { position: [0, 4.7, 8.4], target: [0, 1, 0], fov: 40 },
    status: 'specified'
  },
  room: {
    id: 'room',
    environmentModel: '/assets/3d/environments/family-room-a.glb',
    propModel: '/assets/3d/props/household-props-a.glb',
    camera: { position: [0, 4.9, 8.8], target: [0, 1, 0], fov: 41 },
    status: 'planned'
  },
  utility: {
    id: 'utility',
    environmentModel: '/assets/3d/environments/utility-a.glb',
    propModel: '/assets/3d/props/utility-props-a.glb',
    camera: { position: [0, 4.7, 8.2], target: [0, 1, 0], fov: 40 },
    status: 'planned'
  },
  street: {
    id: 'street',
    environmentModel: '/assets/3d/environments/street-school-a.glb',
    propModel: '/assets/3d/props/travel-props-a.glb',
    camera: { position: [0, 4.4, 9.6], target: [0, 1, 0], fov: 43 },
    status: 'planned'
  },
  'family-room': {
    id: 'family-room',
    environmentModel: '/assets/3d/environments/family-room-a.glb',
    propModel: '/assets/3d/props/family-props-a.glb',
    camera: { position: [0, 4.8, 8.8], target: [0, 1, 0], fov: 41 },
    status: 'planned'
  },
  'sitting-room': {
    id: 'sitting-room',
    environmentModel: '/assets/3d/environments/sitting-room-a.glb',
    propModel: '/assets/3d/props/hospitality-props-a.glb',
    camera: { position: [0, 4.8, 8.8], target: [0, 1, 0], fov: 41 },
    status: 'planned'
  },
  bedroom: {
    id: 'bedroom',
    environmentModel: '/assets/3d/environments/bedroom-a.glb',
    propModel: '/assets/3d/props/recovery-props-a.glb',
    camera: { position: [0, 4.6, 8.2], target: [0, 1, 0], fov: 40 },
    status: 'planned'
  }
};

export const CHARACTER_ASSETS = {
  worker: {
    model: '/assets/3d/characters/worker-a.glb',
    animations: '/assets/3d/animations/shared-actions-a.glb',
    status: 'specified'
  },
  child: {
    model: '/assets/3d/characters/child-a.glb',
    status: 'planned'
  },
  baby: {
    model: '/assets/3d/characters/baby-a.glb',
    status: 'specified'
  }
};

export const SHARED_ACTION_CLIPS = [
  'idle', 'walk', 'turn', 'reach-high', 'reach-low', 'pick-up', 'place',
  'carry', 'bend', 'wipe', 'scrub', 'wash-hands', 'stir', 'pour', 'serve',
  'open', 'close', 'hand-over', 'soothe', 'observe', 'sit', 'stand'
];

export const BREAKFAST_ASSET_PLAN = {
  environmentId: 'kitchen',
  characterId: 'worker',
  stepBindings: {
    wash: {
      zone: 'sink',
      clips: ['walk', 'wash-hands', 'wipe'],
      requiredAnchors: ['sink.anchor_use', 'cloth.anchor_grip_r', 'cloth.anchor_place'],
      state: { counter: 'clear', hands: 'clean' }
    },
    ingredients: {
      zone: 'prep-counter',
      clips: ['reach-low', 'pick-up', 'place'],
      requiredAnchors: ['bowl.anchor_grip_l', 'bowl.anchor_place'],
      state: { ingredients: 'grouped', bowl: 'placed' }
    },
    cook: {
      zone: 'cooker',
      clips: ['pour', 'stir', 'observe'],
      requiredAnchors: ['cooker.anchor_use', 'pot.anchor_place', 'spoon.anchor_grip_r'],
      state: { burner: 'lit', food: 'ready', cookware: 'used' }
    },
    serve: {
      zone: 'serving-table',
      clips: ['pick-up', 'serve', 'carry', 'place'],
      requiredAnchors: ['plate.anchor_grip_l', 'tray.anchor_grip_r', 'tray.anchor_place'],
      state: { meal: 'served', tray: 'placed' }
    }
  }
};

export function getAssetPack(environmentId) {
  return ASSET_PACKS[environmentId] || ASSET_PACKS.room;
}

export function getAssetPlan(activityDefinition) {
  if (!activityDefinition) return null;
  return {
    pack: getAssetPack(activityDefinition.environment),
    character: CHARACTER_ASSETS.worker,
    stepBindings: activityDefinition.taskId === 'breakfast'
      ? BREAKFAST_ASSET_PLAN.stepBindings
      : null
  };
}
