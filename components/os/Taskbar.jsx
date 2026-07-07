'use client';

import { useEffect, useRef, useState } from 'react';
import { useWM } from './WindowManager';
import { unlockEgg } from '@/lib/eggs';
import { sfx } from '@/lib/sfx';

// EASTER EGG: click the clock and it's suddenly 3:33 AM — the hour the
// maintenance log says the CRT turns itself on.
function Clock() {
  const [time, setTime] = useState('');
  const [cursed, setCursed] = useState(false);
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })
      );
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);

  const curse = () => {
    if (cursed) return;
    setCursed(true);
    sfx.channel();
    if (unlockEgg('clock')) {
      // eslint-disable-next-line no-console
      console.log('%c3:33. it was always 3:33.', 'color:#ff5e5e;font-family:monospace');
    }
    setTimeout(() => setCursed(false), 3333);
  };

  return (
    <div
      className="bevel-groove flex h-[22px] cursor-pointer items-center px-2 text-[11px]"
      style={cursed ? { color: '#c00000', fontWeight: 'bold' } : undefined}
      onClick={curse}
      title={cursed ? 'it was always 3:33' : undefined}
    >
      {cursed ? '3:33 AM' : time}
    </div>
  );
}

export default function Taskbar({ actions, onShutDown }) {
  const { windows, topZ, focusWindow, minimizeWindow } = useWM();
  const [startOpen, setStartOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!startOpen) return;
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target)) setStartOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [startOpen]);

  const startItems = [
    { icon: '📁', label: 'File Explorer', run: actions.openExplorer },
    { icon: '🚀', label: 'Portfolio', run: actions.warp },
    { icon: '👾', label: 'About', run: actions.openAbout },
    { icon: '📇', label: 'Contact', run: actions.openContact },
    { icon: '🖥️', label: 'Terminal', run: actions.openTerminal },
    null,
    { icon: '👀', label: 'Step Back', run: actions.look },
    { icon: '🔄', label: 'Restart...', run: actions.restart },
    { icon: '⏻', label: 'Shut Down...', run: onShutDown },
  ];

  return (
    <div className="bevel-up absolute bottom-0 left-0 right-0 z-[9000] flex h-[30px] items-center gap-1 px-1">
      {/* start menu */}
      {startOpen && (
        <div
          ref={menuRef}
          className="bevel-up absolute bottom-[30px] left-0 z-[9001] flex w-[190px]"
        >
          <div className="titlebar flex w-[24px] items-end justify-center pb-2">
            <span
              className="text-[13px] font-bold tracking-widest"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              GHEAT-OS
            </span>
          </div>
          <div className="flex-1 py-1">
            {startItems.map((item, i) =>
              item === null ? (
                <div key={i} className="bevel-groove mx-1 my-1 h-[2px]" />
              ) : (
                <div
                  key={item.label}
                  className="menu-item flex cursor-pointer items-center gap-2 !px-3 !py-[5px] text-[11px]"
                  onClick={() => {
                    setStartOpen(false);
                    item.run();
                  }}
                >
                  <span className="text-[14px]">{item.icon}</span>
                  {item.label}
                </div>
              )
            )}
          </div>
        </div>
      )}

      <button
        className={`w95-btn flex items-center gap-1 !px-2 !py-[2px] font-bold ${startOpen ? 'pressed' : ''}`}
        onClick={() => {
          sfx.click();
          setStartOpen((o) => !o);
        }}
      >
        <span className="flex items-center gap-1">
          <span className="text-[13px]">👾</span> Start
        </span>
      </button>

      <div className="bevel-groove mx-[2px] h-[22px] w-[2px]" />

      {/* running windows */}
      <div className="flex flex-1 gap-1 overflow-hidden">
        {windows.map((w) => {
          const active = !w.minimized && w.z === topZ;
          return (
            <button
              key={w.id}
              className={`w95-btn max-w-[160px] flex-shrink truncate !px-2 !py-[2px] text-left text-[11px] ${active ? 'pressed font-bold' : ''}`}
              onClick={() => (active ? minimizeWindow(w.id) : focusWindow(w.id))}
            >
              <span className="truncate">{w.title}</span>
            </button>
          );
        })}
      </div>

      <Clock />
    </div>
  );
}
