// Boomhill Open Assets 뷰어: 정적 파일만으로 돈다(GitHub Pages 의 저장소 루트에서 그대로 연다).
// games/index.json(게임 목록) → 게임별 묶음 색인 → 시트 PNG + 아틀라스 JSON.
// 두 형식을 읽는다: boomhill(기본), bnb(모든 그림에 아틀라스가 있고 묶음이 assets/ 아래에 있다).
// 게임에 models{base, categories} 가 있으면 3D 분류도 옆 목록에 싣는다. 모델 보기는 viewer/model.js(모듈)를 처음 고를 때 부른다.
// window.BOOMHILL_VIEWER_EXT 가 있으면 그 확장의 훅(loadGame, filter, decorateCell, detailExtras, onKey, ready)을 부른다.
(function () {
  'use strict';

  const CHUNK = 240;
  const $ = (id) => document.getElementById(id);
  const ext = () => window.BOOMHILL_VIEWER_EXT || null;
  const state = {
    site: null, game: null, group: null, assets: [], shown: [], rendered: 0,
    filter: '', selected: null, indexCache: new Map(), atlasCache: new Map(), player: null,
    kind: 'image', view: null, modelIndex: new Map(),
  };

  // ── 공통 ──────────────────────────────────────────────────────────────
  async function getJSON(path) {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(path + ' → HTTP ' + res.status);
    return res.json();
  }
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    return el;
  }
  const fmt = (n) => Number(n || 0).toLocaleString('ko-KR');
  const mb = (b) => (b / 1048576).toFixed(b > 10 * 1048576 ? 0 : 1) + 'MB';
  const enc = (s) => encodeURIComponent(s);

  // 경로: 게임마다 base 가 다르다(bnb 는 assets/ 아래).
  const groupDir = (game, gid) => game.base + gid + '/';
  const sheetUrl = (game, gid, a) => groupDir(game, gid) + a.id + '.' + (a.ext || 'png');
  const atlasUrl = (game, gid, a) => groupDir(game, gid) + a.id + '.json';
  const hasAtlas = (game, a) => game.format === 'bnb' || !!a.atlas;

  async function groupIndex(game, gid) {
    const key = game.id + '/' + gid;
    if (!state.indexCache.has(key)) state.indexCache.set(key, getJSON(groupDir(game, gid) + 'index.json'));
    return state.indexCache.get(key);
  }
  async function atlas(game, gid, a) {
    const key = game.id + '/' + gid + '/' + a.id;
    if (!hasAtlas(game, a)) {
      return { sheet: { file: a.id + '.' + (a.ext || 'png'), w: a.sheet.w, h: a.sheet.h }, frames: [{ index: 0, x: 0, y: 0, w: a.sheet.w, h: a.sheet.h }], animations: [] };
    }
    if (!state.atlasCache.has(key)) state.atlasCache.set(key, getJSON(atlasUrl(game, gid, a)));
    return state.atlasCache.get(key);
  }

  // 미리보기 한 칸: 첫 프레임만 보이게 시트를 배경으로 잘라 그린다(작으면 3배까지 키운다).
  function framePreview(game, gid, a, box) {
    const r = a.first || { x: 0, y: 0, w: a.sheet.w, h: a.sheet.h };
    const s = Math.min(3, box / Math.max(r.w, 1), box / Math.max(r.h, 1));
    const d = h('div', { class: 'frame', role: 'img', 'aria-label': a.name || a.id });
    d.style.width = Math.max(1, Math.round(r.w * s)) + 'px';
    d.style.height = Math.max(1, Math.round(r.h * s)) + 'px';
    d.style.backgroundSize = Math.round(a.sheet.w * s) + 'px ' + Math.round(a.sheet.h * s) + 'px';
    d.style.backgroundPosition = -Math.round(r.x * s) + 'px ' + -Math.round(r.y * s) + 'px';
    d.dataset.src = sheetUrl(game, gid, a);
    return d;
  }
  // ── 3D 모델 ──────────────────────────────────────────────────────────
  const modelCat = (game, gid) => (game.models && game.models.categories.find((c) => c.id === gid)) || null;
  const modelUrl = (game, rel) => new URL(rel, new URL(game.models.base, location.href)).href;
  async function modelIndex(game) {
    if (!state.modelIndex.has(game.id)) state.modelIndex.set(game.id, getJSON(modelUrl(game, 'index.json')));
    return state.modelIndex.get(game.id);
  }
  async function modelList(game, gid) {
    const key = game.id + '/' + gid;
    if (!state.indexCache.has(key)) {
      state.indexCache.set(key, modelIndex(game).then((mi) => getJSON(modelUrl(game, mi.categories.find((c) => c.id === gid).list))));
    }
    return state.indexCache.get(key);
  }
  function stopModel() { if (state.view) { state.view.unmount(); state.view = null; } }
  // 묶음이나 게임을 옮기면 앞에서 고른 자산의 상세(멈춘 3D 화면 포함)를 처음 안내로 되돌린다
  const detailHint = $('detail').innerHTML;
  function clearDetail() {
    stopPlayer();
    stopModel();
    state.selected = null;
    $('detail').classList.remove('open', 'wide');
    $('detail').innerHTML = detailHint;
  }

  const lazy = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const d = e.target;
      d.style.backgroundImage = 'url("' + d.dataset.src + '")';
      lazy.unobserve(d);
    }
  }, { rootMargin: '400px' });

  // ── 라우팅 ────────────────────────────────────────────────────────────
  function parseHash() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    if (parts[0] !== 'g') return { home: true };
    return { game: parts[1], group: parts[2], id: parts.slice(3).join('/') || null };
  }
  function setHash(game, group, id, replace) {
    const next = '#/g/' + [game, group, id].filter(Boolean).map(enc).join('/');
    if (location.hash === next) return;
    if (replace) history.replaceState(null, '', next); else location.hash = next;
  }
  async function route() {
    const r = parseHash();
    if (r.home || !state.site.games.some((g) => g.id === r.game && !g.pending)) return showHome();
    await openGame(state.site.games.find((g) => g.id === r.game), r.group, r.id);
  }

  // ── 처음 화면 ─────────────────────────────────────────────────────────
  function showHome() {
    document.body.removeAttribute('data-game');
    $('home').hidden = false;
    $('browser').hidden = true;
    renderTabs(null);
    // 카드에는 게임 이름과 그림만 둔다. 준비 중인 게임만 표시를 남긴다
    $('gameCards').replaceChildren(...state.site.games.map((g) => {
      const card = h(g.pending ? 'div' : 'a', { class: 'card' + (g.pending ? ' pending' : ''), href: g.pending ? null : '#/g/' + enc(g.id), 'data-game': g.id },
        h('div', { class: 'cover', 'aria-hidden': 'true' }),
        h('h3', { text: g.title }), h('p', { class: 'en', text: g.title_en || '' }),
        h('p', { class: 'about', text: g.about || '' }),
        h('div', { class: 'peek' }),
        g.pending ? h('span', { class: 'stat', text: '준비 중' }) : null);
      if (!g.pending) { fillCover(g, card.querySelector('.cover')); fillPeek(g, card.querySelector('.peek')); }
      return card;
    }));
  }
  // 카드 위쪽 대표 그림: 다섯 게임에 같은 세 친구(다오, 배찌, 디지니)를 그 게임의 그림체로 세운다.
  // 3D 가 있는 게임은 캐릭터 분류의 기본 모델 썸네일, 크레이지아케이드는 세계관 페이지와 같은 2D 얼굴(lore/faces/bnb-<슬롯>.png).
  // 기본 모델이 없는 친구는 다른 기본 모델로 채운다(어드벤처는 디지니가 dizini_default)
  const CAST = [/^(dao)(__default|_default)?$/i, /^(bazzi)(__default|_default)?$/i, /^(dizni|dizini)(__default|_default)?$/i];
  const BNB_FACES = ['C00', 'C06', 'C01'];
  async function fillCover(game, box) {
    try {
      let srcs = [];
      if (game.id === 'bnb') srcs = BNB_FACES.map((s) => ({ src: 'lore/faces/bnb-' + s + '.png', pixel: true }));
      else if (game.models) {
        const base = game.models.base;
        const top = await (await fetch(base + 'index.json')).json();
        const cat = top.categories.find((c) => c.id === '3d_character');
        if (!cat) return;
        const items = (await (await fetch(base + cat.list)).json()).items.filter((i) => i.thumb);
        const picked = CAST.map((re) => items.find((i) => re.test(i.id)));
        const spare = items.filter((i) => /(__default|_default)$/i.test(i.id) && !picked.includes(i));
        srcs = picked.map((i) => i || spare.shift()).filter(Boolean).map((i) => ({ src: base + i.thumb }));
      }
      box.replaceChildren(...srcs.map((f) => h('img', { src: f.src, alt: '', loading: 'lazy', class: f.pixel ? 'pixel' : null })));
    } catch { /* 대표 그림이 없으면 빈 칸으로 둔다 */ }
  }
  // 미리보기 네 칸은 알아보기 쉬운 묶음(아이템, 아이콘, 상점)에서 고른다. UI 묶음은 버튼 조각, 막대가 많아 무엇인지 알기 어렵다
  async function fillPeek(game, box) {
    try {
      const gid = (game.groups.find((x) => /item|icon|shop/.test(x.id)) || game.groups[0]).id;
      const idx = await groupIndex(game, gid);
      const pool = idx.assets.filter((a) => {
        const w = a.first ? a.first.w : a.sheet.w, hh = a.first ? a.first.h : a.sheet.h;
        return w >= 24 && hh >= 24 && w / hh < 2 && hh / w < 2;   // 너무 가늘고 긴 조각은 빼고 네모난 그림만
      });
      const picks = [0.13, 0.41, 0.67, 0.89].map((p) => pool[Math.floor(p * pool.length)]).filter(Boolean);
      box.replaceChildren(...picks.map((a) => {
        const span = h('span', {});
        span.append(framePreview(game, gid, a, 50));
        lazy.observe(span.firstChild);
        return span;
      }));
    } catch { /* 미리보기 실패는 카드만 비운다 */ }
  }
  function renderTabs(active) {
    $('tabs').replaceChildren(...state.site.games.filter((g) => !g.pending).map((g) => h('a', {
      class: 'tab', href: '#/g/' + enc(g.id), 'aria-current': g.id === active ? 'page' : null, 'data-game': g.id,
    }, g.title)), h('a', { class: 'tab', href: 'lore/' }, '통합세계관'));   // 게임 탭 뒤에 통합세계관(viewer/gnb.js 와 같은 꼴)
    // 탭 줄이 가로로 밀리는 좁은 화면에서 고른 게임 탭이 화면 밖에 남지 않게
    $('tabs').querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  // ── 게임, 묶음 ───────────────────────────────────────────────────────
  async function openGame(game, gid, id) {
    $('home').hidden = true;
    $('browser').hidden = false;
    document.body.setAttribute('data-game', game.id);
    renderTabs(game.id);
    if (state.game !== game) {
      state.game = game;
      state.group = null;
      $('gameTitle').textContent = game.title;
      $('gameAbout').textContent = game.about || '';
      if (ext() && ext().loadGame) await ext().loadGame(game);
      const link = (g) => h('a', { class: 'group', href: '#/g/' + enc(game.id) + '/' + enc(g.id), 'data-id': g.id },
        h('span', { text: g.title || g.id }), h('span', { class: 'n', text: fmt(g.count) }));
      $('groups').replaceChildren(...(game.models ? [h('p', { class: 'groups-head', text: '2D 그림' })] : []), ...game.groups.map(link),
        ...(game.models ? [h('p', { class: 'groups-head', text: '3D 모델' }), ...game.models.categories.map(link)] : []));
    }
    const mcat = modelCat(game, gid);
    const target = mcat || game.groups.find((g) => g.id === gid) || game.groups[0];
    if (state.group !== target.id) {
      state.group = target.id;
      clearDetail();
      for (const a of $('groups').querySelectorAll('.group')) a.setAttribute('aria-current', a.dataset.id === target.id ? 'page' : 'false');
      $('grid').replaceChildren(h('p', { class: 'empty-msg', text: '목록을 읽는 중…' }));
      let list;
      try {
        list = mcat ? (await modelList(game, target.id)).items : (await groupIndex(game, target.id)).assets;
      } catch (e) {
        if (state.group === target.id) $('grid').replaceChildren(h('p', { class: 'empty-msg', text: '목록을 읽지 못했습니다: ' + e.message }));
        return;
      }
      if (state.group !== target.id) return;
      state.kind = mcat ? 'model' : 'image';
      document.body.dataset.kind = state.kind;
      state.assets = list;
      applyFilter();
      if (!gid) setHash(game.id, target.id, null, true);
    }
    if (id) {
      const a = state.assets.find((x) => x.id === id);
      if (a && (!state.selected || state.selected.id !== a.id)) select(a, false);
    }
  }

  function applyFilter() {
    const terms = state.filter.toLowerCase().split(/\s+/).filter(Boolean);
    const g = state.game;
    const keep = ext() && ext().filter;
    state.shown = state.assets.filter((a) => {
      if (keep && !keep(g, a)) return false;
      if (!terms.length) return true;
      const hay = (a.id + ' ' + (a.name || '') + ' ' + (a.label || '') + ' ' + (a.tags || []).join(' ')).toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
    state.rendered = 0;
    $('grid').replaceChildren();
    $('count').textContent = fmt(state.shown.length) + ' / ' + fmt(state.assets.length);
    if (!state.shown.length) $('grid').append(h('p', { class: 'empty-msg', text: state.kind === 'model' ? '조건에 맞는 모델이 없습니다.' : '조건에 맞는 그림이 없습니다.' }));
    renderMore();
  }

  function renderMore() {
    const g = state.game;
    const end = Math.min(state.shown.length, state.rendered + CHUNK);
    const frag = document.createDocumentFragment();
    for (let i = state.rendered; i < end; i++) {
      const a = state.shown[i];
      if (state.kind === 'model') { frag.append(modelCell(g, a, i)); continue; }
      const thumb = h('div', { class: 'thumb checker' }, framePreview(g, state.group, a, 92));
      const cell = h('button', { type: 'button', class: 'cell', 'data-i': i, 'aria-selected': state.selected && state.selected.id === a.id ? 'true' : 'false', title: a.name || a.id },
        thumb, h('span', { class: 'nm', text: (a.name || a.id).split('/').pop() }),
        h('span', { class: 'badges' }, a.frames > 1 ? h('span', { class: 'badge', text: '×' + a.frames }) : null));
      cell.addEventListener('click', () => select(a, true));
      if (ext() && ext().decorateCell) ext().decorateCell(cell, g, a);
      frag.append(cell);
      lazy.observe(thumb.firstChild);
    }
    $('grid').append(frag);
    state.rendered = end;
  }
  function modelCell(g, a, i) {
    const thumb = h('div', { class: 'thumb m3d-thumb' },
      a.thumb ? h('img', { src: modelUrl(g, a.thumb), alt: '', loading: 'lazy', decoding: 'async' }) : h('span', { class: 'glyph', text: '3D' }));
    const clips = a.stats && a.stats.animations;
    const cell = h('button', { type: 'button', class: 'cell', 'data-i': i, 'aria-selected': state.selected && state.selected.id === a.id ? 'true' : 'false', title: a.name },
      thumb, h('span', { class: 'nm', text: a.label || a.name.split('/').pop() }),
      h('span', { class: 'badges' }, clips ? h('span', { class: 'badge', text: '▶' + fmt(clips) }) : null));
    cell.addEventListener('click', () => select(a, true));
    if (ext() && ext().decorateCell) ext().decorateCell(cell, g, a);
    return cell;
  }

  new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting) && state.rendered < state.shown.length) renderMore();
  }, { rootMargin: '600px' }).observe($('sentinel'));

  // ── 상세 ──────────────────────────────────────────────────────────────
  async function select(a, push) {
    const g = state.game;
    const gid = state.group;
    state.selected = a;
    for (const c of $('grid').querySelectorAll('.cell[aria-selected="true"]')) c.setAttribute('aria-selected', 'false');
    const cell = $('grid').querySelector('.cell[data-i="' + state.shown.indexOf(a) + '"]');
    if (cell) { cell.setAttribute('aria-selected', 'true'); cell.scrollIntoView({ block: 'nearest' }); }
    if (push) setHash(g.id, gid, a.id, true);
    stopPlayer();
    if (state.kind === 'model') return renderModel(g, gid, a);
    stopModel();
    const d = $('detail');
    d.replaceChildren(h('p', { class: 'hint', text: '읽는 중…' }));
    let at;
    try { at = await atlas(g, gid, a); } catch (e) { d.replaceChildren(h('p', { class: 'hint', text: '아틀라스를 읽지 못했습니다: ' + e.message })); return; }
    if (state.selected !== a) return;
    const img = new Image();
    img.decoding = 'async';
    img.src = sheetUrl(g, gid, a);
    try { await img.decode(); } catch { d.replaceChildren(h('p', { class: 'hint', text: '그림을 읽지 못했습니다.' })); return; }
    if (state.selected !== a) return;
    renderDetail(g, gid, a, at, img);
  }

  function renderDetail(g, gid, a, at, img) {
    const d = $('detail');
    const frames = (at.frames || []).filter((f) => !f.empty && f.w && f.h);
    const anims = at.animations || [];
    const multi = frames.length > 1;
    let zoom = Math.max(1, Math.min(8, Math.floor(300 / Math.max(frames[0] ? frames[0].w : a.sheet.w, frames[0] ? frames[0].h : a.sheet.h, 1)) || 1));
    let bg = 'checker';
    let mode = multi ? 'play' : 'sheet';
    const stage = h('div', { class: 'stage checker' });
    const canvas = h('canvas', {});
    const ctx = canvas.getContext('2d');
    let cur = 0;
    const frameLabel = h('span', { class: 'sub' });
    const strip = h('div', { class: 'strip' });

    function draw(fi) {
      const f = frames[fi] || frames[0];
      if (!f) return;
      const box = frames.reduce((m, x) => ({ w: Math.max(m.w, x.w), h: Math.max(m.h, x.h) }), { w: 1, h: 1 });
      canvas.width = box.w * zoom; canvas.height = box.h * zoom;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ox = Math.floor((box.w - f.w) / 2), oy = box.h - f.h;  // 아래 가운데 맞춤(기준점 쓰임이 게임마다 달라 미리보기는 바닥 정렬)
      ctx.drawImage(img, f.x, f.y, f.w, f.h, ox * zoom, oy * zoom, f.w * zoom, f.h * zoom);
      cur = fi;
      for (const b of strip.children) b.setAttribute('aria-pressed', String(Number(b.dataset.i) === fi));
      frameLabel.textContent = '프레임 ' + (fi + 1) + ' / ' + frames.length + (f.role ? ', ' + f.role : '');
    }
    function sheetView() {
      const wrap = h('div', { class: 'sheetwrap' });
      wrap.append(h('img', { src: img.src, alt: a.name || a.id, width: a.sheet.w * zoom, height: a.sheet.h * zoom }));
      if (frames.length > 1 || frames.some((f) => f.w !== a.sheet.w || f.h !== a.sheet.h)) {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('class', 'rects');
        svg.setAttribute('width', a.sheet.w * zoom); svg.setAttribute('height', a.sheet.h * zoom);
        for (const f of frames) {
          const r = document.createElementNS(ns, 'rect');
          Object.entries({ x: f.x * zoom + 0.5, y: f.y * zoom + 0.5, width: f.w * zoom - 1, height: f.h * zoom - 1, fill: 'none', stroke: 'currentColor', 'stroke-width': 1, opacity: 0.8 })
            .forEach(([k, v]) => r.setAttribute(k, v));
          svg.append(r);
        }
        svg.style.color = getComputedStyle(document.body).getPropertyValue('--accent');
        wrap.append(svg);
      }
      return wrap;
    }
    function paint() {
      stage.className = 'stage ' + (bg === 'checker' ? 'checker' : bg === 'dark' ? 'bg-dark' : 'bg-light');
      stage.replaceChildren(mode === 'sheet' ? sheetView() : canvas);
      if (mode !== 'sheet') draw(cur);
      for (const b of zoomSeg.children) b.setAttribute('aria-pressed', String(Number(b.dataset.z) === zoom));
      for (const b of bgSeg.children) b.setAttribute('aria-pressed', String(b.dataset.bg === bg));
      for (const b of modeSeg.children) b.setAttribute('aria-pressed', String(b.dataset.m === mode));
    }
    const seg = (items, attr, on) => h('span', { class: 'seg' }, ...items.map(([v, label]) => {
      const b = h('button', { type: 'button', ['data-' + attr]: v, text: label });
      b.addEventListener('click', () => on(v));
      return b;
    }));
    const zoomSeg = seg([[1, '1×'], [2, '2×'], [4, '4×'], [8, '8×']], 'z', (v) => { zoom = Number(v); paint(); });
    const bgSeg = seg([['checker', '격자'], ['dark', '어둠'], ['light', '밝음']], 'bg', (v) => { bg = v; paint(); });
    const modeSeg = seg(multi ? [['play', '프레임'], ['sheet', '시트']] : [['sheet', '그림']], 'm', (v) => { mode = v; stopPlayer(); paint(); });
    if (multi) {
      frames.slice(0, 240).forEach((f, i) => {
        const c = h('canvas', {});
        const s = Math.min(1, 40 / Math.max(f.w, f.h));
        c.width = Math.max(1, Math.round(f.w * s)); c.height = Math.max(1, Math.round(f.h * s));
        const cx = c.getContext('2d'); cx.imageSmoothingEnabled = false;
        cx.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, c.width, c.height);
        const b = h('button', { type: 'button', 'data-i': i, title: '프레임 ' + (i + 1) }, c);
        b.addEventListener('click', () => { stopPlayer(); mode = 'play'; paint(); draw(i); });
        strip.append(b);
      });
    }

    // 재생: 아틀라스에 애니메이션이 있으면 그 순서와 지연을, 없으면 프레임을 차례로(미리보기 속도).
    const animSel = h('select', { 'aria-label': '애니메이션' });
    anims.forEach((an, i) => animSel.append(h('option', { value: String(i), text: an.name || '애니메이션 ' + (i + 1) })));
    if (multi) animSel.append(h('option', { value: 'all', text: anims.length ? '모든 프레임 차례로' : '모든 프레임 차례로(원본 지연 정보 없음)' }));
    const speed = h('select', { 'aria-label': '미리보기 속도' }, ...[4, 8, 12, 24].map((f) => h('option', { value: String(f), selected: f === 8, text: f + ' fps' })));
    const playBtn = h('button', { type: 'button', text: '재생' });
    playBtn.addEventListener('click', () => {
      if (state.player) { stopPlayer(); playBtn.textContent = '재생'; return; }
      mode = 'play'; paint();
      const sel = animSel.value;
      const byAnim = sel !== 'all' && anims.length;
      const seq = byAnim ? anims[Number(sel)].frames.map((fi) => frames.findIndex((f) => f.index === fi)).filter((x) => x >= 0) : frames.map((_, i) => i);
      const ms = byAnim ? anims[Number(sel)].frame_ms : null;
      const loop = byAnim ? anims[Number(sel)].loop !== false : true;
      let k = 0;
      const step = () => {
        draw(seq[k]);
        const wait = ms && ms[k] != null ? ms[k] : 1000 / Number(speed.value);
        k += 1;
        if (k >= seq.length) { if (!loop) { stopPlayer(); playBtn.textContent = '재생'; return; } k = 0; }
        state.player = setTimeout(step, Math.max(16, wait));
      };
      playBtn.textContent = '멈춤';
      step();
    });

    const dl = h('dl', { class: 'kv' },
      h('dt', { text: 'id' }), h('dd', { text: a.id }),
      h('dt', { text: '묶음' }), h('dd', { text: (g.groups.find((x) => x.id === gid) || {}).title || gid }),
      h('dt', { text: '시트' }), h('dd', { text: a.sheet.w + ' × ' + a.sheet.h + ' px' }),
      h('dt', { text: '프레임' }), h('dd', { text: fmt(frames.length) + (anims.length ? ', 애니메이션 ' + anims.length : '') }),
      frames.some((f) => f.origin) ? [h('dt', { text: '기준점' }), h('dd', { text: '있음(아틀라스 origin)' })] : null);
    const links = h('div', { class: 'row' },
      h('a', { href: img.src, download: a.id + '.' + (a.ext || 'png'), class: 'file', text: 'PNG 내려받기' }),
      hasAtlas(g, a) ? h('a', { href: atlasUrl(g, gid, a), download: a.id + '.json', class: 'file ghost', text: '아틀라스 JSON' }) : null,
      h('button', { type: 'button', class: 'ghost', text: '주소 복사', onclick: () => navigator.clipboard && navigator.clipboard.writeText(location.href) }));
    const close = h('button', { type: 'button', class: 'ghost close', 'aria-label': '상세 닫기', text: '닫기' });
    close.addEventListener('click', () => { stopPlayer(); d.classList.remove('open'); });
    const extra = ext() && ext().detailExtras ? ext().detailExtras(g, gid, a, () => select(a, false)) : [];

    // replaceChildren 는 null 을 "null" 글자로 넣으므로 빈 자리는 미리 걸러 낸다
    d.replaceChildren(...[
      h('div', { class: 'detail-head' }, h('div', {}, h('h3', { text: (a.name || a.id).split('/').pop() }), h('p', { class: 'sub', text: a.name || a.id })), close),
      ...(extra.top || []),
      h('div', { class: 'row' }, modeSeg, zoomSeg, bgSeg),
      stage,
      multi ? h('div', { class: 'row' }, playBtn, animSel, speed, frameLabel) : null,
      multi ? strip : null,
      dl, links,
      ...(extra.bottom || [])].filter(Boolean));
    d.classList.add('open');
    paint();
  }
  function stopPlayer() { if (state.player) { clearTimeout(state.player); state.player = null; } }

  // 3D 상세: 무대, 도구 줄, 동작 줄, 정보, 내려받기. 넓게 보기는 목록 위를 덮는다.
  async function renderModel(g, gid, a) {
    const d = $('detail');
    stopModel();
    const host = h('div', { class: 'm3d-host' });
    const toolbar = h('div', { class: 'm3d-bar' });
    const timeline = h('div', { class: 'm3d-time', hidden: true });
    const cat = modelCat(g, gid);
    const st = a.stats || {};
    const wideLabel = () => (d.classList.contains('wide') ? '좁게 보기' : '넓게 보기');
    const wide = h('button', { type: 'button', class: 'ghost', text: wideLabel() });
    wide.addEventListener('click', () => { d.classList.toggle('wide'); wide.textContent = wideLabel(); });
    const close = h('button', { type: 'button', class: 'ghost close', 'aria-label': '상세 닫기', text: '닫기' });
    close.addEventListener('click', () => { stopModel(); d.classList.remove('open', 'wide'); });
    const dl = h('dl', { class: 'kv' },
      h('dt', { text: 'id' }), h('dd', { text: a.id }),
      h('dt', { text: '분류' }), h('dd', { text: cat ? cat.title : gid }),
      h('dt', { text: '파일' }), h('dd', { text: a.assembly ? '조립(파츠 GLB + 재질, 배치 정보)' : 'GLB, ' + mb(a.bytes || 0) }),
      st.triangles ? [h('dt', { text: '삼각형' }), h('dd', { text: fmt(st.triangles) })] : null,
      st.bones ? [h('dt', { text: '뼈' }), h('dd', { text: fmt(st.bones) })] : null,
      st.animations ? [h('dt', { text: '동작' }), h('dd', { text: fmt(st.animations) + (st.animationsOriginal ? ' (원본 ' + fmt(st.animationsOriginal) + ')' : '') })] : null,
      st.textures ? [h('dt', { text: '텍스처' }), h('dd', { text: fmt(st.textures) })] : null,
      st.duration ? [h('dt', { text: '길이' }), h('dd', { text: st.duration.toFixed(2) + '초' })] : null);
    const links = h('div', { class: 'row' },
      a.file ? h('a', { href: modelUrl(g, a.file), download: a.id + '.glb', class: 'file', text: a.assembly ? '첫 파츠 GLB' : '미리보기 GLB' }) : null,
      a.detail ? h('a', { href: modelUrl(g, a.detail), download: a.id + '.json', class: 'file ghost', text: a.assembly ? '조립 정보 JSON' : '부가 정보 JSON' }) : null,
      h('button', { type: 'button', class: 'ghost', text: '주소 복사', onclick: () => navigator.clipboard && navigator.clipboard.writeText(location.href) }));
    // 원본 묶음: 이 분류의 편집용 원본(압축 없는 GLB 등) zip. 저장소 Releases 에 있다
    const orig = g.models.originals || {};
    const parts = (orig.files || {})[gid] || (orig.files || {})['3d_all'] || [];
    const origRow = parts.length ? h('div', { class: 'orig' },
      h('p', { class: 'sub', text: '원본(편집용): 원래 해상도 텍스처와 전체 동작이 든 분류별 zip' }),
      h('div', { class: 'row' }, ...parts.map((f) => (orig.base
        ? h('a', { href: orig.base + f.name, class: 'file ghost', text: '원본 zip ' + (parts.length > 1 ? f.name.replace(/^.*-(\d+)\.zip$/, '$1부 ') : '') + '(' + mb(f.bytes) + ')' })
        : h('span', { class: 'file ghost disabled', title: '준비 중입니다', text: f.name + ', ' + mb(f.bytes) }))))) : null;
    const extra = ext() && ext().detailExtras ? ext().detailExtras(g, gid, a, () => select(a, false)) : [];
    d.replaceChildren(...[
      h('div', { class: 'detail-head' }, h('div', {}, h('h3', { text: a.label || a.name.split('/').pop() }), h('p', { class: 'sub', text: a.name })),
        h('div', { class: 'row head-btns' }, wide, close)),
      ...(extra.top || []),
      host, toolbar, timeline, dl, links, origRow,
      h('p', { class: 'hint small', text: '끌어서 돌리기, 휠로 확대, 오른쪽 끌기로 옮기기' }),
      ...(extra.bottom || [])].filter(Boolean));
    d.classList.add('open');
    try {
      const [mod, mi] = await Promise.all([import('./model.js'), modelIndex(g)]);
      if (state.selected !== a) return;
      const plugin = await mod.loadPlugin(mi.plugin);
      if (state.selected !== a) return;
      const ctx = { url: (rel) => modelUrl(g, rel), json: (rel) => getJSON(modelUrl(g, rel)), render: mi.render, plugin,
        items: (cid) => modelList(g, cid).then((d) => d.items) };
      const view = new mod.default({ host, toolbar, timeline, ctx, isCurrent: () => state.selected === a && state.view === view });
      state.view = view;
      await view.mount(a);
    } catch (e) {
      if (state.selected === a) host.append(h('p', { class: 'hint m3d-err', text: '모델을 그리지 못했습니다: ' + e.message }));
      console.error(e);
    }
  }

  // ── 입력 ──────────────────────────────────────────────────────────────
  let typing = 0;
  $('search').addEventListener('input', (e) => { clearTimeout(typing); typing = setTimeout(() => { state.filter = e.target.value; applyFilter(); }, 160); });
  document.addEventListener('keydown', (e) => {
    if ($('browser').hidden || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    const i = state.selected ? state.shown.indexOf(state.selected) : -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const j = Math.max(0, Math.min(state.shown.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)));
      while (j >= state.rendered && state.rendered < state.shown.length) renderMore();
      if (state.shown[j]) select(state.shown[j], true);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      stopPlayer();
      stopModel();
      $('detail').classList.remove('open', 'wide');
    } else if (ext() && ext().onKey) {
      ext().onKey(e);
    }
  });

  // ── 시작 ──────────────────────────────────────────────────────────────
  async function boot() {
    try {
      state.site = await getJSON((ext() && ext().siteUrl) || 'games/index.json');
    } catch (e) {
      $('home').hidden = false;
      $('gameCards').replaceChildren(h('p', { class: 'empty-msg', text: '게임 목록(games/index.json)을 읽지 못했습니다: ' + e.message }));
      return;
    }
    // 확장이 쓰는 손잡이(상태, 다시 걸러 그리기, 그림 고르기)
    window.__viewer = { state, h, applyFilter, select: (a) => select(a, true), modelUrl };
    if (ext() && ext().ready) ext().ready(window.__viewer);
    window.addEventListener('hashchange', route);
    route();
  }
  // 상단 막대 높이를 CSS 에 알려 준다(좁은 화면에서 게임 탭이 둘째 줄로 내려가면 막대가 높아진다)
  const bar = document.querySelector('.bar');
  const setBarH = () => document.documentElement.style.setProperty('--bar-h', bar.offsetHeight + 'px');
  if (bar) {
    setBarH();
    if ('ResizeObserver' in window) new ResizeObserver(setBarH).observe(bar);
  }
  boot();
})();
