# gheat.net

Immersive landing page: a dark 3D room with a CRT playing a sinister 80s
corporate VHS tape, which zooms into a Windows-95-style retro OS.

## Stack

- **Next.js 15** (App Router) + React 19
- **React Three Fiber** + drei for the 3D room
- **Raw GLSL** ShaderMaterial for the VHS/CRT effect
- **GSAP** for the camera zoom transition
- **Tailwind CSS** + hand-rolled Win95 bevel CSS for the OS

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Experience flow

1. **The room** — parallax camera, server rack, custom PC rig, cables, and
   the CRT playing the procedurally-drawn VCR intro
   (`components/three/useVCRTexture.js`) through the VHS shader
   (`components/three/shaders/vhs.js`).
2. **The zoom** — when the tape finishes (or on click), GSAP drives the
   camera into the glass (`components/three/CameraRig.jsx`); a static flash
   hands off to the DOM.
3. **GHEAT-OS** — boot screen, teal desktop, draggable beveled windows
   (`components/os/`). File Explorer holds the ported directory tree; GitHub
   repos open in a live API viewer; shredsauce pages are their own windows.

## Easter eggs (10 anomalies — track them with `anomalies` in the terminal)

Press **ESC** (or type `look`) to step back from the OS and explore the room;
click the screen or press ESC again to sit back down. Clicking a clue pans
the camera to it.

1. The **red LED** on the rack blinks 3-short-3-long. Click it →
   `server_logs.txt` lands on the desktop.
2. The logs point at the **PC rig** — click its power light → the fans rev
   and `rig_bios.txt` (with the supervisor password) appears.
3. `login evilcorp87` in TERMINAL.EXE → **root shell**.
4. `vault` as root → the end of the trail + **VAULT.EXE** on the desktop.
5. The **Konami code** (↑↑↓↓←→←→BA) anywhere in the OS → bouncing GHEAT logo.
6. Click a **TV knob** while in the room → channel 3. Do not adjust your set.
7. Click the **taskbar clock** (or the **3:33 wall clock** in the room). It
   was always 3:33.
8. Click the **CCTV camera** in the ceiling corner — it tracks your cursor and
   blinks red. It sees you. Now you see it.
9. Click **g's evidence corkboard** on the back wall — g's investigation
   (GHEAT=EVILCORP, the 3:33 loop, the duplicate desktop, the S-O-S), red
   string and all. It foreshadows the whole vault reveal.
10. **THE ULTIMATE EGG** — type `noclip` in the terminal and fall out of the
   OS into the Backrooms: an infinite procedurally-generated yellow maze
   with buzzing fluorescents, pointer-lock mouselook and WASD (shift to
   run). ESC to surface, WAKE UP to reboot back in. The whole scene is
   lazy-loaded (`React.lazy`) — its chunk doesn't ship until you type it.

Also: `warp` / the PORTFOLIO icon engages the warp drive to `/portfolio`,
**Start → Shut Down** drops you back into the room, and
**Start → Restart...** (or terminal `reset`) factory-resets the hunt so you
can hand someone a fresh mystery.

## Content

All text/links/tree data lives in `lib/content.js` — edit there, not in the
components.
