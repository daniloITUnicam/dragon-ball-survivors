# Sprite brief 2/3: the 16 frames

The game uses 16 frames per form, numbered 0-15. They are split into two images of 8 cells (layout in file 1, section 4):

- **Sheet A** = frames 0-7
- **Sheet B** = frames 8-15

The character always faces right. Left and right below are the character's own left and right.

## Sheet A: frames 0-7

| Cell | Frame | Pose |
|---|---|---|
| 1 | **0 - idle** | Standing relaxed but ready: feet a little apart on the baseline, knees slightly bent, fists loosely closed at hip height, calm confident face looking right. This is the reference pose: its size decides the scale of everything else. |
| 2 | **1 - walk, contact** | Walking right: front foot forward, heel touching the baseline, back foot behind on its toes. Arms swing opposite to the legs (back arm forward). |
| 3 | **2 - walk, passing** | Legs pass under the body: the back leg swings forward with its knee slightly raised, the other leg straight under the hips. The whole body is 1 art pixel higher than in frame 1. Arms close to the body. |
| 4 | **3 - walk, contact (other leg)** | Same as frame 1 with the legs swapped: the other foot is in front. Arms swing the other way. |
| 5 | **4 - walk, passing (other leg)** | Same as frame 2 with the other leg swinging forward, body 1 art pixel higher. |
| 6 | **5 - attack wind-up** | Right fist pulled back at the hip, left arm forward guarding, torso twisted back, knees bent, eyes on the target. |
| 7 | **6 - attack thrust** | Right arm fully extended in a punch at shoulder height, left fist pulled to the chest, front leg lunging forward. Same baseline. |
| 8 | **7 - power-up pose** | Transforming: legs wide apart and bent, arms flexed down at the sides with clenched fists, chest out, head slightly up, mouth open in a shout. **No aura and no burst**: the game draws them. |

The walk cycle plays 1 → 2 → 3 → 4 → 1 at 12 frames per second: the four frames must loop smoothly. The head and torso keep their size and their position, apart from the 1-pixel bob.

## Sheet B: frames 8-15

| Cell | Frame | Pose | Marker (only when the request asks for markers) |
|---|---|---|---|
| 1 | **8 - dash** | Flying fast to the right: body almost horizontal and tilted a little forward, arms swept back along the body, legs stretched behind. It must fit inside the cell; it does not stand on the baseline. | none |
| 2 | **9 - speed lines** | **No character.** Only 6-10 straight horizontal speed streaks of different lengths, white and pale blue, with hard pixel edges, filling the middle of the cell. The game draws them behind the dashing character. | none |
| 3 | **10 - Kamehameha charge** | Both arms bent at the side of the body, low at hip height and pulled back, hands cupped together with the palms facing each other and a **clear empty gap between them**, as if holding an invisible sphere. Knees bent, torso leaning slightly forward, determined face. | in the middle of the empty gap between the hands |
| 4 | **11 - two-hand blast** | Both arms fully extended straight forward to the right, wrists together, open palms facing forward. Wide stable stance with the legs apart, torso leaning forward, fierce shouting face. | at the center of the palms |
| 5 | **12 - ki blast charge** | Right hand raised in front of the shoulder, open palm facing forward, as if holding a small invisible ball on the palm. Left arm relaxed, down and slightly back. Calm focused face. | slightly in front of the center of the right palm |
| 6 | **13 - ki blast throw** | Right arm fully extended straight forward, open palm facing forward, just after throwing. Left arm pulled back, torso leaning forward. | at the center of the extended right palm |
| 7 | **14 - arms raised** | Both arms raised straight up above the head, open hands pointing up, looking up at the sky, legs together. | above the head, about one head-height above the top of the hair, between the hands |
| 8 | **15 - arm to the sky** | Right arm raised straight up with the index finger pointing at the sky, left hand on the hip, looking up. | none |

**Never draw the energy itself.** The space between or on the hands stays empty: no ball, beam, glow or sparks. The game draws them at the markers.

## Emote sheet (optional): 4 portraits

Shown in the character select screen. Make one square image (1:1) with the **4 portraits in a 2 × 2 grid** on the same flat magenta background. Each portrait shows the head and shoulders, facing the viewer with a slight turn to the right, in the same pixel style and palette as the sheets. No text.

| Cell | Expression |
|---|---|
| 1 | calm, confident half smile |
| 2 | big happy grin with the eyes closed |
| 3 | fierce battle face, shouting |
| 4 | surprised, eyes wide open |
