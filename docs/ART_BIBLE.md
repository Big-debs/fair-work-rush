# Fair Work Rush — 3D Art Bible

## Target

Fair Work Rush uses **grounded stylised realism**: recognisable Nigerian
household spaces, believable human proportions and correct work sequences,
expressed with production-efficient geometry and warm editorial lighting.

The goal is not cinematic photorealism. The game should feel truthful because
objects have the right scale, hands meet useful contact points, rooms retain the
effects of work, and every action has a clear before and after state.

![Nigerian household asset direction](./art/nigerian-household-asset-direction-v1.png)

## Visual principles

1. **Dignity before spectacle.** Workers are contemporary people, not visual
   shorthand for poverty or service.
2. **Specific, not stereotyped.** Use familiar Nigerian materials, utensils,
   market structures and household arrangements without exaggeration.
3. **Work leaves evidence.** Ingredients move, clothes become wet, beds become
   made, bags fill up and used dishes remain until cleared.
4. **Readable silhouettes.** At the fixed gameplay camera, the player must
   recognise a pot, bowl, shopping basket or care bag without labels.
5. **Warmth with pressure.** The base world is warm and humane. Lighting and
   colour may cool subtly as wellbeing falls, but the home never becomes a
   horror environment.
6. **Mobile-first craft.** Texture quality is concentrated on hands, faces and
   the current task. Background detail is suggested rather than simulated.

## World palette

| Role | Colour | Use |
| --- | --- | --- |
| Deep indigo | `#253D59` | Cabinets, interface continuity, shadow accents |
| Terracotta | `#D97745` | Warm focal props, cookware and interaction cues |
| Muted teal | `#287D78` | Water, cleaning and care details |
| Natural wood | `#9B6B43` | Furniture, stalls and shelves |
| Warm plaster | `#E8D8BD` | Walls and neutral room surfaces |
| Golden yellow | `#F2C078` | Small highlights and food warmth |
| Leaf green | `#3F8F72` | Produce, recovery and completion cues |
| Pressure red | `#A34E2E` | Restricted to interruptions and warning states |

Avoid using every colour in every room. Each environment should use two main
materials, one supporting colour and one small interactive accent.

## Character direction

### Main worker

- Nigerian woman, grounded adult proportions: approximately 7.25 heads tall.
- Practical T-shirt or blouse, cropped trousers or wrapper-apron, flat sandals.
- Hair variants: cornrows into a low bun, short natural hair and wrapped hair.
- Calm neutral expression at rest; emotion is primarily communicated through
  posture, pace, breathing and gaze rather than caricature.
- One shared humanoid rig across clothing and hairstyle variants.
- Hands need clean topology because most activities are hand-led.

### Supporting cast

- Adult employer variants should share a body system but not the worker's
  exact silhouette or clothing palette.
- School-age children use two scalable base bodies with uniform variants.
- The baby is used only in supported care poses; no free locomotion is needed
  for the first production pass.
- Market vendors and background figures use lower-detail versions of the same
  material and rig language.

### Character budgets

| Asset | Triangles | Textures | Rig |
| --- | ---: | --- | --- |
| Foreground adult | 18k–25k | 1 × 1K colour/ORM + 1 × 1K normal | 55–70 bones |
| Child | 12k–18k | Shared 1K atlas | Same naming convention |
| Baby | 8k–12k | 1 × 1K atlas | Care-pose rig |
| Background person | 4k–8k | Shared 512–1K atlas | Reduced rig |

## Environment kits

All rooms are modular, built on a 10 cm grid and authored in metres. The
origin is the centre of the playable floor. Positive Z faces away from the
fixed camera.

### Kitchen

Required modules: tiled wall, window, counter, sink, lower cabinet, open shelf,
gas cooker, cylinder, preparation table and serving surface. Dressing props
include pots, enamel bowls, kettle, food containers, dish rack, tray and cloth.

### Market

Required modules: wooden stall, crate, tarpaulin pole and canopy, produce tray,
grain sack, woven basket and walkway. Repeated goods use instancing. Avoid
constructing a complete market when two foreground stalls and a softened
background strip will communicate the location.

### Care room

Required modules: cot, changing chest, changing mat, small shelf, wash basin,
care-supply basket, lidded bin, chair and curtain. Care is represented cleanly
and non-explicitly.

