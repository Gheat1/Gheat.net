'use client';

// ============================================================================
//  REAL device/network intel — the "grabify" layer.
// ----------------------------------------------------------------------------
//  Honest note: a browser CANNOT read your OS hostname ("gheat@ArchZ"). That's
//  a hard security boundary — no website can cross it, and IP loggers don't get
//  it either. What we CAN grab (and what actually makes trackers unsettling,
//  because it's true):
//    * public IP + city/region/country + ISP  (keyless HTTPS geo-IP)
//    * GPU model                               (WebGL UNMASKED_RENDERER)
//    * OS / platform / CPU cores / screen / timezone / language  (navigator)
//  We assemble a hostname-style tag from real signals and surface the raw
//  intel to the surveillance dashboard.
// ============================================================================

// Strip possessive + device-type filler: "Gheat's Laptop" -> "GHEAT".
export function cleanName(raw) {
  if (!raw) return '';
  let s = String(raw).trim();
  s = s.replace(/['’]s\b/gi, ''); // possessive
  s = s.replace(
    /\b(macbook\s*pro|macbook\s*air|macbook|laptop|desktop|computer|machine|imac|iphone|ipad|ipod|phone|tablet|pc|notebook)\b/gi,
    ''
  );
  s = s.replace(/[^a-z0-9]+/gi, ' ').trim();
  s = s.replace(/\s+/g, '-');
  return s.toUpperCase();
}

function detectOS() {
  if (typeof navigator === 'undefined') return 'UNKNOWN';
  const ua = navigator.userAgent || '';
  if (/windows nt 10/i.test(ua)) return 'Windows';
  if (/windows/i.test(ua)) return 'Windows';
  if (/mac os x/i.test(ua)) return 'macOS';
  if (/android/i.test(ua)) return 'Android';
  if (/(iphone|ipad|ipod)/i.test(ua)) return 'iOS';
  if (/cros/i.test(ua)) return 'ChromeOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'UNKNOWN';
}

// WebGL renderer string — usually the literal GPU, e.g.
// "ANGLE (NVIDIA GeForce RTX 3070 ...)" or "AMD Radeon ...".
function detectGPU() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    if (!gl) return null;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const raw = ext
      ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);
    if (!raw) return null;
    // tidy "ANGLE (Vendor, GeForce RTX 3070 Direct3D11 ...)" down to the model
    let s = String(raw);
    const m = s.match(/\(([^)]+)\)/);
    if (m) s = m[1];
    s = s.replace(/Direct3D.*$/i, '').replace(/vs_\d.*$/i, '').replace(/,/g, ' ');
    return s.trim().slice(0, 40) || null;
  } catch {
    return null;
  }
}

// a stable per-browser short id (fingerprint hash), so the tag is consistent
function stableId() {
  try {
    let id = localStorage.getItem('gheat_host_id');
    if (!id) {
      const seed =
        (navigator.userAgent || '') +
        (navigator.language || '') +
        (screen?.width || '') +
        'x' +
        (screen?.height || '') +
        (navigator.hardwareConcurrency || '');
      let h = 0;
      for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
      id = Math.abs(h).toString(36).toUpperCase().slice(0, 5);
      localStorage.setItem('gheat_host_id', id);
    }
    return id;
  } catch {
    return 'NODE';
  }
}

// synchronous, always-available provisional intel (no network)
export function localIntel() {
  const os = detectOS();
  return {
    os,
    gpu: detectGPU(),
    platform: (typeof navigator !== 'undefined' && navigator.platform) || 'UNKNOWN',
    cores: (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || null,
    screen:
      typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : null,
    lang: (typeof navigator !== 'undefined' && navigator.language) || null,
    tz: (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        return null;
      }
    })(),
    ip: null,
    city: null,
    region: null,
    country: null,
    isp: null,
    id: stableId(),
  };
}

// build the hostname-style tag from the best real signal available, cleaned
export function buildHostname(intel) {
  const os = cleanName(intel.os || 'UNKNOWN');
  // prefer a real ISP-domain-derived tag if we have one, else OS + stable id
  if (intel.isp) {
    const ispTag = cleanName(intel.isp.split(/\s+/)[0]); // first ISP word
    if (ispTag) return `${os || 'HOST'}-${ispTag}`.slice(0, 24);
  }
  return `${os || 'HOST'}-${intel.id || 'NODE'}`;
}

// a stable canvas-render fingerprint hash (differs per GPU/driver/font stack)
function canvasHash() {
  try {
    const c = document.createElement('canvas');
    c.width = 240;
    c.height = 60;
    const g = c.getContext('2d');
    g.textBaseline = 'top';
    g.font = "14px 'Arial'";
    g.fillStyle = '#f60';
    g.fillRect(2, 2, 120, 20);
    g.fillStyle = '#069';
    g.fillText('gheat.net ⌗ EVILCORP', 4, 4);
    g.fillStyle = 'rgba(102,204,0,0.7)';
    g.fillText('gheat.net ⌗ EVILCORP', 6, 6);
    const data = c.toDataURL();
    let h = 0;
    for (let i = 0; i < data.length; i++) h = (Math.imul(31, h) + data.charCodeAt(i)) | 0;
    return Math.abs(h).toString(16).toUpperCase().padStart(8, '0').slice(0, 8);
  } catch {
    return null;
  }
}

