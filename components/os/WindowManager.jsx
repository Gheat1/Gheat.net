'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { OS_W, OS_H } from '@/lib/osScreen';

// Window state lives here: open/close/focus/minimize/maximize + z-order.
// Positions during drag are mutated directly on the DOM node (see Window.jsx)
// and committed back on pointerup, so dragging never re-renders the tree.

const WMContext = createContext(null);

export function useWM() {
  return useContext(WMContext);
}

let nextId = 1;

export function WindowManagerProvider({ children }) {
  const [windows, setWindows] = useState([]);
  const zRef = useRef(10);

  const focusWindow = useCallback((id) => {
    zRef.current += 1;
    const z = zRef.current;
    setWindows((ws) =>
      ws.map((w) => (w.id === id ? { ...w, z, minimized: false } : w))
    );
  }, []);

  const openWindow = useCallback(
    ({ kind, title, props = {}, w = 460, h = 360, singleton = true }) => {
      sfx.open();
      zRef.current += 1;
      const z = zRef.current;
      setWindows((ws) => {
        if (singleton) {
          const existing = ws.find(
            (win) => win.kind === kind && win.singletonKey === (props.singletonKey ?? kind)
          );
          if (existing) {
            return ws.map((win) =>
              win.id === existing.id
                ? { ...win, z, minimized: false, title, props }
                : win
            );
          }
        }
        const id = nextId++;
        const cascade = (ws.length % 7) * 26;
        // window positions live in the CRT's 1024x768 screen space
        const width = Math.min(w, OS_W - 24);
        const height = Math.min(h, OS_H - 70);
        return [
          ...ws,
          {
            id,
            kind,
            title,
            props,
            singletonKey: props.singletonKey ?? kind,
            x: Math.max(8, (OS_W - width) / 2 - 90 + cascade),
            y: Math.max(8, (OS_H - height) / 2 - 60 + cascade),
            w: width,
            h: height,
            z,
            minimized: false,
            maximized: false,
          },
        ];
      });
    },
    []
  );

  const closeWindow = useCallback((id) => {
    sfx.close();
    setWindows((ws) => ws.filter((w) => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id) => {
    sfx.click();
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
  }, []);

  const toggleMaximize = useCallback((id) => {
    sfx.click();
    setWindows((ws) =>
      ws.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w))
    );
  }, []);

  const moveWindow = useCallback((id, x, y) => {
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, x, y } : w)));
  }, []);

  const topZ = windows.reduce((m, w) => Math.max(m, w.z), 0);

  const api = useMemo(
    () => ({
      windows,
      topZ,
      openWindow,
      closeWindow,
      focusWindow,
      minimizeWindow,
      toggleMaximize,
      moveWindow,
    }),
    [windows, topZ, openWindow, closeWindow, focusWindow, minimizeWindow, toggleMaximize, moveWindow]
  );

  return <WMContext.Provider value={api}>{children}</WMContext.Provider>;
}
