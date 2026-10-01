# Breakfast Vertical Slice

This is the first production asset package. It validates character scale,
camera, lighting, object contact, state restoration and mobile performance
before the market and infant-care kits are modelled.

## Player-readable sequence

| Step | Actor animation | Interactive props | Confirmed world state |
| --- | --- | --- | --- |
| Wash and clear | `walk`, `wash-hands`, `wipe` | Sink, tap, cloth, counter | Hands clean; counter clear |
| Gather ingredients | `reach-low`, `pick-up`, `place` | Bowl, eggs, bread, tomatoes, containers | Ingredients grouped at preparation point |
| Cook | `pour`, `stir`, `observe` | Pot, frying pan, gas cooker, spoon | Burner lit; food moves from raw to ready |
| Plate and serve | `pick-up`, `serve`, `carry`, `place` | Plates, cups, tray, serving table | Meal served; used cookware remains |

## Required models

### Environment

- Two-wall kitchen shell with window and tiled backsplash.
- Sink/counter module and preparation counter.
- Four-burner gas cooker with one animated control knob and emissive flame.
- Lower cabinet, open shelf and serving surface.
- Gas cylinder, dish rack and compact background dressing.

### Hero props

- Lidded pot with separate lid.
- Frying pan, wooden spoon and serving spoon.
- Large preparation bowl and two small enamel bowls.
- Four plates, two cups, one tray and one kettle.
- Ingredient group: bread, eggs, tomatoes, onion and two dry-food containers.
- Cleaning cloth and tap with an animated handle.

### Character

- Worker A with apron/wrapper, low-bun hairstyle and flat sandals.
- Kitchen animation set containing the clips in the sequence table.

## Interaction anchors

| Object | Required anchors |
| --- | --- |
| Sink | `anchor_use`, `anchor_look` |
| Cloth | `anchor_grip_r`, `anchor_place` |
| Bowl | `anchor_grip_l`, `anchor_place` |
| Pot | `anchor_grip_l`, `anchor_place` |
| Spoon | `anchor_grip_r`, `anchor_place` |
| Cooker | `anchor_use`, `anchor_look` |
| Plate | `anchor_grip_l`, `anchor_place` |
| Tray | `anchor_grip_l`, `anchor_grip_r`, `anchor_place` |

## Camera plan

The base camera shows the sink on the left, cooker near the centre and serving
surface in the foreground. Steps use short reframes rather than separate rooms:

1. Sink and preparation counter.
2. Preparation counter, slightly closer.
3. Cooker and pot.
4. Serving surface and tray.

The worker must never be hidden behind the counter above waist level. Reduced
motion mode switches camera positions without interpolation.

## State restoration test

After each step, leave the activity and reopen it. The scene must restore:

1. Cleared counter after step one.
2. Grouped ingredients after step two.
3. Ready food and used utensils after step three.
4. Served tray after step four.

The game clock and stamina may advance only once for each confirmed step.

## Definition of done

- The full sequence is understandable without written instructions.
- There are no visible hand penetrations at the fixed camera.
- The GLB packages total no more than 6 MB compressed for the first pass and
  have a route to the 3 MB mobile target.
- The scene reaches 30 FPS on the selected low-end Android test device.
- Keyboard and touch players can trigger the same steps.
- If any GLB fails, the primitive fallback continues the activity.

