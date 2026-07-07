'use client';

import { useEffect, useState } from 'react';

// GitHub repo viewer — the fetch + render logic ported straight from
// indexold.html (repo meta, file listing, releases, readme), restyled as a
// Win95 document window.

function renderMarkdown(md) {
  md = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  md = md.replace(/^#{3} (.+)$/gm, '<h3>$1</h3>');
  md = md.replace(/^#{2} (.+)$/gm, '<h2>$1</h2>');
  md = md.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  md = md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  md = md.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  md = md.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  md = md.replace(/^---$/gm, '<hr>');
  md = md.replace(/^\* (.+)$/gm, '<li>$1</li>');
  md = md.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>'
  );
  md = md.replace(/\n\n/g, '<br><br>');
  return md;
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function GithubViewer({ href, label }) {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    const match = href.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      setState({ status: 'error', message: 'Could not parse GitHub URL.' });
      return;
    }
    const [, owner, repo] = match;

    (async () => {
      try {
        const [repoRes, treeRes, readmeRes, releasesRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${owner}/${repo}`),
          fetch(`https://api.github.com/repos/${owner}/${repo}/contents/`),
          fetch(`https://api.github.com/repos/${owner}/${repo}/readme`),
          fetch(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=5`),
        ]);
        if (!alive) return;
        if (!repoRes.ok) {
          setState({ status: 'error', message: 'Repo not found or API rate limited.' });
          return;
        }
        const repoData = await repoRes.json();
        const treeData = treeRes.ok ? await treeRes.json() : [];
        const readmeData = readmeRes.ok ? await readmeRes.json() : null;
        const releasesData = releasesRes.ok ? await releasesRes.json() : [];

        const files = [...treeData].sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'dir' ? -1 : 1;
        });

        let readmeHtml = null;
        if (readmeData?.content) {
          readmeHtml = renderMarkdown(atob(readmeData.content.split('\n').join('')));
        }

        setState({ status: 'ok', repo: repoData, files, releases: releasesData, readmeHtml });
      } catch {
        if (alive) {
          setState({ status: 'error', message: 'Failed to load repo. You may be rate limited.' });
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [href]);

  if (state.status === 'loading') {
    return (
      <div className="bevel-field flex h-full items-center justify-center font-term text-[11px]">
        <span className="animate-pulse">Connecting to api.github.com ...</span>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="bevel-field flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
        <div className="text-[24px]">⚠️</div>
        <p className="text-[11px]">{state.message}</p>
        <a href={href} target="_blank" rel="noopener noreferrer" className="w95-btn inline-block">
          <span>Open on GitHub</span>
        </a>
      </div>
    );
  }

  const { repo, files, releases, readmeHtml } = state;

  return (
    <div className="bevel-field os-scroll h-full overflow-auto p-3 select-text">
      {/* header */}
      <div className="mb-1 text-[14px] font-bold">{repo.full_name}</div>
      <p className="mb-2 text-[11px] text-neutral-700">
        {repo.description || 'No description.'}
      </p>
      <div className="mb-2 flex flex-wrap gap-3 font-term text-[10px]">
        <span>⭐ {repo.stargazers_count.toLocaleString()}</span>
        <span>⑂ {repo.forks_count.toLocaleString()}</span>
        <span>◉ {repo.language || 'N/A'}</span>
        <span>⊙ {repo.license?.spdx_id || 'None'}</span>
      </div>
      {(repo.topics || []).length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {repo.topics.map((t) => (
            <span key={t} className="bevel-groove bg-w95-face px-2 py-[1px] text-[10px]">
              {t}
            </span>
          ))}
        </div>
      )}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="w95-btn mb-3 inline-block text-[10px]"
      >
        <span>Open on GitHub ↗</span>
      </a>

      {/* file listing */}
      <div className="mb-1 mt-1 border-b border-neutral-400 pb-[2px] text-[11px] font-bold">
        Files
      </div>
      <div className="mb-3 font-term text-[11px]">
        {files.map((f) => (
          <div key={f.name} className="tree-row">
            <span>{f.type === 'dir' ? '📁' : '📄'}</span>
            <span>{f.name}</span>
          </div>
        ))}
      </div>

      {/* releases */}
      {releases.length > 0 && (
        <>
          <div className="mb-1 border-b border-neutral-400 pb-[2px] text-[11px] font-bold">
            Releases
          </div>
          {releases.map((r) => {
            const date = new Date(r.published_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
            const body = r.body
              ? r.body.slice(0, 280) + (r.body.length > 280 ? '...' : '')
              : '';
            return (
              <div key={r.id} className="bevel-groove mb-2 p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-term text-[11px] font-bold">{r.tag_name}</span>
                  <span className="flex-1 text-[11px] font-bold">{r.name || r.tag_name}</span>
                  {r.prerelease && (
                    <span className="bevel-groove px-1 text-[9px]">pre-release</span>
                  )}
                  {r.draft && <span className="bevel-groove px-1 text-[9px]">draft</span>}
                  <span className="font-term text-[10px] text-neutral-600">{date}</span>
                </div>
                {body && (
                  <div
                    className="mt-1 text-[10.5px] leading-relaxed text-neutral-700"
                    dangerouslySetInnerHTML={{ __html: esc(body) }}
                  />
                )}
                {(r.assets || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.assets.map((a) => (
                      <a
                        key={a.id}
                        href={a.browser_download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w95-btn !px-2 !py-[1px] text-[10px]"
                      >
                        <span>⭳ {a.name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* readme */}
      {readmeHtml && (
        <>
          <div className="mb-1 border-b border-neutral-400 pb-[2px] text-[11px] font-bold">
            README
          </div>
          <div
            className="gh-readme-body text-[11px] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: readmeHtml }}
          />
        </>
      )}
    </div>
  );
}
