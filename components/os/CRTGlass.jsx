'use client';

import { useEffect, useState } from 'react';
import { OS_W, OS_H } from '@/lib/osScreen';

// Bends the OS around the tube. DOM can't be warped by CSS transforms, so
// we run the whole surface through an SVG feDisplacementMap whose map
// encodes the same barrel distortion as the tape shader's curve():
//   x' = x * (1 + (y / DIV_X)^2),  y' = y * (1 + (x / DIV_Y)^2)
// Each destination pixel samples the source displaced outward, so edges and
// scanlines bow exactly like the VHS picture does.
//
// Note: SVG filters are visual-only — hit testing stays at layout positions.
// The divisors are tuned so corner drift stays under ~15px, which is well
// inside every clickable target.

const MAP_W = 128; // the field is quadratic; low-res + smoothing is plenty
const MAP_H = 96;
const SCALE = 40; // feDisplacementMap scale => encodable range is ±20px
const DIV_X = 6.0; // smaller = more bend (tape shader uses 3.6 / 3.0)
const DIV_Y = 5.0;

function buildDisplacementMap() {
  const canvas = document.createElement('canvas');
  canvas.width = MAP_W;
  canvas.height = MAP_H;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(MAP_W, MAP_H);
  let i = 0;
  for (let y = 0; y < MAP_H; y++) {
    const ny = (y / (MAP_H - 1)) * 2 - 1;
    for (let x = 0; x < MAP_W; x++) {
      const nx = (x / (MAP_W - 1)) * 2 - 1;
      const dx = nx * (Math.abs(ny) / DIV_X) ** 2 * 0.5 * OS_W;
      const dy = ny * (Math.abs(nx) / DIV_Y) ** 2 * 0.5 * OS_H;
      // feDisplacementMap: offset = SCALE * (channel/255 - 0.5)
      img.data[i++] = Math.max(0, Math.min(255, Math.round(255 * (dx / SCALE + 0.5))));
      img.data[i++] = Math.max(0, Math.min(255, Math.round(255 * (dy / SCALE + 0.5))));
      img.data[i++] = 128;
      img.data[i++] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}

export default function CRTGlass({ children }) {
  // generated client-side; the filter is only attached once the map exists
  // (a dangling filter url() hides the element entirely in some browsers)
  const [map, setMap] = useState(null);
  useEffect(() => {
    setMap(buildDisplacementMap());
  }, []);

  return (
    <>
      {map && (
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
          <defs>
            {/* region clamped to the element box: outside the map the
                displacement defaults to -scale/2 and re-draws edge content
                as a ghost band beyond the glass */}
            <filter
              id="crt-barrel"
              x="0"
              y="0"
              width="100%"
              height="100%"
              colorInterpolationFilters="sRGB"
              primitiveUnits="userSpaceOnUse"
            >
              <feImage
                href={map}
                x="0"
                y="0"
                width={OS_W}
                height={OS_H}
                preserveAspectRatio="none"
                result="map"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={SCALE}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}
      <div
        className="crt-dom-screen"
        style={map ? { filter: 'url(#crt-barrel)' } : undefined}
      >
        {children}
      </div>
    </>
  );
}
