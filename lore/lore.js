// 세계관 페이지, 두 가지 모드(<main id="world" data-mode data-src data-root>). 자료 주소는 data-src(페이지 기준)가 정하고,
// 뷰어, 게임 목록 같은 사이트 맨 위 주소는 data-root(이 페이지에서 사이트 맨 위까지, lore/ 에서는 '../')를 앞에 붙인다.
// - unified(lore/index.html): REPLAY-Boomhill 통합 세계관. data-src 가 '/' 로 끝나면 그 폴더의 md 여덟 개를 직접 읽는다.
//   md 를 못 읽으면 함께 내보낸 lore.json 을 읽는다.
// - records: 작품별 기록(게임 속 기록, 공개 자료, 작품, 인물, 장소, 세력, 사물, 연표, 출처).
// 얼굴 그림은 이 사이트의 3D 미리보기 썸네일에서 이름(게임 속 표시 이름)으로 찾는다. 없으면 첫 글자를 쓴다.
(function () {
  'use strict';
  const root = document.getElementById('world');
  const GRADE = { 원전: { text: '게임 속 기록', cls: '' }, 공개자료: { text: '공개 자료', cls: 'pub' } };
  const KINDS = [
    { key: 'characters', title: '인물', sub: '작품마다 나온 모습을 따로 적었습니다. 같은 이름이라도 작품에 따라 설정이 다를 수 있습니다.' },
    { key: 'places', title: '장소', sub: '마을, 지역, 무대. 작품마다 다른 이름은 함께 적었습니다.' },
    { key: 'factions', title: '세력', sub: '무리, 조직, 팀.' },
    { key: 'things', title: '사물과 힘', sub: '보석, 물, 에너지처럼 이야기에 나오는 자원과 물건.' },
  ];
  const st = { lore: null, game: null, faces: new Map(), models: [], assetGames: new Set(), site: { games: [] } };
  // 게임 자료 주소는 게임 목록(games/index.json)의 base, models.base 를 따른다. 게임마다 저장소와 사이트가 따로라
  // 허브에서는 '../<게임 저장소>/2d/' 처럼 다른 사이트를 가리킨다(같은 주소 아래라 그대로 읽힌다)
  const ROOT = root.dataset.root || '';
  // 게임 목록의 주소는 사이트 맨 위 기준이다. 절대 주소(http:, /…)가 아니면 ROOT 를 앞에 붙인다
  const up = (u) => (/^([a-z]+:|\/)/i.test(u) ? u : ROOT + u);
  const viewer = (hash) => ROOT + 'index.html#/' + hash;
  const siteGame = (id) => (st.site.games || []).find((g) => g.id === id) || {};
  const base2d = (id) => up(siteGame(id).base || `games/${id}/2d/`);
  const base3d = (id) => up((siteGame(id).models || {}).base || `games/${id}/3d/`);

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
    return el;
  }
  const json = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });
  const gameTitle = (id) => (st.lore.games.find((g) => g.id === id) || {}).title || id;
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

  // 얼굴: 3D 미리보기 캐릭터, NPC 썸네일을 게임 속 표시 이름으로 찾는다(앞에 적은 것이 먼저).
  // 에어라이더를 앞에 둔다: 버블파이터 캐릭터 썸네일은 팀 색(빨강) 옷이라 인물마다 고유 색이 보이지 않는다
  const FACE_SOURCES = [['airrider', '3d_character'], ['bnb-mobile', '3d_character'], ['bubblefighter-adventure', '3d_character'], ['bubblefighter', '3d_character']];
  async function loadFaces() {
    const tops = {};
    for (const [game, catId] of FACE_SOURCES) {
      try {
        tops[game] = tops[game] || await json(`${base3d(game)}index.json`);
        const cat = tops[game].categories.find((c) => c.id === catId);
        if (!cat) continue;
        const list = await json(`${base3d(game)}${cat.list}`);
        for (const it of list.items) {
          st.models.push({ game, cat: catId, id: it.id, label: it.label || null });
          if (!it.thumb) continue;
          const keys = [it.label, it.label && it.label.replace(/\s+/g, ''), it.id.replace(/__Default$|_default$/i, '').toLowerCase()].filter(Boolean);
          for (const k of keys) if (!st.faces.has(k)) st.faces.set(k, { src: `${base3d(game)}${it.thumb}`, href: viewer(`g/${game}/${catId}/${encodeURIComponent(it.id)}`) });
        }
      } catch { /* 3D 가 없으면 첫 글자로 */ }
    }
  }
  const faceOf = (e) => st.faces.get(e.name) || (e.aka || []).map((a) => st.faces.get(a)).find(Boolean) || st.faces.get(e.id);

  function entry(e) {
    const g = GRADE[e.grade] || GRADE.원전;
    const li = h('li', { class: 'w-entry' },
      h('p', {}, h('span', { class: 'w-tag ' + g.cls, text: g.text }), e.text,
        ...(e.sources || []).map((u) => h('a', { class: 'src', href: u, target: '_blank', rel: 'noopener', text: '[' + host(u) + ']' }))));
    if (e.quote) li.append(h('blockquote', {}, '“' + e.quote + '”', e.speaker ? h('cite', { text: '- ' + e.speaker }) : null));
    return li;
  }
  const entries = (list) => h('ul', { class: 'w-entries' }, list.map(entry));

  function byGame(obj, open) {
    const games = Object.keys(obj.byGame || {}).filter((g) => (obj.byGame[g] || []).length && (!st.game || st.game === g));
    if (!games.length) return null;
    return h('div', { class: 'w-by' }, games.map((g) => h('details', { open: open || st.game ? true : null, 'data-game': g },
      h('summary', {}, h('span', { class: 'g', text: gameTitle(g) }), h('span', { class: 'c', text: `기록 ${obj.byGame[g].length}` })),
      entries(obj.byGame[g]))));
  }

  function card(kind, obj) {
    const by = byGame(obj, false);
    if (!by) return null;
    const face = kind === 'characters' ? faceOf(obj) : null;
    const first = Object.keys(obj.byGame || {})[0];
    return h('article', { class: 'w-card', id: kind.slice(0, -1) + '-' + obj.id, 'data-game': st.game || first },
      h('header', {},
        kind === 'characters' ? h('div', { class: 'w-face' }, face ? h('img', { src: face.src, alt: '', loading: 'lazy' }) : h('span', { class: 'ini', text: (obj.name || '?').slice(0, 1) })) : null,
        h('div', {}, h('h3', { text: obj.name }), obj.aka && obj.aka.length ? h('p', { class: 'aka', text: '다른 이름: ' + obj.aka.join(', ') }) : null)),
      obj.role ? h('p', { class: 'role', text: obj.role }) : null,
      by,
      face ? h('div', { class: 'w-actions' }, h('a', { href: face.href, text: '3D 모델 보기' })) : null);
  }

  function period(s) {
    if (!s || (!s.start && !s.end)) return null;
    return (s.start || '?') + ' ~ ' + (s.end || '');
  }

  function gamesSection() {
    const list = st.lore.games.filter((g) => !st.game || g.id === st.game);
    return h('section', { class: 'w-sec', id: 'games' },
      h('h2', {}, '작품', h('span', { class: 'n', text: list.length + '편' })),
      h('p', { class: 'sub', text: '다오와 배찌가 나오는 게임들입니다. 각 작품이 직접 보여 준 세계만 적었습니다.' }),
      h('div', { class: 'w-grid' }, list.map((g) => h('article', { class: 'w-card', id: 'game-' + g.id, 'data-game': g.id },
        h('header', {}, h('div', {}, h('h3', { text: g.title }), period(g.service) ? h('p', { class: 'period', text: '서비스 ' + period(g.service) }) : null)),
        g.summary ? h('p', { class: 'summary', text: g.summary }) : null,
        (g.world || []).length ? h('div', { class: 'w-by' }, h('details', { open: st.game ? true : null },
          h('summary', {}, h('span', { class: 'g', text: '세계 기록' }), h('span', { class: 'c', text: `${g.world.length}` })), entries(g.world))) : null,
        h('div', { class: 'w-actions' },
          st.assetGames.has(g.id) ? h('a', { href: viewer('g/') + encodeURIComponent(g.id), text: '이 게임의 그림과 모델 보기' }) : null,
          ...(g.service && g.service.sources || []).slice(0, 2).map((u) => h('a', { href: u, target: '_blank', rel: 'noopener', text: host(u) })))))));
  }

  function kindSection(k) {
    const cards = (st.lore[k.key] || []).map((o) => card(k.key, o)).filter(Boolean);
    return h('section', { class: 'w-sec', id: k.key },
      h('h2', {}, k.title, h('span', { class: 'n', text: cards.length + '' })),
      h('p', { class: 'sub', text: k.sub }),
      cards.length ? h('div', { class: 'w-grid' }, cards) : h('p', { class: 'w-none', text: '이 작품의 기록은 아직 없습니다.' }));
  }

  function timelineSection() {
    const rows = (st.lore.timeline || []).filter((t) => !st.game || t.game === st.game).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return h('section', { class: 'w-sec', id: 'timeline' },
      h('h2', {}, '연표', h('span', { class: 'n', text: rows.length + '' })),
      h('p', { class: 'sub', text: '서비스 시작과 종료처럼 공식 자료로 확인한 날짜만 적었습니다.' }),
      rows.length ? h('ol', { class: 'w-time' }, rows.map((t) => h('li', { 'data-game': t.game },
        h('span', { class: 'd', text: t.date }),
        h('span', { class: 't' }, h('b', { text: gameTitle(t.game) }), t.text,
          ...(t.sources || []).map((u) => h('a', { class: 'src', href: u, target: '_blank', rel: 'noopener', text: ' [' + host(u) + ']' })))))) : h('p', { class: 'w-none', text: '이 작품의 연표 기록은 아직 없습니다.' }));
  }

  function sourcesSection() {
    const src = st.lore.sources || [];
    if (!src.length) return null;
    return h('section', { class: 'w-sec', id: 'sources' },
      h('h2', {}, '공개 자료 출처', h('span', { class: 'n', text: src.length + '' })),
      h('p', { class: 'sub', text: '\'공개 자료\' 표시가 붙은 기록의 출처입니다. \'게임 속 기록\'은 각 게임 안에서 이용자에게 보인 대사, 퀘스트, 설명에서 옮겼습니다.' }),
      h('ul', { class: 'w-sources' }, src.map((s) => h('li', {}, h('a', { href: s.url, target: '_blank', rel: 'noopener', text: s.title || host(s.url) }),
        h('span', { class: 'pub', text: ', ' + [s.publisher, s.checked ? s.checked + ' 확인' : null].filter(Boolean).join(', ') })))));
  }

  // ── 통합 세계관(unified, v2) ── 항목별 글머리 목록, 관계는 한 쌍에 하나, 관계도 그래프, 인물별 3D 모델(게임별 모든 형태)
  const GAME_NAME = { bnb: '크레이지아케이드', 'bnb-mobile': 'BnB M', bubblefighter: '버블파이터', 'bubblefighter-adventure': '버블파이터 어드벤처', airrider: '에어라이더' };
  const text = (x) => (typeof x === 'string' ? x : x.text);
  const bullets = (items, cls) => h('ul', { class: 'u-list' + (cls ? ' ' + cls : '') }, (items || []).map((x) => h('li', { text: text(x) })));
  let nameOf = (id) => id;

  // 어드벤처 의상 id 조각의 한글 이름
  const VARIANT_KO = { angel: '천사', bad: '악당', bear: '곰', cat: '고양이', explorer: '탐험가', hood: '후드', studentf: '교복(여)', studentm: '교복(남)', racoon: '너구리', named: '이름표' };
  // 인물의 3D 모델: 캐릭터, NPC 목록에서 게임 속 이름(한글)이 들어 있거나 id 조각이 인물 키와 같은 것
  function modelsOf(c) {
    const ko = (c.faces || []).filter((k) => /[가-힣]/.test(k));
    const en = new Set((c.faces || []).filter((k) => !/[가-힣]/.test(k)).map((k) => k.toLowerCase()));
    const out = {};
    for (const m of st.models) {
      const base = (m.label || '').split(/ \u00b7 | (?=\d)/);   // 표시 이름 '다오 102400/102453'(가운데점으로 나눈 꼴도 읽는다)
      const tokens = m.id.toLowerCase().split(/_+/);
      const hitKo = !!m.label && ko.some((k) => base[0].includes(k));
      const hitEn = en.has(m.id.toLowerCase()) || tokens.some((t) => en.has(t));
      if (!hitKo && !hitEn) continue;
      let v;
      if (m.label && hitKo) v = ko.includes(base[0]) ? (base[1] || '기본') : m.label;
      else v = tokens.filter((t) => !en.has(t) && t !== 'default').map((t) => VARIANT_KO[t] || t).join(' ') || '기본';
      if (m.cat === '3d_npc') v += ' (NPC)';
      (out[m.game] = out[m.game] || []).push({ v, href: viewer(`g/${m.game}/${m.cat}/${encodeURIComponent(m.id)}`) });
    }
    return out;
  }

  // 장소 카드(접힌 카드): 버블힐(depth 0)은 늘 펼쳐 두고, 그 아래 장소는 머리(그림, 이름, 첫 문장, 안쪽 장소)만 보이게 접는다.
  // 테마를 펼치면 그 안쪽 장소(depth 2 이상)는 펼친 채로 보인다. 약도 표식이나 주소 꼬리로 오면 route 가 펼친다
  function placeCard(p, depth) {
    const src = artOf(p), kids = p.children || [];
    const head = h('header', { class: 'u-place-head' }, src ? h('img', { src, alt: '', loading: 'lazy', class: 'u-place-art' }) : null,
      h('div', { class: 'u-place-title' },
        h('h3', {}, p.name, p.aka && p.aka.length ? h('span', { class: 'aka', text: ' (' + p.aka.join(', ') + ')' }) : null),
        depth ? h('p', { class: 'u-teaser', text: p.items && p.items.length ? text(p.items[0]) : '' }) : null,
        depth && kids.length ? h('p', { class: 'u-kids', text: '안쪽 장소: ' + kids.map((c) => c.name).join(', ') }) : null));
    const body = placeBody(p, depth);
    if (!depth) return h('article', { class: 'u-place depth-0', id: 'place-' + p.id }, head, ...body);
    return h('article', { class: 'u-place depth-' + depth, id: 'place-' + p.id },
      h('details', { class: 'u-fold', open: depth >= 2 ? true : null }, h('summary', {}, head), h('div', { class: 'u-fold-body' }, ...body)));
  }
  function placeBody(p, depth) {
    return [
      bullets(p.items),
      (p.assets || []).length ? h('div', { class: 'w-actions u-assets' }, p.assets.map((v) => {
        const [game, grp, ...rest] = v.split(':'), id = rest.join(':');
        return h('a', { href: viewer(`g/${game}/${grp}/${encodeURIComponent(id)}`), text: (GAME_NAME[game] || game) + (grp.startsWith('3d_') ? ' 3D' : ' 2D') });
      })) : null,
      // 칸 수 = 안쪽이 없는 장소 수(1~4). 안쪽이 있는 장소는 한 줄을 다 쓰므로 세지 않는다(빈 칸을 남기지 않게)
      (p.children || []).length ? h('div', { class: 'u-children', style: `--n:${Math.max(1, Math.min(4, p.children.filter((c) => !(c.children || []).length).length))}` },
        p.children.map((c) => placeCard(c, depth + 1))) : null];
  }

  // 통합 세계관 인물의 얼굴: 3D 썸네일(게임 속 이름) → 없으면 2D 그림 일부(face2d)
  function uFace(c) {
    const f = faceOf({ id: c.id, name: c.name, aka: [...(c.faces || []), ...(c.aka || [])] });
    if (f) return f;
    if (c.bnb) return { src: `faces/bnb-${c.bnb}.png`, pixel: /^[CN]\d/.test(c.bnb) };   // Q-… 는 퀘스트 초상(그린 그림)
    const d = c.face2d;
    return d ? { src: `${base2d(d.game)}${d.path}`, crop: d.crop, size: d.size } : null;
  }
  // 2D 그림 일부를 칸에 맞춰 보여 주는 상자(픽셀 그림은 보간하지 않는다)
  function cropBox(f) {
    const [x, y, w, hh] = f.crop, [W, H] = f.size;
    return h('span', { class: 'crop', style: `background-image:url("${f.src}");background-size:${W / w * 100}% ${H / hh * 100}%;background-position:${W === w ? 0 : x / (W - w) * 100}% ${H === hh ? 0 : y / (H - hh) * 100}%` });
  }
  // 얼굴 그림이 없는 인물: 출신 게임 색의 물방울 배지. md 의 '출신:' 값으로 색을 고른다
  const ORIGIN = { 크레이지아케이드: 'bnb', 크아: 'bnb', 'BnB M': 'bnbm', 버블파이터: 'bf', '버블파이터 어드벤처': 'bfa', 에어라이더: 'ar', 카트라이더: 'kart' };
  const originOf = (c) => ORIGIN[(c && c.origin) || ''] || 'etc';
  const faceEl = (f, name, c) => (f ? (f.crop ? cropBox(f) : h('img', { src: f.src, alt: '', loading: 'lazy', class: f.pixel ? 'pixel' : null })) : h('span', { class: 'ini drop o-' + originOf(c), title: c && c.origin ? c.origin + ' 출신' : null, text: (name || '?').slice(0, 1) }));

  function charCard(c, rels) {
    const face = uFace(c);
    const mine = rels.filter((r) => r.a === c.id || r.b === c.id);
    const models = modelsOf(c);
    if (c.bnb) models.bnb = [{ v: '기본', href: viewer(`g/bnb/020_bomber/${encodeURIComponent(`Character__${c.bnb}-WalkDown_ALayerStatic`)}`) }];
    else if (c.face2d && c.face2d.link) {
      const [grp, aid] = c.face2d.link.split('/');
      models[c.face2d.game] = [{ v: '기본', href: viewer(`g/${c.face2d.game}/${grp}/${encodeURIComponent(aid)}`) }];
    }
    const games = Object.keys(GAME_NAME).filter((g) => models[g]);
    const total = games.reduce((n, g) => n + models[g].length, 0);
    // 인물 카드(접힌 카드): 얼굴, 이름, 역할만 보이고 누르면 성격, 잘하는 것, 한계, 관계가 펼쳐진다
    return h('article', { class: 'w-card u-char', id: 'char-' + c.id }, h('details', { class: 'u-fold' },
      h('summary', {}, h('header', {},
        h('div', { class: 'w-face' + (face ? '' : ' no-face') }, faceEl(face, c.name, c)),
        h('div', {}, h('h3', { text: c.name }), c.aka && c.aka.length ? h('p', { class: 'aka', text: '다른 이름: ' + c.aka.join(', ') }) : null, c.role ? h('p', { class: 'role', text: c.role }) : null))),
      h('div', { class: 'u-fold-body' }, h('ul', { class: 'u-groups' }, (c.groups || []).map((g) => h('li', {}, h('b', { text: g.title }), bullets(g.items)))),
      mine.length ? h('div', { class: 'u-sub' }, h('h4', { text: '관계' }), h('ul', { class: 'u-rel' }, mine.map((r) => {
        const other = r.a === c.id ? r.b : r.a;
        return h('li', {}, h('a', { href: '#char-' + other, text: nameOf(other) }), h('span', { class: 'u-label', text: r.label }), r.text);
      }))) : null,
      // 캐릭터 보기: 누르면 게임별 링크가 나온다. 게임마다 기본 모습 하나로 보낸다
      total ? h('details', { class: 'u-models' }, h('summary', { text: '캐릭터 보기' }),
        h('p', { class: 'links' }, games.flatMap((g, i) => {
          const m = models[g].find((x) => x.v === '기본') || models[g][0];
          return [i ? h('span', { class: 'sep', text: '|' }) : null, h('a', { href: m.href, text: GAME_NAME[g] })];
        }))) : null)));
  }

  // 관계도: 힘 기반 배치(같은 입력이면 같은 그림). 노드는 얼굴 원, 선 위에 관계 이름
  const SVG = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, ...kids) {
    const el = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs || {})) if (v != null) el.setAttribute(k, v);
    for (const kid of kids.flat()) if (kid != null) el.append(kid);
    return el;
  }
  function layout(ids, edges, W, H) {
    const n = ids.length;
    const P = ids.map((id, i) => ({ id, x: W / 2 + Math.cos(2 * Math.PI * i / n) * W * 0.35, y: H / 2 + Math.sin(2 * Math.PI * i / n) * H * 0.35 }));
    const at = new Map(ids.map((id, i) => [id, P[i]]));
    const L = 190, KR = 42000, KS = 0.03, G = 0.006, N = 800;
    for (let it = 0; it < N; it++) {
      for (const p of P) { p.fx = (W / 2 - p.x) * G; p.fy = (H / 2 - p.y) * G; }
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const a = P[i], b = P[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy || 0.01, d = Math.sqrt(d2), f = KR / d2;
        a.fx += dx / d * f; a.fy += dy / d * f; b.fx -= dx / d * f; b.fy -= dy / d * f;
      }
      for (const e of edges) {
        const a = at.get(e.a), b = at.get(e.b), dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01, f = (d - L) * KS;
        a.fx += dx / d * f; a.fy += dy / d * f; b.fx -= dx / d * f; b.fy -= dy / d * f;
      }
      const t = 1 - it / N;
      for (const p of P) {
        p.x = Math.max(50, Math.min(W - 50, p.x + Math.max(-24, Math.min(24, p.fx)) * t));
        p.y = Math.max(46, Math.min(H - 60, p.y + Math.max(-24, Math.min(24, p.fy)) * t));
      }
    }
    // 화면을 고르게 쓰도록 배치 범위를 캔버스 여백까지 늘린다
    const xs = P.map((p) => p.x), ys = P.map((p) => p.y);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    for (const p of P) {
      p.x = 70 + (p.x - x0) / ((x1 - x0) || 1) * (W - 140);
      p.y = 50 + (p.y - y0) / ((y1 - y0) || 1) * (H - 120);
    }
    return at;
  }
  // 관계 이름표 자리: 선 위 여러 후보 가운데 인물, 이름, 다른 이름표와 겹치지 않는 곳을 고른다
  function placeLabels(rels, at, names) {
    const boxes = [];
    for (const [id, p] of at) {
      boxes.push({ x: p.x - 34, y: p.y - 34, w: 68, h: 68 });
      const nw = (names.get(id) || '').length * 15 + 8;
      boxes.push({ x: p.x - nw / 2, y: p.y + 34, w: nw, h: 20 });
    }
    const hit = (b) => boxes.reduce((s, o) => s + Math.max(0, Math.min(b.x + b.w, o.x + o.w) - Math.max(b.x, o.x)) * Math.max(0, Math.min(b.y + b.h, o.y + o.h) - Math.max(b.y, o.y)), 0);
    const order = rels.map((r, i) => i).sort((i, j) => {
      const len = (r) => Math.hypot(at.get(r.a).x - at.get(r.b).x, at.get(r.a).y - at.get(r.b).y);
      return len(rels[i]) - len(rels[j]);   // 짧은 선부터(자리가 적다)
    });
    const out = new Array(rels.length);
    for (const i of order) {
      const r = rels[i], a = at.get(r.a), b = at.get(r.b);
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
      const w = r.label.length * 12.5 + 12, hgt = 18;
      let best = null;
      for (const t of [0.5, 0.42, 0.58, 0.34, 0.66, 0.27, 0.73]) {
        for (const off of [0, 13, -13, 26, -26]) {
          const cx = a.x + dx * t + nx * off, cy = a.y + dy * t + ny * off;
          const box = { x: cx - w / 2, y: cy - hgt / 2, w, h: hgt };
          const cost = hit(box) + Math.abs(off) * 2 + Math.abs(t - 0.5) * 40;
          if (!best || cost < best.cost) best = { cost, cx, cy, box };
          if (cost < 1 + Math.abs(off) * 2 + Math.abs(t - 0.5) * 40) break;
        }
        if (best && hit(best.box) === 0) break;
      }
      boxes.push(best.box);
      out[i] = { x: best.cx, y: best.cy, w, h: hgt };
    }
    return out;
  }
  // 버블힐 약도: 버블힐 지역의 장소를 md 의 '위치:' 값(가운데, 동쪽, 북서쪽 …)으로 놓는다. 누르면 장소 설명으로 간다
  const POS = { 가운데: [0, 0], 북: [0, -1], 남: [0, 1], 동: [1, 0], 서: [-1, 0], 북동: [1, -1], 북서: [-1, -1], 남동: [1, 1], 남서: [-1, 1] };
  function posOf(v) {
    const raw = String(v || '').replace(/\s/g, '');
    const far = /^(먼|멀리)/.test(raw), near = /^(가까운|바로)/.test(raw);
    const key = raw.replace(/^(먼|멀리|가까운|바로)/, '').replace(/쪽$/, '').replace(/옆$/, '');
    const d = POS[key];
    return d ? { d, far, near } : null;
  }
  // 약도 칸 그림: 장소 '에셋:' 가운데 첫 2D 그림(미니맵, 큰 지도). 3D 만 있으면 글자
  const thumbOf = (p) => { const v = (p.assets || []).find((x) => !x.split(':')[1].startsWith('3d_') && !x.includes(':040_tile:')); if (!v) return null; const [g, grp, ...r] = v.split(':'); return `${base2d(g)}${grp}/${r.join(':')}.png`; };
  // 약도: 그림 지도(lore/map/bubblehill.webp, 글자 없음) 위에 장소 표식을 얹는다.
  // 그림 속 자리는 SPOT(그림 좌표 1536x1024)이 정한다. SPOT 에 없는 장소는 md '위치:'로 섬 안에 놓고, 하위 장소는 부모 둘레에 붙인다.
  // 마우스를 올리거나 키보드로 고르면 그 테마 영역이 빛나고 설명 카드가 뜬다. 누르면 그 장소 설명으로 간다(터치는 첫 탭에 카드, 두 번째에 이동)
  const MAP_IMG = 'map/bubblehill.webp';
  // 에셋 그림이 없는 장소의 상상도(map/places/<id>.webp). 에셋 그림이 있으면 그것을 먼저 쓴다
  const PLACE_ART = new Set(['arcade', 'asgard', 'beguy', 'bubblefighting', 'bunny-farm', 'ca-city', 'camelot', 'crazypark', 'dark-castle', 'dogeom', 'fantarini', 'fluffy-forest', 'harbor', 'moonhill-city', 'nemo', 'northeu', 'oret', 'pirate-island', 'raccoon-village', 'racing', 'riverside', 'sea-of-death', 'snow-mountain']);
  const artOf = (c) => thumbOf(c) || (PLACE_ART.has(c.id) ? `map/places/${c.id}.webp` : null);
  const SPOT = {
    boomhill: [768, 470], crazypark: [740, 330], arcade: [662, 348], bubblefighting: [828, 342], racing: [808, 268],
    harbor: [790, 628], riverside: [612, 500], factory: [1000, 352], forest: [425, 470], 'fluffy-forest': [300, 470],
    'raccoon-village': [452, 566], mine: [1010, 516], desert: [1190, 500], beguy: [1262, 418], 'icerion-land': [700, 214],
    'snow-mountain': [826, 156], 'south-sea': [610, 722], 'pirate-island': [728, 752], 'moonhill-city': [404, 300],
  };
  // 테마 영역(그림 좌표 가운데, 반지름, 색): 마우스를 올리면 빛난다
  const REGION = {
    boomhill: [768, 478, 150, '#ffb347'], factory: [1000, 360, 92, '#cbd5e1'], forest: [390, 480, 165, '#4ade80'],
    mine: [1020, 500, 104, '#f59e5b'], desert: [1230, 455, 135, '#fcd34d'], 'icerion-land': [780, 200, 150, '#bae6fd'],
    'south-sea': [690, 725, 175, '#38bdf8'], 'moonhill-city': [400, 305, 112, '#c4b5fd'],
  };
  function placeMap(root, outside) {
    const kids = (root.children || []).filter((c) => SPOT[c.id] || posOf(c.pos));
    if (!kids.length) return null;
    const W = 1536, H = 1024, cx = 775, cy = 500, RX = 590, RY = 405;   // 섬(그림 속 타원)
    const ell = (x, y) => ((x - cx) / RX) ** 2 + ((y - cy) / RY) ** 2;
    const SKIP = new Set(['around']);
    const RAD = { main: 30, theme: 24, sub: 15, tiny: 6, out: 21 };
    const nodes = [], lines = [], placed = [];
    const add = (c, x, y, size, parent, theme) => {
      const n = { c, x, y, size, r: RAD[size], parent, theme: theme || c.id, side: parent && x < parent.x ? -1 : 1 };
      nodes.push(n); placed.push({ x, y, r: n.r + 30 });
      if (parent) lines.push({ a: parent, b: n });
      return n;
    };
    // 테마: SPOT 이 없으면 '위치:' 방향으로 섬 안에 놓는다(새로 생긴 장소도 일단 보이게)
    const themes = kids.map((c) => {
      const pos = posOf(c.pos), d = pos ? pos.d : [0, 0];
      const sp = SPOT[c.id] || (() => { const k = pos.far ? 0.82 : pos.near ? 0.35 : 0.55, m = d[0] && d[1] ? 0.75 : 1; return [cx + d[0] * RX * k * m, cy + d[1] * RY * k * m]; })();
      return add(c, sp[0], sp[1], !d[0] && !d[1] ? 'main' : 'theme');
    });
    const grow = (parent, depth) => {
      (parent.c.children || []).filter((c) => !SKIP.has(c.id)).forEach((c) => {
        let sp = SPOT[c.id];
        if (!sp) {   // 부모 둘레 후보 가운데 놓인 점과 가장 먼 곳(섬 안쪽만)
          const R = depth === 1 ? 90 : 56;
          let best = null;
          for (let deg = 0; deg < 360; deg += 15) {
            const t = deg * Math.PI / 180, x = parent.x + R * Math.cos(t), y = parent.y + R * Math.sin(t) * 0.9;
            if (ell(x, y) > 0.9) continue;
            const score = Math.min(...placed.map((q) => Math.hypot(q.x - x, q.y - y) - q.r));
            if (!best || score > best.score) best = { x, y, score };
          }
          if (!best) return;
          sp = [best.x, best.y];
        }
        const n = add(c, sp[0], sp[1], depth === 1 ? 'sub' : 'tiny', parent, parent.theme);
        if (depth < 2) grow(n, depth + 1);
      });
    };
    themes.forEach((n) => grow(n, 1));
    // 버블힐 바깥: 섬 둘레 바다의 격자 후보에서 이미 놓인 바깥 점과 가장 먼 곳을 차례로 고른다(제목, 방위표 자리는 비운다)
    const outs = [], cand = [];
    for (let y = 120; y <= H - 70; y += 20) for (let x = 90; x <= W - 90; x += 20)
      if (ell(x, y) > 1.12 && Math.hypot(x - (W - 74), y - 74) > 120 && !(x < 330 && y < 120)) cand.push([x, y]);
    // 바깥 세계는 떠다니므로 정해진 자리가 없다: 새로 고칠 때마다 순서와 자리를 섞는다
    const shuffled = (outside || []).map((c) => [Math.random(), c]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    shuffled.forEach((c) => {
      let best = null;
      if (!outs.length && cand.length) { const [x, y] = cand[Math.floor(Math.random() * cand.length)]; best = { x, y }; }
      else for (const [x, y] of cand) {
        const score = Math.min(...outs.map((q) => Math.hypot(q.x - x, q.y - y))) + Math.random() * 60;   // 조금 흔들어 매번 다른 자리
        if (!best || score > best.score) best = { x, y, score };
      }
      if (best) outs.push(add(c, best.x, best.y, 'out'));
    });

    // 설명 카드(HTML): 그림 위 표식 옆에 뜬다
    const card = h('div', { class: 'm-card', role: 'tooltip', hidden: '' });
    let shown = null;
    const fig = h('figure', { class: 'u-map' });
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': root.name + ' 약도' });
    const show = (n) => {
      shown = n;
      const c = n.c, th = artOf(c), first = (c.items || [])[0];
      const subs = (c.children || []).filter((x) => !SKIP.has(x.id));
      const region = REGION[n.theme];
      card.style.setProperty('--m-tint', region ? region[3] : 'var(--accent)');
      card.replaceChildren(...[   // replaceChildren 은 null 을 글자로 넣으므로 걸러 낸다
        th ? h('div', { class: 'm-card-img' }, h('img', { src: th, alt: '', loading: 'lazy' })) : null,
        h('div', { class: 'm-card-body' },
          h('p', { class: 'm-card-kicker', text: n.size === 'out' ? '버블힐 바깥' : n.size === 'main' || n.size === 'theme' ? '버블힐 지역' : nameOfNode(n.parent) }),
          h('h4', { text: c.name }),
          c.aka && c.aka.length ? h('p', { class: 'm-card-aka', text: '다른 이름: ' + c.aka.join(', ') }) : null,
          first ? h('p', { class: 'm-card-text', text: text(first) }) : null,
          subs.length ? h('p', { class: 'm-card-subs', text: '안쪽 장소: ' + subs.map((x) => x.name).join(', ') }) : null,
          h('p', { class: 'm-card-hint', text: '누르면 자세한 설명으로 갑니다' }))].filter(Boolean));
      card.hidden = false;
      // 표식 오른쪽(오른편이면 왼쪽)에 놓는다. 자리는 그림 비율로 정해 화면 크기와 상관없이 맞는다
      const right = n.x < W * 0.62;
      card.style.left = right ? `calc(${(n.x + n.r + 14) / W * 100}% )` : '';
      card.style.right = right ? '' : `calc(${(W - n.x + n.r + 14) / W * 100}% )`;
      // 높이: 카드를 재서 지도 안에 들어오게 하고, 꼬리는 표식 높이를 가리킨다
      const stageH = card.parentElement.clientHeight, ny = n.y / H * stageH, ch = card.offsetHeight;
      const top = Math.max(8, Math.min(stageH - ch - 8, ny - ch * 0.35));
      card.style.top = top + 'px';
      card.style.transform = '';
      card.classList.toggle('m-at-left', !right);   // 꼬리가 표식 쪽(왼쪽 또는 오른쪽)을 가리킨다
      card.style.setProperty('--m-caret', Math.max(14, Math.min(ch - 14, ny - top)) + 'px');
      svg.classList.add('m-hot');
      svg.querySelectorAll('.m-node, .m-branch, .m-region').forEach((el) => el.classList.toggle('on', el.dataset.theme === n.theme && (n.size !== 'out' || el.dataset.id === c.id)));
    };
    const hide = () => { shown = null; card.hidden = true; svg.classList.remove('m-hot'); svg.querySelectorAll('.on').forEach((el) => el.classList.remove('on')); };   // 빛나던 영역, 강조도 함께 끈다
    const nameOfNode = (p) => (p ? p.c.name : '');
    let touch = false;
    const ribbon = (label, fs, y, anchor, x) => {
      const w = [...label].length * fs * 0.98 + 14, x0 = anchor === 'start' ? x - 7 : anchor === 'end' ? x - w + 7 : x - w / 2;
      return [s('rect', { x: x0, y: y - fs - 3, width: w, height: fs + 10, rx: (fs + 10) / 2, class: 'm-rib' }),
        s('text', { x, y, 'text-anchor': anchor, class: 'm-name', 'font-size': fs }, label)];
    };
    const node = (n) => {
      const { c, size, r } = n, th = size === 'tiny' ? null : artOf(c), ir = r - 3;
      const fs = { main: 20, theme: 16, sub: 13, tiny: 12, out: 14 }[size];
      const body = [
        size === 'out' ? s('ellipse', { rx: r + 9, ry: r * 0.55, cy: r * 0.7, class: 'm-cloud' }) : null,
        s('circle', { r, class: 'm-dot' }),
        th ? s('image', { href: th, x: -ir, y: -ir, width: ir * 2, height: ir * 2, 'clip-path': `url(#m-clip-${size})`, preserveAspectRatio: 'xMidYMid slice' })
          : size === 'main' || size === 'theme' || size === 'out' ? s('text', { y: r * 0.32, 'text-anchor': 'middle', class: 'm-ini' }, c.name.slice(0, 1)) : null,
        ...(size === 'tiny' || size === 'sub'   // 작은 표식은 이름을 윗단계 반대쪽 옆에
          ? ribbon(c.name, fs, 5, n.side > 0 ? 'start' : 'end', n.side * (r + 8))
          : ribbon(c.name, fs, r + fs + 8, 'middle', 0))];
      // 바깥 세계는 구름처럼 천천히 떠다니고(m-float), 마우스나 손가락으로 끌어 옮길 수 있다(자리가 정해져 있지 않다는 뜻)
      const g = s('g', { class: 'm-node m-' + size, transform: `translate(${n.x},${n.y})`, tabindex: '0', role: 'link', 'aria-label': c.name, 'data-theme': n.theme, 'data-id': c.id },
        size === 'out' ? s('g', { class: 'm-float', style: `animation-delay:${-((n.x * 7 + n.y * 3) % 60) / 10}s` }, ...body) : body);
      const go = () => { location.hash = '#place-' + c.id; };
      let drag = null, moved = false;
      if (size === 'out') {
        const at = (e) => { const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse()); return [q.x, q.y]; };
        g.addEventListener('pointerdown', (e) => { const [x, y] = at(e); drag = { dx: n.x - x, dy: n.y - y, x0: e.clientX, y0: e.clientY }; moved = false; g.setPointerCapture(e.pointerId); });
        g.addEventListener('pointermove', (e) => {
          if (!drag) return;
          if (!moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
          if (!moved) { moved = true; hide(); g.classList.add('m-drag'); }
          const [x, y] = at(e);
          n.x = Math.max(r + 10, Math.min(W - r - 10, x + drag.dx)); n.y = Math.max(r + 10, Math.min(H - r - 40, y + drag.dy));
          const e2 = ell(n.x, n.y);   // 섬 위로는 올라가지 않는다: 섬 테두리 바깥으로 밀어낸다
          if (e2 < 1.05) { const k = Math.sqrt(1.05 / Math.max(e2, 0.01)); n.x = cx + (n.x - cx) * k; n.y = cy + (n.y - cy) * k; }
          g.setAttribute('transform', `translate(${n.x},${n.y})`);
        });
        const end = () => { if (drag) { drag = null; g.classList.remove('m-drag'); } };
        g.addEventListener('pointerup', end);
        g.addEventListener('pointercancel', end);
      }
      g.addEventListener('pointerdown', (e) => { touch = e.pointerType === 'touch'; });
      g.addEventListener('mouseenter', () => { if (!touch) show(n); });
      g.addEventListener('mouseleave', () => { if (!touch) hide(); });
      g.addEventListener('focus', () => show(n));
      g.addEventListener('blur', () => hide());
      g.addEventListener('click', () => { if (moved) { moved = false; return; } if (touch && shown !== n) { show(n); return; } go(); });
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); else if (e.key === 'Escape') hide(); });
      return g;
    };
    const clip = (size) => s('clipPath', { id: 'm-clip-' + size }, s('circle', { r: RAD[size] - 3 }));
    const glow = s('radialGradient', { id: 'm-glow' }, s('stop', { offset: '0%', 'stop-color': '#fff', 'stop-opacity': '.55' }), s('stop', { offset: '100%', 'stop-color': '#fff', 'stop-opacity': '0' }));
    const regions = Object.entries(REGION).filter(([id]) => themes.some((t) => t.c.id === id)).map(([id, [x, y, r, col]]) =>
      s('circle', { cx: x, cy: y, r, class: 'm-region', 'data-theme': id, style: `--m-tint:${col}` }));
    const compass = s('g', { class: 'm-compass', transform: `translate(${W - 74},74)` },
      s('circle', { r: 40, class: 'm-compass-bg' }),
      s('text', { y: -22, 'text-anchor': 'middle' }, '북'), s('text', { y: 34, 'text-anchor': 'middle' }, '남'),
      s('text', { x: -28, y: 6, 'text-anchor': 'middle' }, '서'), s('text', { x: 28, y: 6, 'text-anchor': 'middle' }, '동'),
      s('path', { d: 'M0 -14 L5 2 L0 -2 L-5 2 Z', class: 'm-needle' }));
    const order = { out: 0, tiny: 1, sub: 2, theme: 3, main: 4 };
    svg.append(
      s('defs', {}, glow, ...['main', 'theme', 'sub', 'out'].map(clip)),
      s('rect', { x: 0, y: 0, width: W, height: H, class: 'm-sea' }),
      s('image', { href: MAP_IMG, x: 0, y: 0, width: W, height: H, class: 'm-art', preserveAspectRatio: 'xMidYMid slice' }),
      s('rect', { x: 0, y: 0, width: W, height: H, class: 'm-veil' }),
      ...regions,
      ...lines.map((l) => s('line', { x1: l.a.x, y1: l.a.y, x2: l.b.x, y2: l.b.y, class: 'm-branch', 'data-theme': l.b.theme })),
      s('text', { x: 36, y: 62, class: 'm-title' }, root.name),
      s('text', { x: 38, y: 92, class: 'm-title-out' }, '바다 너머의 세계들은 구름처럼 떠다닙니다. 끌어서 옮겨 볼 수 있고, 보이는 자리가 실제 위치는 아닙니다.'),
      ...nodes.slice().sort((p, q) => order[p.size] - order[q.size]).map(node), compass);
    svg.addEventListener('mouseleave', () => { if (!touch) hide(); });
    fig.append(h('div', { class: 'm-stage' }, svg, card),
      h('figcaption', { text: '대략적인 약도입니다. 섬이 버블힐 지역이고, 둘레 바다 너머가 버블힐 바깥입니다. 바깥 세계들은 떠다니며 자리를 옮기므로, 보이는 자리와 거리에는 뜻이 없습니다. 바깥 세계는 끌어서 옮길 수 있습니다. 장소에 마우스를 올리면 짧은 설명이 뜨고, 누르면 그 장소 설명과 에셋 바로가기로 갑니다. 배경 그림은 분위기를 위한 상상도입니다.' }));
    return fig;
  }
  // 관계도: 전체도에서는 관계 이름을 숨기고, 마우스를 올린 인물의 관계만 밝힌다.
  // 인물을 누르면 그 인물을 가운데 두고 이어진 인물을 둘레에 펼친다(옆 칸에 관계 설명). 관계 종류는 선 무늬로, 위쪽 칩으로 거른다
  const REL_KIND = [   // 관계 이름의 낱말로 갈래를 정한다. 어디에도 안 맞으면 '그 밖'
    { id: 'close', name: '가까운 사이', re: /친구|단짝|이웃|아빠|아들|엄마|딸|가족|형제|남매|짝사랑|챙겨|동료|대장/ },
    { id: 'rival', name: '맞서는 사이', re: /숙적|대립|원한|의 적|맞섬|승부|질투|경계|다툼|상대/ },
    { id: 'event', name: '사건', re: /납치|구출|감금|습격|제보|목격|연락/ },
    { id: 'other', name: '그 밖', re: /.*/ },
  ];
  const kindOf = (label) => REL_KIND.find((k) => k.re.test(label)).id;
  function relGraph(rels, chars) {
    const ids = [...new Set(rels.flatMap((r) => [r.a, r.b]))];
    const W = 1000, H = Math.max(620, 300 + ids.length * 22), base = layout(ids, rels, W, H);
    const byId = new Map(chars.map((c) => [c.id, c]));
    const charOf = (id) => byId.get(id) || { id, name: id };
    const edges = rels.map((r) => ({ ...r, kind: kindOf(r.label) }));
    const pos = new Map(ids.map((id) => [id, { ...base.get(id) }]));   // 지금 그려진 자리(움직일 때 바뀐다)
    const st = { hover: null, sel: null, kinds: new Set(REL_KIND.map((k) => k.id)) };
    const on = (e) => st.kinds.has(e.kind);
    const nbrs = (id) => edges.filter((e) => on(e) && (e.a === id || e.b === id));

    // 선: 관계마다 g(선 + 이름표). 이름표는 강조된 선에만 보인다
    const edgeEls = edges.map((e) => {
      const g = s('g', { class: 'edge k-' + e.kind, 'data-a': e.a, 'data-b': e.b },
        s('line', {}), s('rect', { class: 'lbg', rx: 6, height: 20 }), s('text', { class: 'elabel', 'text-anchor': 'middle' }, e.label));
      e.el = g;
      return g;
    });
    const nodeEls = new Map(ids.map((id) => {
      const c = charOf(id), face = uFace(c);
      const g = s('g', { class: 'node o-' + originOf(c), tabindex: '0', role: 'button', 'aria-label': c.name + ' 관계 보기' },
        s('circle', { r: 31, class: 'ring' }),
        face && face.crop ? s('g', { 'clip-path': 'url(#u-clip)' }, s('svg', { x: -28, y: -28, width: 56, height: 56, viewBox: face.crop.join(' '), preserveAspectRatio: 'xMidYMid slice' },
          s('image', { href: face.src, width: face.size[0], height: face.size[1], style: 'image-rendering:pixelated' })))
        : face ? s('image', { href: face.src, x: -28, y: -28, width: 56, height: 56, 'clip-path': 'url(#u-clip)', preserveAspectRatio: face.pixel ? 'xMidYMin meet' : 'xMidYMid slice', style: face.pixel ? 'image-rendering:pixelated' : null })
          : s('g', { class: 'drop' }, s('circle', { r: 27, class: 'bub' }), s('ellipse', { cx: -9, cy: -11, rx: 7, ry: 4.5, class: 'shine', transform: 'rotate(-30 -9 -11)' }),
              s('text', { y: 8, 'text-anchor': 'middle', class: 'ini' }, (c.name || '?').slice(0, 1))),
        s('text', { y: 50, 'text-anchor': 'middle', class: 'name' }, c.name));
      g.addEventListener('mouseenter', () => { st.hover = id; paint(); });
      g.addEventListener('mouseleave', () => { st.hover = null; paint(); });
      g.addEventListener('focus', () => { st.hover = id; paint(); });
      g.addEventListener('blur', () => { st.hover = null; paint(); });
      g.addEventListener('click', () => select(id));
      g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(id); } else if (ev.key === 'Escape') select(null); });
      return [id, g];
    }));

    // 자리 그리기: 점과 선, 이름표(선 가운데, 선 방향과 상관없이 가로)
    const draw = () => {
      for (const [id, g] of nodeEls) { const p = pos.get(id); g.setAttribute('transform', `translate(${p.x},${p.y})`); }
      for (const e of edges) {
        const a = pos.get(e.a), b = pos.get(e.b), [ln, bg, tx] = e.el.children;
        ln.setAttribute('x1', a.x); ln.setAttribute('y1', a.y); ln.setAttribute('x2', b.x); ln.setAttribute('y2', b.y);
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, w = [...e.label].length * 12.5 + 14;
        bg.setAttribute('x', mx - w / 2); bg.setAttribute('y', my - 10); bg.setAttribute('width', w);
        tx.setAttribute('x', mx); tx.setAttribute('y', my + 4.5);
      }
    };
    // 자리 옮기기: 0.45초 동안 부드럽게(움직임 줄이기 설정이면 바로)
    let anim = 0;
    const moveTo = (target) => {
      const from = new Map([...pos].map(([id, p]) => [id, { ...p }])), t0 = performance.now(), dur = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450;
      cancelAnimationFrame(anim);
      const step = (now) => {
        const k = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - (1 - k) ** 3;
        for (const [id, p] of pos) { const f = from.get(id), t = target.get(id) || f; p.x = f.x + (t.x - f.x) * e; p.y = f.y + (t.y - f.y) * e; }
        draw();
        if (k < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    };
    // 중심 보기 자리: 고른 인물은 가운데, 이어진 인물은 둘레(전체도에서의 방향 순서를 지켜 덜 꼬이게), 나머지는 제자리
    const egoLayout = (id) => {
      const t = new Map([...base].map(([k, p]) => [k, { ...p }]));
      const cx = W / 2, cy = H / 2, list = nbrs(id).map((e) => (e.a === id ? e.b : e.a));
      const c0 = base.get(id);
      list.sort((p, q) => Math.atan2(base.get(p).y - c0.y, base.get(p).x - c0.x) - Math.atan2(base.get(q).y - c0.y, base.get(q).x - c0.x));
      t.set(id, { x: cx, y: cy });
      const R = Math.min(W, H) * 0.34;
      list.forEach((n, i) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(list.length, 1); t.set(n, { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) * 0.92 }); });
      return t;
    };

    // 옆 칸: 전체도면 읽는 법, 중심 보기면 고른 인물의 관계 목록
    const panel = h('aside', { class: 'g-panel', 'aria-live': 'polite' });
    const fillPanel = () => {
      if (!st.sel) {
        panel.replaceChildren(h('p', { class: 'g-kicker', text: '관계도 읽는 법' }),
          h('p', { class: 'g-help', text: '인물에 마우스를 올리면 그 인물의 관계가 밝아집니다. 인물을 누르면 그 인물을 가운데 두고 이어진 인물과 관계 설명을 보여 줍니다.' }),
          h('p', { class: 'g-help', text: '선 무늬는 관계 갈래, 얼굴 테두리 색은 출신 게임입니다. 위쪽 칩으로 갈래를 거를 수 있습니다.' }));
        return;
      }
      const c = charOf(st.sel), list = nbrs(st.sel);
      panel.replaceChildren(
        h('p', { class: 'g-kicker', text: '관계 ' + list.length + '개' }),
        h('h4', { text: c.name }),
        c.role ? h('p', { class: 'g-role', text: c.role }) : null,
        h('ul', { class: 'g-rels' }, list.map((e) => {
          const other = e.a === st.sel ? e.b : e.a;
          return h('li', { class: 'k-' + e.kind },
            h('button', { type: 'button', class: 'g-who', text: charOf(other).name, onclick: () => select(other) }),
            h('span', { class: 'g-label', text: e.label }),
            h('p', { text: e.text }));
        })),
        h('div', { class: 'g-actions' },
          h('a', { href: '#char-' + st.sel, text: '인물 설명 보기' }),
          h('button', { type: 'button', text: '전체 보기', onclick: () => select(null) })));
    };

    // 칠하기: 강조할 인물(골랐거나 마우스를 올린 인물)과 이어진 선, 인물만 밝게, 거른 갈래의 선은 숨긴다
    const paint = () => {
      const focus = st.hover || st.sel;
      const near = new Set(focus ? [focus, ...nbrs(focus).map((e) => (e.a === focus ? e.b : e.a))] : []);
      const egoSet = st.sel ? new Set([st.sel, ...nbrs(st.sel).map((e) => (e.a === st.sel ? e.b : e.a))]) : null;
      svg.classList.toggle('g-focus', !!focus);
      svg.classList.toggle('g-ego', !!st.sel);
      for (const [id, g] of nodeEls) {
        g.classList.toggle('near', near.has(id));
        g.classList.toggle('sel', id === st.sel);
        g.classList.toggle('away', !!egoSet && !egoSet.has(id));
      }
      for (const e of edges) {
        const hl = !!focus && (e.a === focus || e.b === focus) && on(e);
        e.el.classList.toggle('hl', hl);
        e.el.classList.toggle('off', !on(e) || (!!egoSet && !(egoSet.has(e.a) && egoSet.has(e.b) && (e.a === st.sel || e.b === st.sel))));
      }
    };
    const select = (id) => {
      st.sel = id && ids.includes(id) ? id : null;
      moveTo(st.sel ? egoLayout(st.sel) : base);
      fillPanel(); paint();
      if (st.sel) nodeEls.get(st.sel).focus({ preventScroll: true });
    };

    // 위쪽: 인물 찾기 + 관계 갈래 칩(범례 겸용)
    const search = h('input', { type: 'search', class: 'g-search', placeholder: '인물 찾기', 'aria-label': '관계도에서 인물 찾기', list: 'g-names' });
    const pick = () => { const v = search.value.trim(); const hit = ids.find((id) => charOf(id).name === v) || ids.find((id) => v && charOf(id).name.includes(v)); if (hit) { select(hit); search.value = ''; } };
    search.addEventListener('change', pick);
    search.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') pick(); });
    const chips = REL_KIND.filter((k) => edges.some((e) => e.kind === k.id)).map((k) => {
      const b = h('button', { type: 'button', class: 'g-chip k-' + k.id, 'aria-pressed': 'true' },
        s('svg', { width: 26, height: 8, 'aria-hidden': 'true' }, s('line', { x1: 1, y1: 4, x2: 25, y2: 4 })), k.name);
      b.addEventListener('click', () => {
        if (st.kinds.has(k.id)) st.kinds.delete(k.id); else st.kinds.add(k.id);
        b.setAttribute('aria-pressed', String(st.kinds.has(k.id)));
        if (st.sel) moveTo(egoLayout(st.sel));
        fillPanel(); paint();
      });
      return b;
    });
    const bar = h('div', { class: 'g-bar' }, search, h('datalist', { id: 'g-names' }, ids.map((id) => h('option', { value: charOf(id).name }))), h('div', { class: 'g-chips' }, chips));

    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'group', 'aria-label': '인물 관계도' },
      s('defs', {}, s('clipPath', { id: 'u-clip' }, s('circle', { r: 28 }))),
      s('image', { href: 'map/graph-bg.webp', x: 0, y: 0, width: W, height: H, preserveAspectRatio: 'xMidYMid slice', class: 'g-art', 'aria-hidden': 'true' }),   // 은은한 배경(가장자리만 꾸밈)
      s('rect', { x: 0, y: 0, width: W, height: H, class: 'g-bg' }),
      s('g', { class: 'edges' }, edgeEls), s('g', { class: 'nodes' }, [...nodeEls.values()]));
    svg.querySelector('.g-bg').addEventListener('click', () => select(null));   // 빈 곳을 누르면 전체 보기
    draw(); fillPanel(); paint();
    return h('figure', { class: 'u-graph' }, bar, h('div', { class: 'g-stage' }, svg, panel),
      h('figcaption', {}, '얼굴 그림이 없는 인물은 출신 게임 색의 물방울로 보입니다: ',
        ...[['bnb', '크레이지아케이드'], ['bf', '버블파이터'], ['kart', '카트라이더']].map(([k, t]) => h('span', { class: 'o-chip o-' + k, text: t }))));
  }

  function renderUnified(U) {
    const chars = U.characters || [];
    nameOf = (id) => (chars.find((c) => c.id === id) || {}).name || id;
    const rels = U.relations || [];
    const cast = chars.slice(0, 6).map((c) => faceOf({ id: c.id, name: c.name, aka: [...(c.aka || []), ...(c.faces || [])] })).filter(Boolean).slice(0, 5);
    // 구역 제목과 설명은 md 의 '# 제목' 과 그 아래 문단(heads). 없으면 아래 기본 글
    const HD = U.heads || {};
    const sec = (id, title, sub, ...kids) => {
      const m = HD[id];
      if (m && m.title) { title = m.title; sub = m.sub || null; }
      return h('section', { class: 'w-sec', id }, h('h2', { text: title }), sub ? h('p', { class: 'sub', text: sub }) : null, ...kids);
    };
    // 탭: 구역마다 한 탭. 주소 꼬리(#places, #place-forest, #char-dao …)가 탭과 펼침을 정한다(route)
    const TABS = [['world-about', '세계'], ['places', '장소'], ['characters', '인물'], ['factions', '세력'], ['story', '이야기'], ['use', '쓰는 법']];
    const foldBar = () => h('div', { class: 'u-fold-bar' },
      h('button', { type: 'button', text: '모두 펼치기', onclick: (e) => e.target.closest('.w-sec').querySelectorAll('details.u-fold').forEach((d) => { d.open = true; }) }),
      h('button', { type: 'button', text: '모두 접기', onclick: (e) => e.target.closest('.w-sec').querySelectorAll('details.u-fold').forEach((d) => { d.open = false; }) }));
    root.replaceChildren(
      h('section', { class: 'w-hero' },
        h('div', {},
          h('p', { class: 'kicker', text: '통합세계관' }),
          h('h1', { text: U.title }),
          U.tagline ? h('p', { class: 'lede', text: U.tagline }) : null,
          (U.intro || []).map((t) => h('p', { class: 'u-intro', text: t }))),
        h('div', { class: 'w-cast', 'aria-hidden': 'true' }, cast.map((f) => h('img', { src: f.src, alt: '' })))),
      h('nav', { class: 'u-tabs', 'aria-label': '세계관 구역' }, TABS.map(([id, t]) => h('a', { href: '#' + id, 'data-tab': id, text: t }))),
      h('section', { class: 'w-sec', id: 'world-about' }, (U.sections || []).map((x) => h('div', { class: 'u-section', id: 'sec-' + x.id }, h('h2', { text: x.title }), bullets(x.items)))),
      U.places ? sec('places', '버블힐 지역과 그 바깥', '붐힐마을은 버블힐 지역에 속한 마을입니다. 마을 안의 크레이지파크에서 아케이드, 버블파이팅, 레이싱 경기가 열립니다.',
        U.places.root ? placeMap(U.places.root, U.places.outside) : null,
        foldBar(),
        U.places.root ? placeCard(U.places.root, 0) : null,
        (U.places.outside || []).length ? h('div', { class: 'u-outside' }, h('h3', { class: 'u-h3', text: (HD.outside && HD.outside.title) || '버블힐 바깥' }), h('div', { class: 'w-grid' }, U.places.outside.map((p) => placeCard(p, 1)))) : null) : null,
      // 인물: 장소처럼 그림(관계도)을 위에, 인물 카드를 아래에 둔다. 관계 전체 목록은 접어 둔다
      chars.length ? sec('characters', '인물', null,
        rels.length ? h('div', { class: 'u-rel-wrap', id: 'relations' }, relGraph(rels, chars)) : null,
        foldBar(),
        h('div', { class: 'w-grid u-char-grid' }, chars.map((c) => charCard(c, rels))),
        rels.length ? h('details', { class: 'u-rel-more' }, h('summary', { text: `관계 전체 목록 (${rels.length})` }),
          h('ul', { class: 'u-rel u-rel-all' }, rels.map((r) => h('li', {}, h('a', { href: '#char-' + r.a, text: nameOf(r.a) }), ' - ', h('a', { href: '#char-' + r.b, text: nameOf(r.b) }), h('span', { class: 'u-label', text: r.label }), r.text)))) : null) : null,
      (U.factions || []).length ? sec('factions', '세력', null, h('div', { class: 'w-grid' }, U.factions.map((f) => h('article', { class: 'w-card', id: 'faction-' + f.id }, h('h3', { text: f.name }), bullets(f.items))))) : null,
      (U.story || []).length ? sec('story', '이어지는 이야기', null, h('ol', { class: 'u-story' }, U.story.map((x) => h('li', { id: 'story-' + x.id }, h('h3', { text: x.title }), bullets(x.items))))) : null,
      (U.use || []).length ? sec('use', '이 세계관을 쓸 때', 'Lab Track 참가 승인을 받아 이 세계관으로 작업할 때 참고할 안내입니다.', useList(U.use)) : null);
  }
  // 쓰는 법: 처음 나오는 '이용약관'을 이용 조건 페이지로 잇는다. 공식 주소는 NOTICE 한 곳에서만 관리하고 terms.html 이 그것을 보여 준다
  function useList(items) {
    let linked = false;
    return h('ul', { class: 'u-list u-use' }, items.map((x) => {
      const s = text(x), m = linked ? -1 : s.indexOf('이용약관');
      if (m < 0) return h('li', { text: s });
      linked = true;
      return h('li', {}, s.slice(0, m), h('a', { href: '../terms.html', text: '이용약관' }), s.slice(m + 4));
    }));
  }
  // 주소 꼬리 → 탭 고르기, 접힌 카드 펼치기, 그 자리로 내려가기
  function route(first) {
    const tabs = [...root.querySelectorAll('.u-tabs a')];
    if (!tabs.length) return;
    const id = decodeURIComponent(location.hash.slice(1));
    const el = id ? document.getElementById(id) : null;
    const sec = (el && (el.classList.contains('w-sec') ? el : el.closest('.w-sec'))) || document.getElementById(tabs[0].dataset.tab);
    for (const a of tabs) {
      const on = a.dataset.tab === sec.id;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      const s = document.getElementById(a.dataset.tab);
      if (s) s.hidden = !on;
    }
    if (el && el !== sec) {
      const own = el.querySelector(':scope > details.u-fold');
      if (own) own.open = true;
      for (let d = el.parentElement && el.parentElement.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) d.open = true;
      requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
    } else {
      const nav = root.querySelector('.u-tabs');   // 탭을 눌렀으면 탭 줄이 화면 위에 오게(이미 보이면 그대로)
      if (nav && (nav.getBoundingClientRect().top < 0 || (first === true && el))) requestAnimationFrame(() => nav.scrollIntoView({ block: 'start' }));   // 처음 열 때 #places 같은 꼬리면 그 탭으로 내려간다
    }
  }

  function setGame(id) {
    st.game = id || null;
    const hash = st.game ? '#g=' + encodeURIComponent(st.game) : '';
    if (location.hash.startsWith('#g=') || !location.hash || !hash) history.replaceState(null, '', location.pathname + location.search + hash);
    render();
  }

  function render() {
    const L = st.lore;
    const cast = ['다오', '배찌', '디지니', '마리드', '케피'].map((n) => st.faces.get(n)).filter(Boolean);
    const used = [...new Set([...L.games.map((g) => g.id)])];
    root.replaceChildren(
      h('section', { class: 'w-hero' },
        h('div', {},
          h('p', { class: 'kicker', text: root.dataset.kicker || '작품별 기록' }),
          h('h1', { text: L.intro.title }),
          h('p', { class: 'lede', text: L.intro.lead }),
          (L.intro.reading || []).length ? h('ul', { class: 'w-reading' }, L.intro.reading.map((t) => h('li', { text: t }))) : null),
        h('div', { class: 'w-cast', 'aria-hidden': 'true' }, cast.map((f) => h('img', { src: f.src, alt: '' })))),
      h('nav', { class: 'w-filter', 'aria-label': '작품 고르기' },
        h('button', { type: 'button', class: 'w-chip', 'aria-pressed': String(!st.game), onclick: () => setGame(null), text: '전체' }),
        used.map((g) => h('button', { type: 'button', class: 'w-chip', 'data-game': g, 'aria-pressed': String(st.game === g), onclick: () => setGame(g), text: gameTitle(g) }))),
      h('nav', { class: 'w-jump', 'aria-label': '바로 가기' },
        [['games', '작품'], ...KINDS.map((k) => [k.key, k.title]), ['timeline', '연표'], ['sources', '출처']].map(([id, t]) => h('a', { href: '#' + id, text: t }))),
      gamesSection(),
      ...KINDS.map((k) => kindSection(k)),
      timelineSection(),
      sourcesSection());
    requestAnimationFrame(filterHeight);
  }

  async function main() {
    const mode = root.dataset.mode || 'unified';
    const src = root.dataset.src || 'lore.json';
    st.site = await json(ROOT + 'games/index.json').catch(() => ({ games: [] }));
    if (mode === 'unified') {
      try {
        let U, problems = [];
        if (src.endsWith('/')) {
          try { const r = await loadMd(src); U = r.doc; problems = r.errors; }
          catch (e) { U = await json('lore.json'); }   // md 를 못 읽으면 함께 내보낸 lore.json 으로
        } else U = await json(src);
        await loadFaces();
        renderUnified(U);
        const box = mdProblems(problems);
        if (box) root.prepend(box);
        route(true);
        window.addEventListener('hashchange', () => route());
      } catch (e) {
        root.replaceChildren(h('p', { class: 'error', text: '세계관을 읽지 못했습니다. ' + e.message }));
      }
      return;
    }
    try {
      const lore = await json(src);
      st.lore = lore;
      for (const g of st.site.games || []) if (!g.pending) st.assetGames.add(g.id);
      await loadFaces();
      const m = /^#g=([^&]+)/.exec(location.hash);
      st.game = m && lore.games.some((g) => g.id === decodeURIComponent(m[1])) ? decodeURIComponent(m[1]) : null;
      render();
      if (location.hash && !location.hash.startsWith('#g=')) document.getElementById(location.hash.slice(1))?.scrollIntoView();
    } catch (e) {
      root.replaceChildren(h('p', { class: 'error', text: '세계관 기록을 읽지 못했습니다. ' + e.message }));
    }
  }
  // 붙어 있는 상단 막대, 작품 고르기 줄의 높이(좁은 화면에서 줄이 늘어난다)를 CSS 에 알려 준다
  function trackHeight(sel, name) {
    const el = document.querySelector(sel);
    if (el && 'ResizeObserver' in window) new ResizeObserver(() => document.documentElement.style.setProperty(name, el.offsetHeight + 'px')).observe(el);
  }
  function filterHeight() {
    const f = root.querySelector('.w-filter');
    if (f) document.documentElement.style.setProperty('--filter-h', f.offsetHeight + 'px');
  }
  // ── md 읽기 시작 ── 세계관 md 여덟 개 → 데이터
  const LORE_FILES = ['00_intro.md', '10_world.md', '20_places.md', '30_characters.md', '40_relations.md', '50_factions.md', '60_story.md', '70_use.md'];
  function parseLore(texts) {
    const OUTSIDE = 'outside', SEP = '/';
    const CHAR_FIELDS = { 역할: 'role', '다른 이름': 'aka', '게임 속 이름': 'faces', '크아 캐릭터': 'bnb', '2D 얼굴': 'face2d', 출신: 'origin' };
    const PLACE_FIELDS = { '다른 이름': 'aka', 위치: 'pos', 에셋: 'assets' };
    const LIST = new Set(['aka', 'faces', 'assets']);
    const BANNED = /[\u2014\u00b7\u300a\u300b\u00ab\u00bb]/;
    const HEAD = /^(#{1,6})\s+(.*?)\s*(?:\{#([^}\s]+)\})?\s*$/, BULLET = /^\s*[-*]\s+(.*?)\s*$/, QUOTE = /^>\s?(.*?)\s*$/;
    const FIELD = /^([^:]+?)\s*:\s*(.*?)\s*$/, REL = /^(.+?)\s+-\s+(.+?)\s*:\s*(.+?)$/;
    const errors = [], notes = [];
    const node = (level, title, id, line) => ({ level, title, id, line, trace: null, items: [], lines: [], paras: [], quotes: [], open: false });
    function lex(name, text) {
      const traces = [];
      text = text.replace(/\r\n/g, '\n').replace(/^﻿+/, '').replace(/<!--((?:(?!<!--)[\s\S])*?)-->/g, (all, body) => {
        body = body.trim();
        const nl = '\n'.repeat((all.match(/\n/g) || []).length);
        if (body.startsWith('근거:')) { traces.push(body.slice(3).trim()); return `\x00${traces.length - 1}\x00` + nl; }
        if (body.startsWith('메모:')) notes.push(body.slice(3).trim());
        return nl;
      });
      const nodes = [node(0, '', null, 0)];
      text.split('\n').forEach((raw, i) => {
        const no = i + 1;
        const trs = [...raw.matchAll(/\x00(\d+)\x00/g)].map((m) => traces[+m[1]]);
        const line = raw.replace(/\x00(\d+)\x00/g, '').trimEnd();
        const tr = trs.join(' ') || null;
        const cur = nodes[nodes.length - 1];
        if (line.includes('<!--') || line.includes('-->')) { errors.push(`${name} ${no}줄: 주석이 닫히지 않았다(<!-- … --> 짝)`); return; }
        if (!line.trim()) {
          if (tr) { if (cur.items.length) cur.items[cur.items.length - 1].trace = tr; else cur.trace = tr; }
          cur.open = false;
          return;
        }
        let m = HEAD.exec(line);
        if (m) { const n = node(m[1].length, m[2].trim(), m[3] || null, no); n.trace = tr; nodes.push(n); return; }
        m = BULLET.exec(line);
        if (m) { const it = { text: m[1] }; if (tr) it.trace = tr; cur.items.push(it); cur.open = false; return; }
        m = QUOTE.exec(line);
        if (m) { cur.quotes.push(m[1]); return; }
        cur.lines.push([line.trim(), tr, no]);
        if (cur.open) cur.paras[cur.paras.length - 1].push(line.trim()); else { cur.paras.push([line.trim()]); cur.open = true; }
      });
      return nodes;
    }
    const item = (it) => ({ ...it });
    const paraText = (n) => n.paras.map((p) => p.join(' ')).join(' ');
    const head = (n) => { if (!n) return {}; const o = { title: n.title }; const sub = paraText(n); if (sub) o.sub = sub; return o; };
    function fields(name, n, allowed) {
      const vals = {}, ltr = {};
      for (const [text, tr, no] of n.lines) {
        const m = FIELD.exec(text);
        const key = m && allowed[m[1].trim()];
        if (!key) { errors.push(`${name} ${no}줄: 알 수 없는 줄이다. 글머리는 '- ', 정보는 ${Object.keys(allowed).join(', ')} 가운데 하나로 시작한다: ${text.slice(0, 40)}`); continue; }
        const v = m[2];
        if (LIST.has(key)) vals[key] = v.split(SEP).map((x) => x.trim()).filter(Boolean);
        else if (key === 'face2d') { try { vals[key] = JSON.parse(v); } catch { errors.push(`${name} ${no}줄: 2D 얼굴 값이 JSON 이 아니다`); continue; } }
        else vals[key] = v;
        if (tr) ltr[key] = tr;
      }
      return [vals, ltr];
    }
    const noParas = (name, n) => { for (const [text, , no] of n.lines) errors.push(`${name} ${no}줄: 여기에는 '- ' 글머리만 쓴다: ${text.slice(0, 40)}`); };
    function top(name, nodes) {
      if (nodes[0].lines.length || nodes[0].items.length) errors.push(`${name}: 첫 '# 제목' 앞에 글이 있다`);
      const tops = nodes.filter((n) => n.level === 1);
      if (tops.length !== 1) errors.push(`${name}: '# 제목' 은 하나여야 한다(지금 ${tops.length})`);
      const t = tops[0] || null;
      if (t && t.items.length && name !== '70_use.md') errors.push(`${name} ${t.line}줄: 제목 바로 아래에는 설명 문단만 쓴다(글머리는 '## ' 항목 아래에)`);
      return [t, nodes.filter((n) => n.level >= 2)];
    }
    const doc = { schema: 'boomhill-world/unified/v2' }, heads = {}, lexed = {};
    for (const name of LORE_FILES) {
      let t = texts[name];
      if (t == null) { errors.push(`${name}: 파일이 없다`); t = `# ${name}\n`; }
      lexed[name] = lex(name, t);
    }
    let name = '00_intro.md', [t, rest] = top(name, lexed[name]);
    for (const n of rest) errors.push(`${name} ${n.line}줄: 소개에는 '## ' 항목을 쓰지 않는다`);
    doc.title = t ? t.title : '';
    if (t && t.quotes.length) doc.tagline = t.quotes.join(' ');
    doc.intro = t ? t.paras.map((p) => p.join(' ')) : [];

    name = '10_world.md'; [t, rest] = top(name, lexed[name]);
    heads.world = head(t);
    doc.sections = [];
    for (const n of rest) {
      if (n.level !== 2) { errors.push(`${name} ${n.line}줄: '## ' 까지만 쓴다`); continue; }
      noParas(name, n);
      doc.sections.push({ id: n.id || n.title, title: n.title, items: n.items.map(item) });
    }

    name = '20_places.md'; [t, rest] = top(name, lexed[name]);
    heads.places = head(t);
    const stack = [], level2 = [];
    for (const n of rest) {
      const [vals, ltr] = fields(name, n, PLACE_FIELDS);
      const p = { id: n.id || n.title, name: n.title, aka: vals.aka || [], items: n.items.map(item) };
      if ('pos' in vals) p.pos = vals.pos;
      if ('assets' in vals) p.assets = vals.assets;
      const tr = n.trace || ltr.aka;
      if (tr) p.trace = tr;
      while (stack.length && stack[stack.length - 1][0] >= n.level) stack.pop();
      if (n.level === 2) level2.push(p);
      else if (stack.length && stack[stack.length - 1][0] === n.level - 1) { const par = stack[stack.length - 1][1]; (par.children = par.children || []).push(p); }
      else { errors.push(`${name} ${n.line}줄: 제목 단계를 건너뛰었다('${'#'.repeat(n.level - 1)} ' 아래에 '${'#'.repeat(n.level)} ')`); continue; }
      stack.push([n.level, p]);
    }
    const roots = level2.filter((p) => p.id !== OUTSIDE), outs = level2.filter((p) => p.id === OUTSIDE);
    if (roots.length !== 1) errors.push(`${name}: 가장 큰 장소('## ', {#${OUTSIDE}} 아닌 것)는 하나여야 한다(지금 ${roots.length})`);
    const places = {};
    if (roots.length) places.root = roots[0];
    if (outs.length) {
      heads.outside = { title: outs[0].name };
      if (outs[0].items.length) errors.push(`${name}: '${outs[0].name}' 묶음 바로 아래에는 글머리를 쓰지 않는다('### ' 장소 아래에)`);
      places.outside = outs[0].children || [];
    }
    doc.places = places;

    name = '30_characters.md'; [t, rest] = top(name, lexed[name]);
    heads.characters = head(t);
    const chars = [];
    for (const n of rest) {
      if (n.level === 2) {
        const [vals, ltr] = fields(name, n, CHAR_FIELDS);
        if (n.items.length) errors.push(`${name} ${n.line}줄: 인물 글머리는 '### 성격' 같은 묶음 아래에 쓴다`);
        const c = { id: n.id || n.title, name: n.title };
        if ('role' in vals) c.role = vals.role;
        if ('aka' in vals) c.aka = vals.aka;
        c.faces = vals.faces || [];
        c.groups = [];
        if ('bnb' in vals) c.bnb = vals.bnb;
        if ('origin' in vals) c.origin = vals.origin;
        if ('face2d' in vals) { const f = vals.face2d; if ('face2d' in ltr) f.trace = ltr.face2d; c.face2d = f; }
        const tr = n.trace || ['role', 'aka', 'faces', 'bnb'].map((k) => ltr[k]).find(Boolean) || null;
        if (tr) c.trace = tr;
        chars.push(c);
      } else if (n.level === 3 && chars.length) {
        noParas(name, n);
        chars[chars.length - 1].groups.push({ title: n.title, items: n.items.map(item) });
      } else errors.push(`${name} ${n.line}줄: 인물은 '## 이름', 묶음은 '### 묶음' 이다`);
    }
    doc.characters = chars;

    name = '40_relations.md'; [t, rest] = top(name, lexed[name]);
    heads.relations = head(t);
    const who = new Map();
    for (const c of chars) for (const k of [c.id, c.name, ...(c.aka || [])]) if (!who.has(k)) who.set(k, c.id);
    const rels = [];
    for (const n of rest) {
      const m = n.level === 2 ? REL.exec(n.title) : null;
      if (!m) { errors.push(`${name} ${n.line}줄: 관계 제목은 '## 이름 - 이름 : 관계' 꼴이다`); continue; }
      const [a, b, label] = [m[1].trim(), m[2].trim(), m[3].trim()];
      for (const x of [a, b]) if (!who.has(x)) errors.push(`${name} ${n.line}줄: 인물 '${x}' 이 30_characters.md 에 없다`);
      if (n.items.length) errors.push(`${name} ${n.line}줄: 관계 설명은 글머리 없이 문단으로 쓴다`);
      const r = { a: who.get(a) || a, b: who.get(b) || b, label, text: paraText(n) };
      if (n.trace) r.trace = n.trace;
      rels.push(r);
    }
    doc.relations = rels;

    for (const [fn, key, tk] of [['50_factions.md', 'factions', 'name'], ['60_story.md', 'story', 'title']]) {
      [t, rest] = top(fn, lexed[fn]);
      heads[key] = head(t);
      const out = [];
      for (const n of rest) {
        if (n.level !== 2) { errors.push(`${fn} ${n.line}줄: '## ' 까지만 쓴다`); continue; }
        noParas(fn, n);
        const x = { id: n.id || n.title, [tk]: n.title, items: n.items.map(item) };
        if (n.trace) x.trace = n.trace;
        out.push(x);
      }
      doc[key] = out;
    }

    name = '70_use.md'; [t, rest] = top(name, lexed[name]);
    heads.use = head(t);
    for (const n of rest) errors.push(`${name} ${n.line}줄: 쓰는 법에는 '## ' 항목을 쓰지 않는다`);
    doc.use = (t ? t.items : []).map((i) => i.text);
    if (t && t.items.some((i) => 'trace' in i)) errors.push(`${name}: 쓰는 법 글머리에는 근거를 달지 않는다`);

    doc.heads = heads;
    if (notes.length) doc._notes = notes;
    // id 겹침, 공개 글 금지 문자
    for (const [kind, lst] of [['인물', doc.characters], ['세계', doc.sections], ['세력', doc.factions], ['이야기', doc.story]]) {
      const seen = new Set();
      for (const x of lst) { if (seen.has(x.id)) errors.push(`${kind} id '${x.id}' 가 두 번 나온다`); seen.add(x.id); }
    }
    const seenP = new Set();
    const walkP = (p) => { if (seenP.has(p.id)) errors.push(`장소 id '${p.id}' 가 두 번 나온다`); seenP.add(p.id); (p.children || []).forEach(walkP); };
    if (places.root) walkP(places.root);
    (places.outside || []).forEach(walkP);
    const walk = (x) => {
      if (Array.isArray(x)) x.forEach(walk);
      else if (x && typeof x === 'object') { for (const [k, v] of Object.entries(x)) if (k !== 'trace' && k !== 'face2d' && !k.startsWith('_')) walk(v); }
      else if (typeof x === 'string' && BANNED.test(x)) errors.push(`공개 글에 쓰지 않는 문자 '${BANNED.exec(x)[0]}': ${x.slice(0, 40)}`);
    };
    walk(doc);
    return { doc, errors };
  }
  // ── md 읽기 끝 ──
  // md 폴더(data-src 가 '/' 로 끝남)를 읽는다. 고친 뒤 새로 고침하면 바로 보이게 캐시를 쓰지 않는다
  async function loadMd(dir) {
    const texts = {};
    await Promise.all(LORE_FILES.map(async (n) => {
      const r = await fetch(dir + encodeURIComponent(n), { cache: 'no-cache' });
      if (r.ok) texts[n] = await r.text();
    }));
    if (!Object.keys(texts).length) throw new Error(dir + ' 에 세계관 md 가 없다');
    return parseLore(texts);
  }
  function mdProblems(errors) {
    if (!errors.length) return null;
    return h('details', { class: 'u-problems', open: true },
      h('summary', { text: `md 형식 문제 ${errors.length}건: 고친 뒤 새로 고침하세요. 읽을 수 있는 만큼은 아래에 보입니다.` }),
      h('ul', {}, errors.slice(0, 50).map((e) => h('li', { text: e }))));
  }
  window.__world = st;
  trackHeight('.bar', '--bar-h');
  addEventListener('resize', filterHeight);
  main();
})();
