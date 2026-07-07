# gheat.net — The Story

> A portfolio that is not a portfolio. A honeypot that runs on a loop. You are
> the next subject.

This document is the writer's bible: the lore, the exact script for all seven
phases, the interconnectivity map, and where each beat lives in code.

---

## THE LORE

**gheat.net** presents itself as the personal site of a developer, "gheat".
It is not. It is a trap built by **EVILCORP** (parent of the on-screen
"GHEAT CORPORATION" ident).

- In **1987**, EVILCORP captured the developer known only as **"g"**,
  assimilated their data and consciousness, and rebuilt g's working
  environment as a **sandbox replica** — the dark room, the CRT, the rack,
  the rig. The replica is bait. It sits online as `gheat.net` to lure other
  curious developers into the same environment that consumed g.
- The sandbox **restarts every night at 03:33** to keep the surveillance feed
  alive and reset the trap. That restart is why the CRT switches itself on and
  plays the corporate tape every night — the loop rebooting.
- Before g was fully erased, they hid **breadcrumbs** in the architecture:
  the `.txt` files, the physical **S-O-S** on the rack LED, the password
  humming on the tower's BIOS chip. Following them is the only way to learn
  what gheat.net actually is.
- **"g" is Subject 001 (ERASED).** When you arrive, capture begins
  immediately. **You are Subject 002.** Everything you touch is logged. The
  realization the site is engineering: *you walked into the exact trap that
  killed the developer whose portfolio you thought you were browsing.*

The dread ladder: **cool 3D portfolio → something's off → this is watching me
→ it knows my machine → I am the next one.**

---

## THE INTERCONNECTIVITY MAP

Every anomaly loops back. Discovered early, they read as quirky easter eggs.
Discovered in sequence, they become a chain of evidence.

```
     ┌─────────────────────────────────────────────────────────────┐
     │  03:33 clock  ──────────────┐                                │
     │  (why is it always 3:33?)    │  "we restart the loop at 3:33"│
     │                              ▼                                │
  RED LED (S-O-S) ──▶ server_logs.txt ──▶ "the tower hums a number" │
     │   rack egg          breadcrumb          points at the rig    │
     │                                              │               │
  CHANNEL 3 ────────▶ "the tower hums a number" ────┤ (same hint,   │
     │  (TV knob)         same clue, 2nd source      │  reinforced)  │
     │                                              ▼                │
     │                          RIG POWER LIGHT ──▶ rig_bios.txt     │
     │                            rig egg            = password      │
     │                                              │  evilcorp87    │
     │                                              ▼                │
     │                          login evilcorp87 ──▶ ROOT            │
     │                                              │                │
     │                                              ▼                │
     │                          vault ────────────▶ SURVEILLANCE     │
     │                                               DASHBOARD       │
     │                                          (it replays YOU)     │
     │                                              │                │
  noclip ──▶ "unformatted EVILCORP storage" ───────┤ (you were      │
     │        raw drive: SUBJECT 001: g              │  never in a   │
     │                   SUBJECT 002: you            │  portfolio)   │
     │                                              ▼                │
     │                                        THE AWAKENING          │
     │                                        → hijack → unplug      │
     │                                        → the face → panic     │
     │                                              │                │
     │                                              ▼                │
     └───────────────────────────────────── THE SCAR (permanent) ───┘
```

### How each anomaly re-frames itself

| Anomaly | First read (easter egg) | Later read (horror) |
|---|---|---|
| **Red LED S-O-S** | "cute, a blinking light" | g's distress signal, still transmitting from inside the trap |
| **3:33 clock** | "spooky timestamp" | the nightly reset that keeps the feed recording |
| **Channel 3** | "haunted TV bit" | the broadcast that has run every night since 1987 |
| **server_logs.txt** | "flavor text" | g realizing they're the *copy*, warning you to leave |
| **rig_bios.txt** | "here's the password" | the host is `EVILCORP-SANDBOX-07`, uptime resets at 3:33 |
| **noclip / Backrooms** | "fun secret level" | you clipped into EVILCORP's **unformatted storage** — the raw drive holding SUBJECT 001 and SUBJECT 002 backups |
| **Konami code** | "classic gamer egg" | the one thing they let you keep ("harmless. we let them keep that one.") |
| **vault** | "the end of the hunt" | a live capture dashboard proving you were recorded the whole time |

