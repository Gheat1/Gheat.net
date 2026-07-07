'use client';

import { useEffect, useRef, useState } from 'react';
import { RIG_BIOS_TXT, SECRET_TXT } from '@/lib/content';
import { EGG_KEYS, getEggs, unlockEgg, useEgg } from '@/lib/eggs';
import { recordKeystroke, useStory } from '@/lib/story';
import { sfx } from '@/lib/sfx';
import { useWM } from './WindowManager';

// TERMINAL.EXE — fake shell, home of the OS-side easter eggs.
//   theme matrix|midnight|teal   repaints the whole OS
//   look                         step back from the screen (also: ESC)
//   warp / portfolio             engage the warp drive to /portfolio
//   login evilcorp87             root shell (password is out in the room)
//   vault                        root only — the end of the trail
//   anomalies                    how much of the hunt you've found

const ASCII = String.raw`
   ________  __  ______  ___  ______
  / ___/ _ \/ / / / __ \/ _ |/_  __/
 / (_ / __ / /_/ / /_/ / __ | / /
 \___/_/ |_\____/\____/_/ |_|/_/  .net
`;

const HELP = `available commands:
  help              this
  dir               list files
  whoami            who are you
  gheat             ???
  theme <name>      teal | midnight | matrix
  cat <file>        read a file
  look              step back from the screen (esc works too)
  warp              engage warp drive -> /portfolio
  anomalies         hunt progress
  login <password>  supervisor access
  secret            you already know
  reset             wipe all anomalies (fresh hunt)
  clear             clear screen
  reboot            eject the tape
  exit              close terminal`;

const ANOMALY_LABELS = {
  server: 'the red light on the rack',
  rig: 'the tower that hums',
  root: 'supervisor access',
  vault: 'the vault',
  konami: 'the old code',
  ch3: 'channel 3',
  clock: '3:33',
  noclip: 'out of bounds',
  camera: 'the eye in the ceiling',
  board: "g's evidence board",
};

