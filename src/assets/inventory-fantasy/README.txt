PIXEL FANTASY UI PACK
======================
A 16-bit pixel-art fantasy RPG user-interface asset pack.
Style: dark wood browns, gold trim, parchment tones.
All images are PNG with transparent backgrounds.

CONTENTS
--------
buttons/
  button-normal.png    Wide fantasy menu button, normal state
  button-hover.png     Wide fantasy menu button, hover state (glowing gold trim)
  button-pressed.png   Wide fantasy menu button, pressed state (dark inset)

panels/
  panel-frame.png      Large ornate window/panel frame with plain parchment
                       center. Uniform border thickness — 9-slice friendly.

icons/
  icons-sheet.png      8 icons on one 4x2 grid sprite sheet (2240x1120).
                       Grid layout (each cell 560x560 px):
                         Row 1: heart | mana crystal | gold coin | sword
                         Row 2: shield | potion bottle | brass key | star
                       To slice in code (e.g. Godot), each icon is at:
                         cell (col,row) -> Rect2(col*560, row*560, 560, 560)

bars/
  bar-health.png       Horizontal health bar, red fill, heart emblem, wooden socket
  bar-mana.png         Horizontal mana bar, blue fill, crystal emblem, wooden socket
                       (fills are full; mask or redraw the fill to show values)

misc/
  dialog-box.png       Wide dialog/text box, parchment interior, gold trim
  coin-plaque.png      Coin-counter plaque: gold coin emblem + empty parchment
                       space for numbers

TIPS
----
- Buttons: swap the three states on mouse enter/exit/press for instant UI feedback.
- panel-frame.png works with 9-slice scaling in Godot (TextureRect), Unity, etc.
- The bars' fill areas are solid color — overlay your own fill or use a shader
  to animate values.

LICENSE
-------
Free to use in commercial and non-commercial projects, including games you sell.
Credit required: "UI art: Zanyar's Asset Store" (or link the itch.io page).
Do NOT redistribute or resell the pack itself (standalone or barely modified).
