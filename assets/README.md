# assets

Put the main-menu song here as **`menu.mp3`** (ideally re-encoded to ~96 kbps mono/stereo to keep the build small).
`build.py` embeds it as base64 in the final HTML. If the file is missing the game simply uses the procedural
(synthesised) menu music instead, so the build never breaks.

The song is not included in the repository because its licence has to be verified by whoever publishes the game.


## namek.mp3 (optional)

Optional track for **Planet Namek** (stage 2), embedded by `build.py` and looped for the whole stage. Not in the repository for the same licensing reason; without it the stage uses the synthesised music.

## logo.webp

Game logo shown in the main menu (embedded as base64). `docs/logo.png` is the same image for the README.