export default function Terminal({ windowId, setTheme, actions }) {
  const [lines, setLines] = useState([
    'GHEAT-OS [Version 4.00.1987]',
    '(C) Gheat Corporation. A division of Evil Corp.',
    '',
    'type "help" to begin.',
    '',
  ]);
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const serverUnlocked = useEgg('server');
  const isRoot = useEgg('root');
  const { closeWindow } = useWM();
  const story = useStory();
  // once EVILCORP takes the terminal, you lose the keyboard and it types back
  const hijacked =
    story.phase === 'hijack' ||
    story.phase === 'unplug' ||
    story.phase === 'blackout';

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines, story.remoteLine]);

  const print = (...out) => setLines((l) => [...l, ...out]);
  const prompt = isRoot ? 'root@gheat:\\>' : 'C:\\>';

  const run = (raw) => {
    const cmd = raw.trim();
    const [name, ...args] = cmd.split(/\s+/);
    print(`${prompt} ${cmd}`);
    if (!name) return;
    // every real input is quietly logged — the keylogger scare dumps it back
    recordKeystroke(cmd);

    switch (name.toLowerCase()) {
      case 'help':
        print(...HELP.split('\n'), '');
        break;
      case 'dir':
        print(
          ' Directory of C:\\',
          '',
          '  <DIR>   projects',
          '  <DIR>   shredsauce',
          '          ABOUT.TXT',
          '          CONTACT.TXT',
          '          PORTFOLIO.EXE',
          serverUnlocked ? '          SERVER_LOGS.TXT' : '          ??????????.???',
          getEggs().rig ? '          RIG_BIOS.TXT' : '          ??????????.???',
          isRoot ? '  <SYS>   VAULT.EXE' : '',
          ''
        );
        break;
      case 'whoami':
        print(
          isRoot
            ? 'root. the system answers to you now.'
            : 'guest@gheat.net — you found the terminal. good.',
          ''
        );
        break;
      case 'gheat':
        print(...ASCII.split('\n'), '');
        break;
      case 'theme': {
        const t = (args[0] || '').toLowerCase();
        if (['teal', 'midnight', 'matrix'].includes(t)) {
          setTheme(t);
          sfx.open();
          print(`theme set to "${t}".`, t === 'matrix' ? 'wake up.' : '', '');
        } else {
          sfx.error();
          print('usage: theme teal | midnight | matrix', '');
        }
        break;
      }
      case 'cat': {
        const f = (args[0] || '').toLowerCase();
        if (f === 'server_logs.txt' && serverUnlocked) {
          print(...SECRET_TXT.split('\n'), '');
        } else if (f === 'rig_bios.txt' && getEggs().rig) {
          print(...RIG_BIOS_TXT.split('\n'), '');
        } else if (f === 'vault.exe' && getEggs().vault) {
          print(...VAULT_TXT.split('\n'), '');
        } else if (f === 'server_logs.txt' || f === 'rig_bios.txt') {
          sfx.error();
          print('access denied. something in the room is blinking at you.', '');
        } else {
          print(`cat: ${args[0] || '?'}: no such file`, '');
        }
        break;
      }
      case 'look':
        actions?.look?.();
        print('stepping back... (click the screen or press ESC to return)', '');
        break;
      case 'warp':
      case 'portfolio':
        print('WARP DRIVE ENGAGED.', 'destination: /portfolio', 'hold on.', '');
        setTimeout(() => actions?.warp?.(), 700);
        break;
      case 'login': {
        const pass = (args[0] || '').toLowerCase();
        if (isRoot) {
          print('already root.', '');
        } else if (pass === 'evilcorp87') {
          unlockEgg('root');
          sfx.root();
          print(
            'ACCESS GRANTED.',
            'welcome back, supervisor.',
            'one more door: type "vault".',
            ''
          );
        } else if (!pass) {
          print('usage: login <password>  (the room knows it)', '');
        } else {
          sfx.error();
          print('ACCESS DENIED. the tower hums the answer.', '');
        }
        break;
      }
      case 'vault':
        if (isRoot) {
          const first = unlockEgg('vault');
          sfx.open();
          print('opening VAULT.EXE ...', '');
          actions?.openVault?.();
          if (first) print('>> VAULT.EXE added to the desktop.', '');
        } else {
          sfx.error();
          print('access denied. root only.', '');
        }
        break;
      case 'anomalies': {
        const eggs = getEggs();
        const found = EGG_KEYS.filter((k) => eggs[k]);
        print(`anomalies logged: ${found.length}/${EGG_KEYS.length}`, '');
        EGG_KEYS.forEach((k) =>
          print(`  [${eggs[k] ? 'x' : ' '}] ${eggs[k] ? ANOMALY_LABELS[k] : '???????'}`)
        );
        print(
          '',
          found.length === EGG_KEYS.length
            ? 'all of them. you absolute menace.'
            : 'the room remembers what you touch.',
          ''
        );
        break;
      }
      case 'secret':
        unlockEgg('server');
        print('...fine. check the desktop.', '');
        break;
      // THE ULTIMATE EGG — not listed in help; the vault whispers about it
      case 'noclip':
        print(
          'sv_cheats 1',
          'noclip ON',
          'CLIP_ERROR: sandbox floor integrity check failed',
          'CLIP_ERROR: dropping into EVILCORP unallocated storage',
          'SECTOR 0x1987 — this is where they keep the copies.',
          'falling...',
          ''
        );
        setTimeout(() => actions?.noclip?.(), 1100);
        break;
      case 'reset':
        resetEggs();
        print(
          'all anomalies wiped. the room forgets you.',
          'hand over the keyboard.',
          ''
        );
        break;
      case 'clear':
        setLines([]);
        break;
      case 'reboot':
        print('ejecting tape...');
        setTimeout(() => actions?.reboot?.(), 600);
        break;
      case 'exit':
        closeWindow(windowId);
        break;
      default:
        sfx.error();
        print(`'${name}' is not recognized as an internal or external command.`, '');
    }
  };

  return (
    <div
      className="flex h-full flex-col bg-black p-1 font-term text-[12px] text-[#33ff33]"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="os-scroll flex-1 overflow-auto whitespace-pre-wrap">
        {lines.map((l, i) => (
          <div key={i}>{l || ' '}</div>
        ))}
        {hijacked ? (
          // control taken — input disabled while EVILCORP types (the line
          // itself is shown as a full-screen intrusion by the director)
          <div className="mt-1 animate-pulse text-[#ff4444]">
            ▓ SIGNAL OVERRIDE — INPUT DISABLED ▓
          </div>
        ) : (
          <div className="flex">
            <span>{prompt}&nbsp;</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  run(input);
                  setInput('');
                }
              }}
              className="flex-1 bg-transparent font-term text-[12px] text-[#33ff33] outline-none"
              autoFocus
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