### Remaining kits

The family room, utility area, street/school entrance and bedroom reuse the
same wall, floor, door, window, shelf and fabric systems. Only task-defining
hero props receive unique geometry.

## Materials and textures

- Use a restrained PBR workflow: base colour, combined ORM map and optional
  normal map.
- Prefer trim sheets and atlases over one texture set per object.
- Bake ambient occlusion into the asset or lightmap; avoid unique realtime
  shadow casters for small props.
- Surfaces may show gentle use—softened wood edges, minor tile variation and
  folded cloth—but never grime as a substitute for cultural specificity.
- Textiles use geometry only where the silhouette changes. Printed patterns
  belong in the colour atlas.

## Lighting and camera

- Fixed three-quarter camera, 35–45° vertical angle and roughly 40° field of
  view. Do not use a wide lens that distorts room scale.
- One warm key light and a hemisphere fill in Three.js.
- Bake secondary shadows and interior occlusion into lightmaps.
- Use a contact shadow or small blob shadow beneath the active character and
  carried props.
- Camera movement is limited to short authored reframes between work zones.
  Reduced-motion mode cuts directly instead.

## Animation language

### Shared clips

`idle`, `walk`, `turn`, `reach-high`, `reach-low`, `pick-up`, `place`, `carry`,
`bend`, `wipe`, `scrub`, `wash-hands`, `stir`, `pour`, `serve`, `open`, `close`,
`hand-over`, `soothe`, `observe`, `sit` and `stand`.

Clips should start and finish in a compatible neutral pose. Root motion is
used only for travel clips; work clips play at fixed interaction anchors.

### Contact rules

Every interactive prop exposes at least one named anchor:

- `grip_r` and/or `grip_l` for carried objects.
- `use` for the actor's standing position and facing direction.
- `place` for the prop's finished position.
- `look` for optional gaze targeting.

The activity director moves the character to `use`, blends the selected clip,
parents the prop to the hand at the clip's attach marker, and releases it at the
detach marker. This gives reliable contact without runtime full-body IK.

## Stateful world rules

An asset state changes only after the Phaser timeline confirms the step. The
Three.js scene may preview motion, but the authoritative result comes from the
activity acknowledgement event.

Examples:

- `pot.empty → pot.cooking → pot.ready → pot.dirty`
- `market-bag.empty → market-bag.partial → market-bag.full`
- `bed.unmade → bed.stripped → bed.made`
- `care-station.stored → care-station.prepared → care-station.used → care-station.reset`

When a player leaves an activity unfinished, the last acknowledged visual state
must be restored when they return.

## Runtime budgets

| Metric | Mobile target | Desktop ceiling |
| --- | ---: | ---: |
| Visible triangles | 60k–100k | 180k |
| Draw calls | ≤ 80 | ≤ 130 |
| Active skinned characters | 2 | 4 |
| Realtime shadow casters | 1–2 | 3 |
| Environment texture memory | 12–20 MB | 40 MB |
| Initial activity download | ≤ 3 MB compressed | ≤ 6 MB compressed |
| Sustained frame rate | 30 FPS | 60 FPS |

GLB geometry should use Meshopt compression. Production textures should use
KTX2/Basis. Repeated market goods, plates and containers should be instanced.
The primitive activity renderer remains the fallback if a model or WebGL scene
cannot load.

## File conventions

```text
public/assets/3d/
  characters/worker-a.glb
  environments/kitchen-a.glb
  environments/market-a.glb
  environments/care-room-a.glb
  props/kitchen-props-a.glb
  props/market-props-a.glb
  props/care-props-a.glb
  animations/shared-actions-a.glb
```

Mesh names use `category_object_variant`, for example `prop_pot_01`. Anchors use
the exact names `anchor_use`, `anchor_grip_r`, `anchor_grip_l`, `anchor_place`
and `anchor_look`. Materials use `mat_surface_variant`.

## Acceptance checklist

- The activity reads correctly with interface text hidden.
- Character hands meet the intended object at normal playback speed.
- Every step produces an observable world-state change.
- No activity depends on a camera angle that exposes unfinished geometry.
- The scene stays within its mobile triangle, draw-call and download budgets.
- Calm-motion mode removes bobbing, sweeping camera moves and unnecessary FX.
- The asset can fail independently without breaking the Phaser timeline.