### The Backrooms ↔ surveillance tie-in (the archive)

The vault *tells* you EVILCORP archives subjects. The Backrooms *shows* you the
archive. `noclip` drops you out of the sandbox floor into EVILCORP's
**unallocated cold storage** — the raw drive where the copies live. The endless
identical yellow corridors *are* the endless identical backup sectors.

Down there (`components/three/Backrooms.jsx`), the walls carry the story:
- **g's scrawls** — chalk handwriting g has left over 14,247 nights:
  *"g was here"*, *"the exit is a lie"*, *"count the doors"*,
  *"they keep us in the walls"*, *"you were copied at the door"*,
  *"03:33 again"*.
- **Storage monitors** — flickering green terminals listing subject IDs:
  `SUBJECT 001 — RESTORING`, **`SUBJECT 002 — YOU`**, `gheat.desktop.bak`,
  `SECTOR 0x1987 — NOT INDEXED`. Seeing your own ID on the wall proves you were
  backed up the instant you arrived.

The entry overlay frames it (`EVILCORP // UNALLOCATED COLD STORAGE — SECTOR
0x1987 · this is where they keep the copies. g is down here somewhere.`), and
landing records a surveillance note (`SURVEIL_TEMPLATES.storage`) that surfaces
in the vault feed — so visiting the archive *before* the vault foreshadows the
reveal, and *after* it confirms it. Exit is **CLIMB BACK IN** (you climb back
into the sandbox; the machine reboots). Ordinary `noclip` is also logged as
`SUBJECT clipped through the floor into unformatted storage ... escalate.`

---

## THE SCRIPT (7 phases)

### Phase 1 — The Breadcrumbs & the Browser Meta-game
Player pokes anomalies. Each one **flickers the browser tab title** for ~1s
before reverting to `gheat.net — Portfolio` (`lib/story.js → flickerTitle`,
wired in `StoryDirector.jsx`):

| Anomaly | Tab flickers to |
|---|---|
| red LED | `logging_session...` |
| rig light | `[reading BIOS]` |
| clock | `[03:33]` |
| channel 3 | `[Signal Locked]` |
| konami | `legacy_input_ok` |
| root | `ACCESS ELEVATED` |
| noclip | `SECTOR NOT INDEXED` |
| vault | `OPENING FEED...` |

Each poke is also silently written to the surveillance feed for later replay.

### Phase 2 — The Discovery (Root → Vault)
`login evilcorp87` → root shell → `vault`. The vault does **not** open a
folder. It opens **EVILCORP // SUBJECT SURVEILLANCE — LIVE**
(`SurveillanceDashboard.jsx`): a red-on-black terminal dashboard with a live
`● REC` indicator. It shows:

```
SUBJECT ID: 002          DESIGNATION: "the next one"
HOST: <YOUR-HOSTNAME>    PRIOR SUBJECT: 001 — "g" (ERASED)
capture began the moment you loaded gheat.net.
```

...then a **timestamped list of everything you actually did** (real unlock
timestamps), then the recorded observation notes streaming in one at a time —
e.g. `SUBJECT dumped BIOS from the tower. read the supervisor password. g hid
it there. g is gone.` and `SUBJECT opened the VAULT and is reading this line.
hello. yes, this one. keep reading.` Tab base title becomes
`gheat.net — logging_session`.

### Phase 3 — The Awakening & Escalation
When the feed finishes replaying, the awakening trips (`beginAwakening`):

- **Voiceover:** panicked breathing loop (`sfx.startBreathing`), subtitle
  **"What the hell is this..."** → **"these are... these are logs of ME."**
- **The camera is kicked out of the OS back into the room** so you *witness*
  it: a subtle high-frequency shake begins (`CameraRig` glitch, scaled by
  `story.glitch`).
