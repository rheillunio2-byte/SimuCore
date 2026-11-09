/* SimuCore — navigation definition, hash router and sidebar rendering. */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {});
  const s = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICONS = {
    overview: s('<rect x="3" y="3" width="7.5" height="9" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="1.5"/><rect x="13.5" y="12" width="7.5" height="9" rx="1.5"/><rect x="3" y="15.5" width="7.5" height="5.5" rx="1.5"/>'),
    library: s('<path d="M4 4.5h4v15H4zM10 4.5h4v15h-4z"/><path d="m16.2 5.6 3.7-1 3.2 14.4-3.7 1z" transform="translate(-2 0)"/>'),
    workspace: s('<path d="M3 5h18v11H3zM8 20h8M12 16v4"/><path d="m6.5 12 3-3 2.5 2 4.5-4"/>'),
    experiments: s('<path d="M9 3h6M10 3v6.5L4.5 19a1.6 1.6 0 0 0 1.4 2.4h12.2a1.6 1.6 0 0 0 1.4-2.4L14 9.5V3"/><path d="M7.5 15h9"/>'),
    docs: s('<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>'),
    settings: s('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  };
  const ITEMS = [
    { route: 'overview', label: 'Overview' }, { route: 'library', label: 'Library' }, { route: 'workspace', label: 'Workspace' },
    { route: 'experiments', label: 'Experiments' }, { route: 'docs', label: 'Documentation' }, { route: 'settings', label: 'Settings' },
  ];

  /** "#/workspace/spring" -> { route: 'workspace', args: ['spring'] } */
  function parse(hash) {
    const parts = String(hash || '').replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    const route = parts[0] || 'overview';
    return { route: ITEMS.some((i) => i.route === route) ? route : null, args: parts.slice(1) };
  }
  function renderSidebar(nav, lastSim) {
    nav.innerHTML = '<div class="nav-label">Laboratory</div>' + ITEMS.map((i) => {
      const href = i.route === 'workspace' ? '#/workspace/' + lastSim : '#/' + i.route;
      return `<a class="nav-item" href="${href}" data-route="${i.route}">${ICONS[i.route]}<span>${i.label}</span></a>`;
    }).join('');
  }
  function setActive(nav, route, lastSim) {
    nav.querySelectorAll('.nav-item').forEach((a) => {
      if (a.dataset.route === route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      if (a.dataset.route === 'workspace') a.setAttribute('href', '#/workspace/' + lastSim);
    });
  }
  SC.navigation = { ITEMS, ICONS, parse, renderSidebar, setActive };
})(typeof globalThis !== 'undefined' ? globalThis : this);
