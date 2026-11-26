// 상단 메뉴(GNB) 공통: 뷰어가 아닌 페이지(통합세계관, 자료 안내, 기술 예시)의 게임 탭 줄을 뷰어와 같게 채운다.
// <header class="bar" data-root="../" data-current="lore"> : data-root 는 이 페이지에서 사이트 맨 위까지, data-current 는 고른 탭.
// 게임 목록(games/index.json)을 못 읽으면 통합세계관 탭만 둔다. 뷰어(index.html)는 viewer/app.js 가 같은 꼴로 그린다.
(function () {
  'use strict';
  const bar = document.querySelector('header.bar');
  const nav = bar && bar.querySelector('.tabs');
  if (!nav) return;
  const root = bar.dataset.root || '';
  const cur = bar.dataset.current || '';
  const tab = (href, text, game, on) => {
    const a = document.createElement('a');
    a.className = 'tab';
    a.href = href;
    a.textContent = text;
    if (game) a.dataset.game = game;
    if (on) a.setAttribute('aria-current', 'page');
    return a;
  };
  const lore = () => tab(root + 'lore/', '통합세계관', null, cur === 'lore');
  nav.replaceChildren(lore());
  fetch(root + 'games/index.json').then((r) => (r.ok ? r.json() : Promise.reject())).then((site) => {
    nav.replaceChildren(...(site.games || []).filter((g) => !g.pending)
      .map((g) => tab(root + 'index.html#/g/' + encodeURIComponent(g.id), g.title, g.id, cur === g.id)), lore());
    // 좁은 화면에서 탭 줄은 가로로 민다. 고른 탭이 화면 밖에 남지 않게 탭 줄만 옮긴다(페이지는 그대로)
    const on = nav.querySelector('[aria-current="page"]');
    if (on) {
      const over = on.getBoundingClientRect().right - nav.getBoundingClientRect().right;
      if (over > 0) nav.scrollLeft += over + 8;
    }
  }).catch(() => { /* 게임 탭 없이 통합세계관만 */ });
})();
