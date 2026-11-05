# Sprite brief 3/3: the requests

Do **one request per message**, in the order I ask, following file 1 (style and format) and file 2 (frames and poses). Each answer is one image.

## The forms

| # | Form name used in the requests | Notes |
|---|---|---|
| base | base form | made first; every other form is drawn from its sheets |
| 1 | Kaioken | a form of its own in this game; no aura, the game draws it |
| 2 | Super Saiyan | |
| 3 | Super Saiyan 2 | |
| 4 | Super Saiyan 3 | if the hair is much taller, it may use the top margin of the cell; the body keeps the size of the base form |
| 5 | Super Saiyan God | |
| 6 | Super Saiyan Blue | no pure cyan #00FFFF in the hair: use other blues |
| 7 | Ultra Instinct (Sign) | |
| 8 | Mastered Ultra Instinct | |

For every form, the look comes from the reference image attached to the request. **No aura, glow, lightning or steam**, even when the reference has them.

---

### R1: base form, Sheet A

Attached: the reference image of the base form.
Draw **Sheet A** (frames 0-7, file 2) of the base form. Follow file 1 exactly: 4 × 2 cells, flat magenta background, same baseline and scale in every cell. No markers.

### R2: base form, Sheet B

Attached: the Sheet A made in R1 (the base sheet), and the reference image.
Draw **Sheet B** (frames 8-15, file 2) of the base form. Same character, scale, palette, outline and baseline as the attached Sheet A. **Paint the cyan hand markers** of frames 10, 11, 12, 13 and 14 exactly as file 2 describes. Frame 9 contains only the speed lines.
Sheet B uses taller cells (96 × 128, a 3:2 image: file 1, section 4). The head and body must be **exactly as big as in the attached Sheet A**: the extra height is empty space above the head, for the raised arms of frames 14 and 15 and the marker above the head.

### R3: base form, emotes (optional)

Attached: the base Sheet A.
Draw the **emote sheet** (file 2, last section) of the base form, with the same face, colors and pixel style as the attached sheet.

### R4: a transformation, Sheet A

Attached: the **base form's Sheet A** and the reference image of the form.
Transformation pass: redraw the attached base Sheet A as **[FORM NAME]**. Every cell keeps the exact same pose, size, position, baseline and outline. Change only what the reference of [FORM NAME] shows is different: hair, eyes, face, colors, outfit details. No aura, glow, lightning or steam.

### R5: a transformation, Sheet B

Attached: the **base form's Sheet B** and the reference image of the form.
Transformation pass: redraw the attached base Sheet B as **[FORM NAME]**, with the same rules as R4. **Remove every cyan marker** (paint that spot as the background or the body would be). Keep frame 9 (speed lines) the same.

### R6: a transformation, emotes (optional)

Attached: the base emote sheet and the reference image of the form.
Redraw the 4 portraits as **[FORM NAME]**, with the same expressions, framing and size. Change only what the reference shows is different.

### R7: one frame per image (only if 8 sprites per image do not work)

Draw **only frame [N]** (file 2) of **[FORM NAME]**: one sprite on a square image, a 96 × 96 art-pixel cell centered in it, flat magenta background. Attach the base frame 0 as the reference for scale. Base form only: frames 10, 11, 12, 13 and 14 get their cyan marker.

---

## Fixing a cell

The walk cycle must alternate the legs: in frame 1 one leg is in front, in frame 3 **the other leg** is in front (draw the far leg a shade darker so the two legs read apart). Frames 2 and 4 are passing poses with the legs close together, not strides.

When one cell is wrong, I will write for example:
`Fix only cell 6 (frame 13): the arm must be fully extended. Keep every other cell identical.`
Change that cell only. Every other cell stays exactly as it was.
