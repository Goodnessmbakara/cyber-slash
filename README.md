# Cyber Slash

A fast-paced 2D cyberpunk arcade runner built for **[start.ng](https://start.ng)**.

Slice rogue drones, jump over plasma spires, chain combos, and bring your unique start.ng character into the neon grid!

Live at: **`https://cyber-slash.start.ng`**

---

## Features

- **start.ng Character Integration:** Automatically adapts player aesthetics (outfit colors, hair style, skin tone, accessories) directly onto your runner character and top-left profile badge.
- **Dynamic Katana Combat:** High-speed plasma katana slashing with aerial stalls and hit-pause impacts.
- **Multi-tiered Scoring & Combos:** Chain drone slashes and energy orb pickups up to a 10x score multiplier.
- **Procedural Retro Synthwave Engine:** Built with zero external dependencies using the Web Audio API (procedural retro synth bass arpeggio, jump wooshes, slash swings, drone explosions, and collectible chimes).
- **Global Leaderboard:** Track and rank high scores, drones slashed, and metres run across all start.ng players.
- **Responsive Controls:** Full support for desktop keyboard controls and mobile touch gestures.

---

## Controls

### Desktop Keyboard
- **Jump / Double Jump:** `Space`, `W`, or `Up Arrow`
- **Katana Slash:** `J`, `Z`, `X`, or `F`

### Mobile & Touch
- **Jump:** Tap the left half of the screen
- **Slash:** Tap the right half of the screen

---

## Tech Stack

- Pure HTML5 Canvas, modern ES Modules, and CSS3
- Web Audio API (real-time procedural audio synthesis)
- `start.ng` Connect `postMessage` protocol & public Leaderboard API
- Zero build tools or runtime dependencies required

---

## Local Development

Start any local static HTTP server:

```bash
# Python
python3 -m http.server 8080

# Or npx serve
npx serve .
```

Open `http://localhost:8080` in your browser.
