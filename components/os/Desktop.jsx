'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { WindowManagerProvider, useWM } from './WindowManager';
import Window from './Window';
import Taskbar from './Taskbar';
import FileExplorer from './FileExplorer';
import GithubViewer from './GithubViewer';
import Shredsauce from './Shredsauce';
import AboutWindow from './AboutWindow';
import ContactWindow from './ContactWindow';
import Terminal from './Terminal';
import Notepad from './Notepad';
import { PATCHED_ERROR, RIG_BIOS_TXT, SECRET_TXT } from '@/lib/content';
import { OS_W, OS_H } from '@/lib/osScreen';
import { resetEggs, unlockEgg, useEggs } from '@/lib/eggs';
import { beginSurveillance, resetStory, useStory, useStoryPhase } from '@/lib/story';
import { sfx } from '@/lib/sfx';
import SurveillanceDashboard from './SurveillanceDashboard';

// ---------------------------------------------------------------- boot

const BOOT_LINES = [
  'GHEAT-OS BIOS v4.00 — (C) 1987 GHEAT CORPORATION',
  'MEMORY TEST: 640K OK',
  'DETECTING TAPE DRIVE ......... OK',
  'MOUNTING C:\\HOME ............. OK',
  'STARTING GHEAT-OS',
];

function BootScreen({ onDone }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    sfx.boot();
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= BOOT_LINES.length) {
          clearInterval(id);
          setTimeout(onDone, 450);
          return c;
        }
        return c + 1;
      });
    }, 320);
    return () => clearInterval(id);
  }, [onDone]);

  return (
    <div className="absolute inset-0 z-[9500] bg-black p-6 font-term text-[13px] text-[#aaaaaa]">
      {BOOT_LINES.slice(0, count).map((l) => (
        <div key={l}>{l}</div>
      ))}
      <span className="boot-cursor">█</span>
    </div>
  );
}

// ------------------------------------------------------------ shutdown