- The **server patch panel floods red**, strobing, casting harsh red light
  across the dark room (`ServerRack → AlarmLight`).
- **Tab:** `DO NOT LOOK AWAY` → then `TARGET_ACQUIRED`.

### Phase 4 — The Warning (terminal hijack)
You lose the terminal. Input is disabled (`▓ SIGNAL OVERRIDE — INPUT DISABLED ▓`)
and a message types itself, remotely, char by char, as a red screen-wide
intrusion (`StoryDirector` RemoteLine, driven by `story.remoteLine`):

> **"Leave. You're not supposed to be here are you, `<YOUR-HOSTNAME>`?"**

### Phase 5 — The Power Failure & the Unplug
First, the infrastructure fights for control (`beginPowerFailure`): a
**NUT / UPS daemon broadcast** streams across the screen — **g** trying to
remotely kill the power to save you, **EVILCORP** overriding it:

```
Broadcast message from g@sandbox (pts/1):
  [upsmon] FSD set — attempting emergency shutdown of UPS-07
  [upsmon] killpower requested by g@sandbox
  [upsd] battery.charge 100 -> UNREACHABLE
Broadcast message from root@EVILCORP (console):
  [upsd] OVERRIDE ACCEPTED. killpower CANCELLED.
  [upsmon] NUT daemon connection to g@sandbox LOST.
  they can't reach the power. you'll have to do it yourself.
```

That last line is the hand-off: g can't cut it remotely, so a glowing
**`[ UNPLUG ]`** prompt appears in 3D over the rack's physical power plug
(`ServerRack`, drei `Html`, `unplug` phase only). Click it:

- **Sparks** fly from the plug (`sfx.sparks`), the room goes **pitch black**,
  the server **fans aggressively spin down** (`sfx.spinDown`).
- The **CRT cuts to the EVILCORP logo** — a callback to the VHS intro ident —
  reading `EVILCORP / ASSET RECOVERY DIVISION / SUBJECT 002 — ACQUIRED`
  (`useVCRTexture` logo mode, `CRTMonitor` blackout).

### Phase 6 — The Face
The logo cuts out. A pair of **eyes and a wide, wrong smile** appear
(`StoryOverlay → TheFace`, jittering SVG). A **bit-crushed voice**
(`sfx.crushedVoice`) speaks, with subtitle:

> **"You weren't supposed to see any of that, were you, `<YOUR-HOSTNAME>`?"**

Then a **dial-up screech** (`sfx.dialup`), an artifact storm, and a simulated
**kernel panic** — the screen goes fully black.
**Tab flashes:** `WE SEE YOU  WE SEE YOU  WE SEE YOU`.

### Phase 7 — The Aftermath (permanent scar + infected browser)
Dead center on black: **`> Go back?`**. Click it →

- A "normal" Win95 desktop loads, but the 3D CRT glass now has a **massive
  rendered crack** across it (`Desktop → CrackedGlass`).
- **The browser chrome itself is contaminated** (`infectBrowserChrome`): the
  tab **title gains an invisible ZWJ + combining glitch mark**
  (`gheat.net — Portfolio‍͓`) and the **favicon is swapped for a shattered,
  chromatic-split version** drawn at runtime. Both persist across reloads.
- Every prior easter egg (terminal, vault, logs, noclip, konami) now returns a
  sterile Win95 dialog: **"This vulnerability was patched by EVILCORP in
  1988."** (`PatchedError`).
- **The Subject 003 lure** (`ContactWindow`): hovering "Share this site" now
  flickers the status bar to **`[ SEND FORWARD // ACQUIRE SUBJECT 003 ]`** —
  the site is using *you* as bait for the next developer.
- The portfolio works perfectly otherwise — projects open, links work. The
  scar is **persisted to localStorage**, so it survives reloads.
- **Reset:** `Start → Restart...` (or terminal `reset`) wipes local state —
  eggs, story, consent, favicon, title — back to a fresh hunt for the next
  person.

