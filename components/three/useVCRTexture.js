'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

// Procedurally renders the sinister 80s corporate VHS intro onto an
// offscreen canvas. The GLSL shader handles all the analog degradation;
// this just draws clean "tape content" frames.

const W = 640;
const H = 480;

export const INTRO_DURATION = 8.4; // seconds until onComplete

function drawCenteredLines(ctx, lines, y0, lineHeight) {
  lines.forEach((l, i) => {
    ctx.fillText(l.text, W / 2 + (l.dx || 0), y0 + i * lineHeight);
  });
}

export function useVCRTexture() {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    return c;
  }, []);

  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    return t;
  }, [canvas]);

  useEffect(() => () => texture.dispose(), [texture]);

  const ctxRef = useRef(null);

  // draw(t) is called from the CRT's frame loop (throttled to ~30fps there).
  const draw = useMemo(() => {
    return (t, looping, channel3 = false, logo = false, face = false) => {
      if (!ctxRef.current) ctxRef.current = canvas.getContext('2d');
      const ctx = ctxRef.current;

      // — climax: the thing wearing g's face looks out THROUGH the tube.
      //   Just the eyes, small and centered, with a faint red glow around
      //   them — the CRT shader curves/scanlines it so it reads as in-screen.
      if (face) {
        ctx.fillStyle = '#040404';
        ctx.fillRect(0, 0, W, H);
        // faint glow behind the eyes
        const glow = ctx.createRadialGradient(W / 2, H / 2 - 6, 24, W / 2, H / 2, 230);
        glow.addColorStop(0, 'rgba(80,22,22,0.55)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);

        const cy = H / 2 - 6;
        const sep = 72;
        // slow, unsettling glance
        const gx = Math.sin(t * 0.7) * 6;
        const gy = Math.sin(t * 0.5 + 1) * 3;
        const eye = (cx) => {
          ctx.fillStyle = '#efefe6';
          ctx.beginPath();
          ctx.ellipse(cx, cy, 48, 31, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#070707';
          ctx.beginPath();
          ctx.arc(cx + gx, cy + 2 + gy, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ff2626';
          ctx.beginPath();
          ctx.arc(cx + gx, cy + 2 + gy, 4.5, 0, Math.PI * 2);
          ctx.fill();
        };
        eye(W / 2 - sep);
        eye(W / 2 + sep);
        texture.needsUpdate = true;
        return;
      }

      // — climax: the CRT slams to the EVILCORP corporate logo (callback to
      //   the VHS intro's ident) —
      if (logo) {
        ctx.fillStyle = '#050000';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#c81616';
        ctx.lineWidth = 4;
        ctx.strokeRect(W / 2 - 210, H / 2 - 78, 420, 150);
        ctx.fillStyle = '#c81616';
        ctx.font = 'bold 60px Georgia, "Times New Roman", serif';
        ctx.fillText('EVILCORP', W / 2, H / 2 - 22);
        ctx.fillStyle = '#8f8f8f';
        ctx.font = '17px "Courier New", monospace';
        ctx.fillText('ASSET RECOVERY DIVISION', W / 2, H / 2 + 22);
        if (Math.floor(t * 2) % 2 === 0) {
          ctx.fillStyle = '#e8e8e8';
          ctx.font = 'bold 20px "Courier New", monospace';
          ctx.fillText('SUBJECT 002 — ACQUIRED', W / 2, H / 2 + 96);
        }
        texture.needsUpdate = true;
        return;
      }

      // — easter egg: turning the knob flips to channel 3 —
      if (channel3) {
        ctx.fillStyle = '#020202';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#d8d8d8';
        ctx.font = 'bold 30px "Courier New", monospace';
        ctx.fillText('CH 3', W / 2, H / 2 - 90);
        if (Math.floor(t * 3) % 3 !== 0) {
          ctx.font = 'bold 26px "Courier New", monospace';
          ctx.fillText('DO NOT ADJUST YOUR SET', W / 2, H / 2 - 20);
        }
        // the eye
        ctx.strokeStyle = '#c81616';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(W / 2, H / 2 + 70, 70, 34, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#c81616';
        ctx.beginPath();
        ctx.arc(W / 2, H / 2 + 70, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8f8f8f';
        ctx.font = '15px "Courier New", monospace';
        ctx.fillText('the tower hums a number', W / 2, H - 60);
        texture.needsUpdate = true;
        return;
      }

      // After the intro finishes (while the camera zooms) the tape loops
      // its final "ENTERING SYSTEM" frame.
      const time = looping ? Math.min(t, INTRO_DURATION) : t;

      ctx.fillStyle = '#020202';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // VCR OSD overlay, present the whole time
      ctx.save();
      ctx.textAlign = 'left';
      ctx.fillStyle = '#e8e8e8';
      ctx.font = 'bold 26px "Courier New", monospace';
      if (time < 1.6) {
        ctx.fillText('▶ PLAY', 36, 48);
      }
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.fillText('SP 0:00:' + String(Math.floor(time)).padStart(2, '0'), 36, H - 36);
      ctx.restore();

      if (time < 1.6) {
        // — phase A: tracking garbage / blue lead-in —
        if (time > 0.7) {
          ctx.fillStyle = '#0000a8';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#e8e8e8';
          ctx.font = 'bold 22px "Courier New", monospace';
          ctx.fillText('TRACKING . . .', W / 2, H / 2);
        }
      } else if (time < 4.2) {
        // — phase B: the evil-corp ident —
        const k = Math.min((time - 1.6) / 0.5, 1); // fade in
        ctx.globalAlpha = k;

        ctx.strokeStyle = '#8a0f0f';
        ctx.lineWidth = 3;
        ctx.strokeRect(W / 2 - 190, H / 2 - 96, 380, 128);

        ctx.fillStyle = '#c81616';
        ctx.font = 'bold 52px Georgia, "Times New Roman", serif';
        ctx.fillText('GHEAT', W / 2, H / 2 - 56);
        ctx.font = 'bold 26px Georgia, "Times New Roman", serif';
        ctx.fillText('CORPORATION', W / 2, H / 2 - 10);

        ctx.fillStyle = '#8f8f8f';
        ctx.font = '16px "Courier New", monospace';
        drawCenteredLines(
          ctx,
          [
            { text: 'A  D I V I S I O N  O F  E V I L  C O R P' },
            { text: '© 1987 HOME ENTERTAINMENT SYSTEMS' },
          ],
          H / 2 + 66,
          26
        );
        ctx.globalAlpha = 1;
      } else if (time < 7.0) {
        // — phase C: GHEAT.NET loading —
        const k = (time - 4.2) / 2.8;

        ctx.fillStyle = '#d8d8d8';
        ctx.font = 'bold 68px "Courier New", monospace';
        ctx.fillText('GHEAT.NET', W / 2, H / 2 - 60);

        ctx.fillStyle = '#8f8f8f';
        ctx.font = '17px "Courier New", monospace';
        ctx.fillText('AUTHORIZED PERSONNEL ONLY', W / 2, H / 2 - 6);

        // chunky loading bar
        const bw = 360;
        const bx = W / 2 - bw / 2;
        const by = H / 2 + 40;
        ctx.strokeStyle = '#d8d8d8';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, 26);
        const cells = 18;
        const filled = Math.floor(Math.min(k * 1.15, 1) * cells);
        ctx.fillStyle = '#c81616';
        for (let i = 0; i < filled; i++) {
          ctx.fillRect(bx + 4 + i * (bw - 8) / cells, by + 4, (bw - 8) / cells - 3, 18);
        }

        ctx.fillStyle = '#8f8f8f';
        ctx.font = '15px "Courier New", monospace';
        ctx.fillText(
          'LOADING SYSTEM TAPE ' + String(Math.floor(Math.min(k, 1) * 100)).padStart(3, ' ') + '%',
          W / 2,
          by + 58
        );
      } else {
        // — phase D: signal locked, entering system —
        ctx.fillStyle = '#d8d8d8';
        ctx.font = 'bold 40px "Courier New", monospace';
        ctx.fillText('SIGNAL LOCKED', W / 2, H / 2 - 30);

        if (Math.floor(time * 2.5) % 2 === 0) {
          ctx.fillStyle = '#c81616';
          ctx.font = 'bold 24px "Courier New", monospace';
          ctx.fillText('▶ ENTERING SYSTEM', W / 2, H / 2 + 34);
        }
      }

      texture.needsUpdate = true;
    };
  }, [canvas, texture]);

  return { texture, draw };
}