function ShutdownScreen({ onReboot }) {
  return (
    <div
      className="absolute inset-0 z-[9500] flex cursor-pointer items-center justify-center bg-black"
      onClick={onReboot}
    >
      <div className="text-center font-term text-[#ff8f2e]">
        <div className="text-[22px] font-bold leading-relaxed">
          It&apos;s now safe to turn off
          <br />
          your computer.
        </div>
        <div className="mt-6 text-[11px] text-neutral-600">
          (click to go back to the room)
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------- matrix rain

// `theme matrix` easter egg: green digital rain behind the icons/windows.
function MatrixRain() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = OS_W;
    canvas.height = OS_H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#010801';
    ctx.fillRect(0, 0, OS_W, OS_H);

    const CELL = 14;
    const cols = Math.ceil(OS_W / CELL);
    const drops = Array.from({ length: cols }, () => Math.random() * -40);
    const chars = 'アイウエオカキクケコサシスセソタチツテト0123456789GHEATZX';
    let raf;
    let last = 0;
    const step = (now) => {
      raf = requestAnimationFrame(step);
      if (now - last < 50) return; // ~20fps looks more "terminal"
      last = now;
      ctx.fillStyle = 'rgba(1, 8, 1, 0.14)';
      ctx.fillRect(0, 0, OS_W, OS_H);
      ctx.font = `bold ${CELL - 1}px monospace`;
      for (let i = 0; i < cols; i++) {
        const y = drops[i] * CELL;
        if (y > 0) {
          const ch = chars[(Math.random() * chars.length) | 0];
          ctx.fillStyle = '#0f0';
          ctx.fillText(ch, i * CELL, y);
          ctx.fillStyle = '#009922';
          ctx.fillText(chars[(Math.random() * chars.length) | 0], i * CELL, y - CELL);
        }
        drops[i] = y > OS_H && Math.random() > 0.96 ? 0 : drops[i] + 1;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0" />;
}

// -------------------------------------------------- konami / dvd logo

const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
];

const DVD_COLORS = ['#ff5e5e', '#ffd75e', '#6eff5e', '#5ee8ff', '#b45eff', '#ff5ecd'];

// Bounces around the desktop like the immortal DVD screensaver logo.
// Click it to dismiss. Everyone waits for the corner hit; so will you.
function DvdLogo({ onDismiss }) {
  const ref = useRef(null);
  const state = useRef({ x: 80, y: 120, vx: 130, vy: 104, c: 0 });
  const [color, setColor] = useState(DVD_COLORS[0]);

  useEffect(() => {
    let raf;
    let last = performance.now();
    const step = (now) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const s = state.current;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      let bounced = false;
      if (s.x <= 0 || s.x >= OS_W - 150) {
        s.vx *= -1;
        s.x = Math.max(0, Math.min(s.x, OS_W - 150));
        bounced = true;
      }
      if (s.y <= 0 || s.y >= OS_H - 94) {
        s.vy *= -1;
        s.y = Math.max(0, Math.min(s.y, OS_H - 94));
        bounced = true;
      }
      if (bounced) {
        s.c = (s.c + 1) % DVD_COLORS.length;
        setColor(DVD_COLORS[s.c]);
        sfx.click();
      }
      if (ref.current) {
        ref.current.style.transform = `translate(${s.x}px, ${s.y}px)`;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      className="dvd-logo"
      style={{ color, border: `3px solid ${color}` }}
      onClick={onDismiss}
      title="ok you can go back to work now"
    >
      GHEAT
      <small>VIDEO</small>
    </div>
  );
}

// ------------------------------------------------------------- vault

// The vault opens the surveillance dashboard and, the first time, kicks off
// the escalation cascade (dashboard feed -> awakening -> hijack -> unplug).
function VaultWindow() {
  useEffect(() => {
    beginSurveillance();
  }, []);
  return <SurveillanceDashboard />;
}

// EVILCORP "patched" error — a sterile Win95 dialog shown for every egg once
// the story scars over.
function PatchedError({ onClose }) {
  return (
    <div className="flex h-full flex-col bg-w95-face">
      <div className="flex flex-1 items-center gap-3 p-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-black bg-red-600 text-[16px] font-bold text-white">
          ✕
        </div>
        <div className="text-[11px] leading-relaxed">{PATCHED_ERROR}</div>
      </div>
      <div className="flex justify-center pb-3">
        <button className="w95-btn min-w-[70px]" onClick={onClose}>
          <span>OK</span>
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------- desktop

function DesktopIcon({ icon, label, onOpen, dim }) {
  const [selected, setSelected] = useState(false);
  return (
    <button
      className={`desktop-icon ${selected ? 'selected' : ''}`}
      style={dim ? { opacity: 0.55 } : undefined}
      onClick={() => setSelected(true)}
      onBlur={() => setSelected(false)}
      onDoubleClick={() => {
        setSelected(false);
        onOpen();
      }}
    >
      <span className="text-[30px] leading-none" style={{ textShadow: '2px 2px 0 #0006' }}>
        {icon}
      </span>
      <span className="icon-label">{label}</span>
    </button>
  );
}

function DesktopInner({ onReboot, onWarp, onLook, onNoclip, theme, setTheme }) {
  const { windows, topZ, openWindow, closeWindow } = useWM();
  const [booted, setBooted] = useState(false);
  const [shutdown, setShutdown] = useState(false);
  const [dvd, setDvd] = useState(false);
  const eggs = useEggs();
  const storyPhase = useStoryPhase();
  const scarred = storyPhase === 'scarred';

  // once EVILCORP "patches" everything, the eggs return a sterile error
  // instead of doing their thing.
  const patched = () =>
    openWindow({ kind: 'patched', title: 'EVILCORP Security', w: 340, h: 150 });

  const actions = {
    openExplorer: () =>
      openWindow({ kind: 'explorer', title: 'File Explorer - C:\\home', w: 460, h: 420 }),
    openAbout: () =>
      openWindow({ kind: 'about', title: 'About - gheat.net', w: 420, h: 380 }),
    openContact: () =>
      openWindow({ kind: 'contact', title: 'Contact', w: 360, h: 260 }),
    openTerminal: () =>
      scarred
        ? patched()
        : openWindow({ kind: 'terminal', title: 'TERMINAL.EXE', w: 560, h: 380 }),
    openSecret: () =>
      scarred
        ? patched()
        : openWindow({
            kind: 'notepad',
            title: 'server_logs.txt - Notepad',
            props: { text: SECRET_TXT, singletonKey: 'server_logs' },
            w: 440,
            h: 400,
          }),
    openRigBios: () =>
      scarred
        ? patched()
        : openWindow({
            kind: 'notepad',
            title: 'rig_bios.txt - Notepad',
            props: { text: RIG_BIOS_TXT, singletonKey: 'rig_bios' },
            w: 440,
            h: 380,
          }),
    openVault: () =>
      scarred
        ? patched()
        : openWindow({ kind: 'vault', title: 'VAULT.EXE — ROOT ACCESS', w: 480, h: 440 }),
    warp: onWarp,
    look: onLook,
    noclip: scarred ? patched : onNoclip,
    // Restart = factory reset: wipes the egg hunt AND the story so you can
    // hand someone a completely fresh mystery.
    restart: () => {
      resetEggs();
      resetStory();
      onReboot();
    },
  };

  // open the explorer automatically once the boot finishes
  const handleBootDone = useCallback(() => {
    setBooted(true);
  }, []);
  useEffect(() => {
    if (booted) actions.openExplorer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booted]);

  // EASTER EGG: the konami code, listened for OS-wide
  useEffect(() => {
    let idx = 0;
    const onKey = (e) => {
      const expect = KONAMI[idx];
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === expect) {
        idx += 1;
        if (idx === KONAMI.length) {
          idx = 0;
          if (scarred) return; // patched
          sfx.konami();
          unlockEgg('konami');
          setDvd(true);
          // eslint-disable-next-line no-console
          console.log(
            '%c↑↑↓↓←→←→BA — now we wait for the corner hit together.',
            'color:#ffd75e;font-family:monospace'
          );
        }
      } else {
        idx = key === KONAMI[0] ? 1 : 0;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scarred]);

  const renderContent = (win) => {
    switch (win.kind) {
      case 'explorer':
        return <FileExplorer onWarp={onWarp} />;
      case 'github':
        return <GithubViewer href={win.props.href} label={win.props.label} />;
      case 'shredsauce':
        return <Shredsauce page={win.props.page} />;
      case 'about':
        return <AboutWindow />;
      case 'contact':
        return <ContactWindow />;
      case 'terminal':
        return (
          <Terminal
            windowId={win.id}
            setTheme={setTheme}
            actions={{ ...actions, reboot: () => setShutdown(true) }}
          />
        );
      case 'notepad':
        return <Notepad text={win.props.text} />;
      case 'vault':
        return <VaultWindow />;
      case 'patched':
        return <PatchedError onClose={() => closeWindow(win.id)} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="os-root absolute inset-0 overflow-hidden"
      data-theme={theme}
      style={{ background: 'var(--desktop)' }}
    >
      {theme === 'matrix' && <MatrixRain />}
      {!booted && <BootScreen onDone={handleBootDone} />}
      {shutdown && <ShutdownScreen onReboot={onReboot} />}

      {/* desktop icons */}
      <div className="absolute left-2 top-2 flex flex-col gap-2">
        <DesktopIcon icon="🗄️" label="File Explorer" onOpen={actions.openExplorer} />
        <DesktopIcon icon="🚀" label="PORTFOLIO" onOpen={onWarp} />
        <DesktopIcon icon="👾" label="About" onOpen={actions.openAbout} />
        <DesktopIcon icon="📇" label="Contact" onOpen={actions.openContact} />
        <DesktopIcon icon="🖥️" label="TERMINAL.EXE" onOpen={actions.openTerminal} />
        {/* EASTER EGGS: files earned out in the room */}
        {eggs.server && (
          <DesktopIcon icon="📄" label="server_logs.txt" onOpen={actions.openSecret} dim />
        )}
        {eggs.rig && (
          <DesktopIcon icon="📄" label="rig_bios.txt" onOpen={actions.openRigBios} dim />
        )}
        {eggs.vault && (
          <DesktopIcon icon="🔐" label="VAULT.EXE" onOpen={actions.openVault} />
        )}
      </div>

      {/* windows */}
      {windows.map((win) => (
        <Window key={win.id} win={win} isActive={win.z === topZ}>
          {renderContent(win)}
        </Window>
      ))}

      {dvd && <DvdLogo onDismiss={() => setDvd(false)} />}

      {/* the Spaceships "wait, that..." flash: a keylogger SQLite error blipped
          over the whole screen for a few frames */}
      <SpaceshipsScare />

      {/* the permanent scar: a rendered crack across the CRT glass, drawn over
          the whole OS surface, that never goes away in the scarred ending */}
      {scarred && <CrackedGlass />}

      <Taskbar actions={actions} onShutDown={() => setShutdown(true)} />
    </div>
  );
}

// keylogger DB error, shown for ~250ms when Spaceships is opened. It dumps the
// keystrokes table — which contains the user's OWN real recent terminal inputs.
function SpaceshipsScare() {
  const { spaceshipsScare, hostname, keylog } = useStory();
  if (!spaceshipsScare) return null;
  const recent = (keylog && keylog.length ? keylog : ['help', 'dir', 'login evilcorp87']).slice(-4);
  const rows = recent
    .map((k, i) => `  rowid ${1441088 + i} | "${k}"`)
    .join('\n');
  const body =
    'sqlite3 /var/evilcorp/keylog.db\n' +
    `sqlite> SELECT * FROM keystrokes WHERE subject='${hostname}' ORDER BY t DESC LIMIT 4;\n` +
    rows +
    '\n  (1,441,092 rows total)\n' +
    'ERROR: database is locked — flushing to EVILCORP//INGEST ... OK';
  return (
    <div className="pointer-events-none absolute inset-0 z-[8000] flex items-center justify-center bg-black">
      <pre className="font-term text-[10px] leading-tight text-[#ff3b3b]">{body}</pre>
    </div>
  );
}

// SVG crack overlay across the glass
function CrackedGlass() {
  return (
    <svg className="pointer-events-none absolute inset-0 z-[7500] h-full w-full" viewBox="0 0 1024 768" preserveAspectRatio="none">
      <g stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" fill="none">
        <path d="M300 -10 L430 250 L360 420 L470 560 L400 780" />
        <path d="M430 250 L620 300 L780 180" />
        <path d="M430 250 L250 360 L60 340" />
        <path d="M360 420 L520 470 L700 430 L900 500" />
        <path d="M360 420 L200 520 L120 700" />
        <path d="M470 560 L640 640 L620 780" />
        <path d="M470 560 L560 500 L720 560" />
      </g>
      <g stroke="rgba(0,0,0,0.4)" strokeWidth="3" fill="none">
        <path d="M300 -10 L430 250 L360 420 L470 560 L400 780" />
      </g>
      {/* impact spider at the main fracture */}
      <g stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none">
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <line
              key={i}
              x1="430"
              y1="250"
              x2={430 + Math.cos(a) * 55}
              y2={250 + Math.sin(a) * 55}
            />
          );
        })}
      </g>
    </svg>
  );
}

export default function Desktop({ onReboot, onWarp, onLook, onNoclip }) {
  const [theme, setTheme] = useState('teal');
  return (
    <WindowManagerProvider>
      <DesktopInner
        onReboot={onReboot}
        onWarp={onWarp}
        onLook={onLook}
        onNoclip={onNoclip}
        theme={theme}
        setTheme={setTheme}
      />
    </WindowManagerProvider>
  );
}