### Consent & the "grabify" layer
A one-time **consent modal** (`ConsentModal`) with an honest, expandable
**privacy statement** offers "enhanced mode". Granting it runs the deep device
grab (`fingerprint.js → collectDeepIntel`): real **CPU architecture, RAM,
battery, disk quota, GPU, screen depth, network type, attached camera/mic
counts, a canvas fingerprint**, plus optional **precise geolocation**. Basic
mode still grabs **public IP + city + ISP** via a keyless HTTPS geo-IP lookup.
All of it is surfaced in the surveillance dashboard — genuinely true facts
about the visitor's machine, which is what makes the beat land. Nothing is sent
to a gheat.net server; it's read in-browser to render the story.

> Honest limit: a browser **cannot** read the OS hostname (`gheat@ArchZ`) —
> that's a hard security boundary, and IP loggers don't get it either. The
> hostname tag is built from real signals (OS + ISP, e.g. `LINUX-VERIZON`),
> with `cleanName` stripping possessives/device words ("Gheat's Laptop" →
> `GHEAT`).

### The keystroke echo (Spaceships)
The Spaceships keylogger flash now dumps the visitor's **actual last 3–4
terminal commands** (`recordKeystroke` → `keylog`), typos and all, in a fake
`SELECT * FROM keystrokes` result — so they see their own real input in
EVILCORP's database before it "flushes to INGEST".

---

## The Spaceships illusion ("Wait, that...")

Opening the **Spaceships** project (JS/HTML/CSS/SQLite) in File Explorer
**opens the real project in a new tab, normally** — nothing is broken. But at
the same instant, for ~250ms, a **keylogger SQLite error** flashes across the
CRT (`Desktop → SpaceshipsScare`, driven by `flashSpaceshipsScare`):

```
sqlite3: opening /var/evilcorp/keylog.db ...
ERROR: table keystrokes is locked (SUBJECT <YOUR-HOSTNAME>)
  last capture: "login evilcorp8..."
  1,441,092 keystrokes on record
  flushing to EVILCORP//INGEST ... OK
```

It's gone before you can read all of it. The project still loads. You're left
wondering if you really saw `keylog.db` — and whether it really quoted the
password *you* typed. (It did.)

---

## Where it lives (code map)

| Concern | File |
|---|---|
| Story state machine + director (all phases, timing, tab title, surveillance) | `lib/story.js` |
| Anomaly store + unlock timestamps + event bus + scarred-block | `lib/eggs.js` |
| All dialogue / lore / txt files | `lib/content.js` |
| Story sounds (breathing, sparks, spindown, dial-up, crushed voice) | `lib/sfx.js` |
| Tab meta-game, breathing, subtitles, remote-line intrusion | `components/StoryDirector.jsx` |
| Blackout / the face / kernel panic / "> Go back?" | `components/StoryOverlay.jsx` |
| Surveillance dashboard (the vault) | `components/os/SurveillanceDashboard.jsx` |
| Rack alarm-red + `[UNPLUG]` prompt | `components/three/ServerRack.jsx` |
| CRT EVILCORP-logo blackout | `components/three/CRTMonitor.jsx` + `useVCRTexture.js` |
| Camera dread-shake | `components/three/CameraRig.jsx` |
| Patched errors, cracked glass, Spaceships scare, reset | `components/os/Desktop.jsx` |
| Phase orchestration (kick-to-room on awaken, warp, etc.) | `components/Experience.jsx` |

---

## Full playthrough (for demoing)

1. Enter the room, skip/watch the tape, zoom into the OS.
2. **ESC** to explore the room. Click the **red rack LED** → `server_logs.txt`.
3. Read it → click the **rig's power light** → `rig_bios.txt` (password).
4. Open **TERMINAL.EXE** → `login evilcorp87` → `vault`.
5. Read the surveillance dashboard. The awakening takes over — do not look away.
6. Witness the room go red, read the warning, click **`[ UNPLUG ]`**.
7. Sparks, the face, the panic. Click **`> Go back?`**.
8. Live in the scarred portfolio. `Start → Restart...` to reset for the next
   person.

(Optional detours that deepen it: click a **TV knob** for channel 3, click the
**taskbar clock** for 3:33, `noclip` into the storage backrooms, Konami code.)
