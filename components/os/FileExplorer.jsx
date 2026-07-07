'use client';

import { useState } from 'react';
import { TREE } from '@/lib/content';
import { useWM } from './WindowManager';
import { flashSpaceshipsScare } from '@/lib/story';
import { sfx } from '@/lib/sfx';

// The classic Explorer tree, ported from the old <details> markup.
//  - link  → navigates (same-origin static pages like /assets/museum)
//  - gh    → opens the GithubViewer window
//  - ss    → opens the Shredsauce window
function TreeNode({ node, depth, onWarp }) {
  const [open, setOpen] = useState(depth < 2);
  const { openWindow } = useWM();
  const pad = { paddingLeft: depth * 16 + 4 };

  if (node.type === 'dir') {
    return (
      <div>
        <div
          className="tree-row cursor-pointer"
          style={pad}
          onClick={() => {
            sfx.click();
            setOpen((o) => !o);
          }}
        >
          <span className="w-[10px] text-[9px]">{open ? '−' : '+'}</span>
          <span>{open ? '📂' : '📁'}</span>
          <span className="font-bold">{node.name}</span>
        </div>
        {open &&
          node.children.map((c, i) => (
            <TreeNode key={i} node={c} depth={depth + 1} onWarp={onWarp} />
          ))}
      </div>
    );
  }

  if (node.type === 'warp') {
    return (
      <div className="tree-row cursor-pointer" style={pad} onClick={() => onWarp?.()}>
        <span className="w-[10px]" />
        <span>🚀</span>
        <span className="os-link font-bold">{node.name}</span>
      </div>
    );
  }

  if (node.type === 'gh') {
    return (
      <div
        className="tree-row cursor-pointer"
        style={pad}
        onClick={() =>
          openWindow({
            kind: 'github',
            title: `${node.name} - GitHub Viewer`,
            props: { href: node.href, label: node.name, singletonKey: node.href },
            w: 560,
            h: 480,
          })
        }
      >
        <span className="w-[10px]" />
        <span>🐙</span>
        <span className="os-link">{node.name}</span>
      </div>
    );
  }

  if (node.type === 'ss') {
    return (
      <div
        className="tree-row cursor-pointer"
        style={pad}
        onClick={() =>
          openWindow({
            kind: 'shredsauce',
            title: `C:\\shredsauce\\${node.name}`,
            props: { page: node.name, singletonKey: `ss-${node.name}` },
            w: 540,
            h: 460,
          })
        }
      >
        <span className="w-[10px]" />
        <span>📄</span>
        <span className="os-link">{node.name}</span>
      </div>
    );
  }

  // Spaceships is a real, working project — but opening it blips a keylogger
  // SQLite error across the CRT for a few frames. The project still opens
  // normally in a new tab; the scare never blocks it. "wait, that..."
  if (node.scare) {
    return (
      <div className="tree-row" style={pad}>
        <span className="w-[10px]" />
        <span>🚀</span>
        <a
          href={node.href}
          target="_blank"
          rel="noopener noreferrer"
          className="os-link"
          onClick={() => {
            flashSpaceshipsScare();
            // eslint-disable-next-line no-console
            console.log(
              '%cWAIT — /var/evilcorp/keylog.db? ...it opened the project fine though.',
              'color:#ff3b3b;font-family:monospace'
            );
          }}
        >
          {node.name}
        </a>
      </div>
    );
  }

  // plain same-origin link
  return (
    <div className="tree-row" style={pad}>
      <span className="w-[10px]" />
      <span>📄</span>
      <a href={node.href} className="os-link">
        {node.name}
      </a>
    </div>
  );
}

export default function FileExplorer({ onWarp }) {
  return (
    <div className="flex h-full flex-col">
      {/* toolbar */}
      <div className="bevel-groove flex items-center gap-1 px-1 py-[3px]">
        {['Back', 'Fwd', 'Up'].map((b) => (
          <button key={b} className="w95-btn !px-2 !py-[1px] text-[10px]">
            <span>{b}</span>
          </button>
        ))}
        <div className="bevel-field ml-2 flex-1 px-2 py-[2px] text-[11px]">
          C:\home\
        </div>
      </div>
      <div className="bevel-field os-scroll mt-[2px] flex-1 overflow-auto p-1 select-none">
        <TreeNode node={TREE} depth={0} onWarp={onWarp} />
      </div>
    </div>
  );
}