// Everything else grabbable WITHOUT a native permission prompt: high-entropy
// UA (real CPU arch / OS version / device model on Chromium), RAM, battery,
// disk quota, network type, attached cameras/mics, screen depth, canvas fp.
// Gated behind the consent modal.
// race any promise against a timeout so a hanging device API can't stall the
// whole grab (some browsers never resolve getBattery / enumerateDevices)
function withTimeout(p, ms) {
  return Promise.race([p, new Promise((r) => setTimeout(() => r(null), ms))]);
}

export async function collectDeepIntel(base) {
  const intel = { ...(base || localIntel()) };

  // User-Agent Client Hints — the real hardware/OS detail (Chromium only)
  try {
    if (navigator.userAgentData?.getHighEntropyValues) {
      const h = await withTimeout(
        navigator.userAgentData.getHighEntropyValues([
          'architecture', 'bitness', 'model', 'platformVersion', 'uaFullVersion', 'fullVersionList',
        ]),
        2500
      );
      if (h) {
        intel.arch = h.architecture
          ? `${h.architecture}${h.bitness ? '/' + h.bitness + 'bit' : ''}`
          : null;
        intel.model = h.model || null;
        intel.osVersion = h.platformVersion || null;
        const list = h.fullVersionList || [];
        intel.browser =
          list
            .filter((b) => !/not.?a.?brand/i.test(b.brand))
            .map((b) => `${b.brand} ${b.version}`)
            .join(', ') ||
          h.uaFullVersion ||
          null;
      }
    }
  } catch {}

  intel.deviceMemory = navigator.deviceMemory || null; // GB (coarse)
  intel.cores = navigator.hardwareConcurrency || intel.cores;
  intel.touch = navigator.maxTouchPoints || 0;
  intel.colorDepth = typeof screen !== 'undefined' ? screen.colorDepth : null;
  intel.pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : null;
  intel.langs =
    typeof navigator !== 'undefined' && navigator.languages
      ? navigator.languages.join(', ')
      : intel.lang;
  intel.cookies = typeof navigator !== 'undefined' ? navigator.cookieEnabled : null;
  intel.canvasFp = canvasHash();

  // network conditions
  try {
    const c = navigator.connection;
    if (c) {
      intel.netType = c.effectiveType || null;
      intel.downlink = c.downlink || null;
      intel.rtt = typeof c.rtt === 'number' ? c.rtt : null;
    }
  } catch {}

  // battery
  try {
    if (navigator.getBattery) {
      const b = await withTimeout(navigator.getBattery(), 2000);
      if (b) {
        intel.battery = Math.round(b.level * 100);
        intel.charging = b.charging;
      }
    }
  } catch {}

  // disk / storage quota
  try {
    if (navigator.storage?.estimate) {
      const e = await withTimeout(navigator.storage.estimate(), 2000);
      if (e) {
        intel.storageQuota = e.quota ? Math.round(e.quota / 1073741824) : null; // GB
        intel.storageUsed = e.usage ? +(e.usage / 1048576).toFixed(1) : null; // MB
      }
    }
  } catch {}

  // attached capture hardware (counts only — labels need explicit permission)
  try {
    if (navigator.mediaDevices?.enumerateDevices) {
      const d = await withTimeout(navigator.mediaDevices.enumerateDevices(), 2000);
      if (d) {
        intel.cams = d.filter((x) => x.kind === 'videoinput').length;
        intel.mics = d.filter((x) => x.kind === 'audioinput').length;
      }
    }
  } catch {}

  return intel;
}

// Precise geolocation — fires the browser's native permission prompt. Resolves
// with just the location patch ({} on denial/unsupported) so it can be merged
// independently of the heavier hardware grab.
export function collectPreciseLocation() {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({});
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: +pos.coords.latitude.toFixed(4),
          lon: +pos.coords.longitude.toFixed(4),
          accuracy: Math.round(pos.coords.accuracy),
        });
      },
      () => resolve({}),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

// async enrichment: real public IP + geo + ISP via a keyless HTTPS endpoint.
// Fails silent (returns local-only intel) if offline/blocked.
export async function collectIntel() {
  const intel = localIntel();
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 3500);
    // ipwho.is: free, HTTPS, no key, permissive CORS
    const res = await fetch('https://ipwho.is/', {
      cache: 'no-store',
      signal: ctrl.signal,
    });
    clearTimeout(to);
    const j = await res.json();
    if (j && j.success !== false) {
      intel.ip = j.ip || null;
      intel.city = j.city || null;
      intel.region = j.region || null;
      intel.country = j.country || null;
      intel.isp = j.connection?.isp || j.connection?.org || j.connection?.domain || null;
    }
  } catch {
    // offline or blocked — local intel still stands
  }
  return intel;
}
