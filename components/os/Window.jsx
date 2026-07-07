'use client';

import { useRef } from 'react';
import { useWM } from './WindowManager';
import { OS_W, OS_H } from '@/lib/osScreen';

// Classic Win95 window: chunky beveled plastic, gradient titlebar with
// _ □ X controls (pressed bevel on :active), a fake menu row, and pointer-
// event dragging. During a drag we mutate transform directly on the node —
// zero React re-renders — and commit the position on pointerup.

const MENUS = ['File', 'Edit', 'View', 'Help'];

export default function Window({ win, isActive, children, menus = MENUS, statusText }) {
  const { closeWindow, focusWindow, minimizeWindow, toggleMaximize, moveWindow } = useWM();
  const nodeRef = useRef(null);
  const drag = useRef(null);

  const onTitlePointerDown = (e) => {
    if (e.target.closest('.ctrl-btn')) return;
    if (win.maximized) return;
    focusWindow(win.id);
    const node = nodeRef.current;
    // The OS surface is CSS-3D-projected onto the CRT glass, so pointer
    // deltas (viewport px) must be converted into 1024x768 screen-space px.
    const surface = node.closest('.os-root');
    const ratio = surface ? surface.getBoundingClientRect().width / OS_W : 1;
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: win.x,
      baseY: win.y,
      scale: ratio > 0.01 ? ratio : 1,
    };
    node.setPointerCapture?.(e.pointerId);

    const onMove = (ev) => {
      if (!drag.current) return;
      const d = drag.current;
      const dx = (ev.clientX - d.startX) / d.scale;
      const dy = (ev.clientY - d.startY) / d.scale;
      // clamp so the titlebar can't leave the screen
      const nx = Math.min(Math.max(d.baseX + dx, -win.w + 60), OS_W - 60);
      const ny = Math.min(Math.max(d.baseY + dy, 0), OS_H - 60);
      node.style.left = nx + 'px';
      node.style.top = ny + 'px';
      d.fx = nx;
      d.fy = ny;
    };
    const onUp = () => {
      if (drag.current && drag.current.fx !== undefined) {
        moveWindow(win.id, drag.current.fx, drag.current.fy);
      }
      drag.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  if (win.minimized) return null;

  const style = win.maximized
    ? { left: 0, top: 0, width: '100%', height: 'calc(100% - 30px)', zIndex: win.z }
    : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z };

  return (
    <div
      ref={nodeRef}
      className="bevel-up absolute flex flex-col p-[3px]"
      style={style}
      onPointerDown={() => focusWindow(win.id)}
    >
      {/* title bar */}
      <div
        className={`${isActive ? 'titlebar' : 'titlebar-inactive'} flex h-[20px] items-center gap-1 px-[3px] select-none`}
        onPointerDown={onTitlePointerDown}
        onDoubleClick={() => toggleMaximize(win.id)}
      >
        <span className="px-[2px] text-[11px] font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis flex-1">
          {win.title}
        </span>
        <button className="ctrl-btn" aria-label="Minimize" onClick={() => minimizeWindow(win.id)}>
          <span className="mt-[5px]">_</span>
        </button>
        <button className="ctrl-btn" aria-label="Maximize" onClick={() => toggleMaximize(win.id)}>
          <span>□</span>
        </button>
        <button
          className="ctrl-btn ml-[2px]"
          aria-label="Close"
          onClick={() => closeWindow(win.id)}
        >
          <span>×</span>
        </button>
      </div>

      {/* fake menu row */}
      <div className="flex gap-0 px-[1px] py-[1px] text-[11px]">
        {menus.map((m) => (
          <span key={m} className="menu-item">
            {m}
          </span>
        ))}
      </div>

      {/* content */}
      <div className="relative flex-1 overflow-hidden">{children}</div>

      {/* status bar */}
      {statusText !== undefined && (
        <div className="bevel-groove mt-[2px] px-2 py-[2px] text-[10px] text-neutral-700">
          {statusText}
        </div>
      )}
    </div>
  );
}
