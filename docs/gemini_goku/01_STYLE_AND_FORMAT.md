# Sprite brief 1/3: style and image format

You are drawing character sprites for **Dragon Ball: Survivors**, a 2D action game in the "survivors" genre: the player walks around a large map and fights waves of enemies. The character is seen **from the side** and is small on screen (about 60 screen pixels tall).
Every image you make will be cut into single sprites by a script. The format rules below matter as much as the drawing: please follow them exactly.

## 1. Subject

The character is **Goku**, in the form named by each request.
His look in that form (hair, eyes, face, outfit, colors) comes **only from the reference image attached** to the request. If my text and the reference disagree, the reference wins. Do not invent details that are not in the reference.

## 2. Art style

- **True pixel art.** The sprite is drawn on a small grid of art pixels and then enlarged: every art pixel is a solid square, all of the same size. No anti-aliasing, blur, gradients, soft brushes, painterly texture or noise.
- **Resolution.** Each sprite cell is **96 × 96 art pixels**. The standing character is about **80 art pixels** tall from the soles to the top of the head. Hair that sticks up may go higher, into the top margin of the cell.
- **Proportions.** Chibi / super-deformed, like the other characters of the game: the head is about one third of the standing height, big readable eyes, short sturdy limbs.
- **Outline.** 1 art pixel wide, dark: a darker shade of the color it borders, near-black on the outer silhouette and the hair. Inner lines only where needed.
- **Shading.** Cel shading, 2 to 3 tones per material (base, shadow, a small highlight), light from the top-left.
- **Palette.** At most about 24 colors in the whole image, with exactly the same colors in every cell.
- **Readability.** A clear silhouette that still reads at 60 pixels tall. Avoid tiny details that turn into noise.

## 3. Never in the image

- No aura, glow, energy ball, beam, flame, lightning, spark, speed line, smoke, dust, ground shadow, ground or scenery. The game draws all of these effects itself. The only exception is frame 9 (see file 2).
- No text, numbers, labels, grid lines, cell borders, frames, watermark or signature.
- No magenta, pink or pure cyan (#00FFFF) in the character's own colors: those colors are reserved for the background and the markers.

## 4. Image format (every request, unless it says otherwise)

- **Background:** one flat solid color, pure magenta **#FF00FF**, everywhere. No gradient, texture or vignette.
- **Layout:** 8 sprites in **4 columns × 2 rows**, read left to right, then top to bottom: cells 1-4 on the top row, cells 5-8 on the bottom row.
- **Placement:** each sprite is centered horizontally in its cell. In every standing pose the soles touch the same invisible **baseline, 4 art pixels above the bottom of the cell**. The same scale in every cell and in every image.
- **Spacing:** at least 8 art pixels of magenta between sprites and along the edges of the image. Sprites never touch or overlap each other.
- **Ratio:** a 2:1 landscape image. If 2:1 is not available, use 16:9 and keep the 4 × 2 layout centered.
- **Sheet B is taller:** its cells are **96 wide × 128 tall** art pixels (a **3:2** image), because the raised arms of frames 14 and 15 need room above the head. The character keeps **exactly the body size of Sheet A**: only the empty space above the head grows. Never draw a character smaller to make it fit.
- **Direction:** every sprite faces **right** (side view; a slight 3/4 turn toward the viewer is fine).

## 5. Hand markers

When a request asks for markers, paint a **3 × 3 art-pixel square of pure cyan #00FFFF** exactly where file 2 says. It shows the game where the energy ball appears or where a shot leaves the hand. Nothing else in the image may be pure cyan. Without a request for markers, paint none.

## 6. Consistency

- An image attached as a **base sheet** is the master copy. Keep each cell's pose, size, position in the cell, baseline, outline thickness and palette structure, and change only what the request asks.
- When asked to fix one cell, change that cell only. Every other cell stays exactly as it was.
- If a request is impossible as written (for example 8 sprites will not fit), say so in one line and propose the closest option. Do not silently change the format.
