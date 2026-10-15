# assets

Put the main-menu song here as **`menu.mp3`** (ideally re-encoded to ~96 kbps mono/stereo to keep the build small).
`build.py` embeds it as base64 in the final HTML. If the file is missing the game simply uses the procedural
(synthesised) menu music instead, so the build never breaks.

The song is not included in the repository because its licence has to be verified by whoever publishes the game.
