// 메인: 제품군을 고르면 주력·신제품 카드를 보여 준다
(async () => {
  const { FEATURED, CATEGORIES, esc } = Site;
  const chips = document.querySelector('#chips');
  const grid = document.querySelector('#featured');
  const more = document.querySelector('#more');
  let products = [];

  function show(cat) {
    chips.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.cat === cat));
    more.href = 'products.html#' + encodeURIComponent(cat);
    more.textContent = cat + ' 전체 보기';
    grid.innerHTML = FEATURED[cat].map(([name, tag]) => {
      const p = products.find(x => x.category === cat && x.name === name);
      return p ? Site.card(p, tag) : '';
    }).join('');
  }

  try {
    products = await Site.load();
    Site.wire(products);
    chips.innerHTML = CATEGORIES.map(c => `<button type="button" data-cat="${c}">${c}</button>`).join('');
    chips.addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(b.dataset.cat); });
    show(CATEGORIES[0]);
  } catch (err) {
    grid.innerHTML = `<p class="empty">${esc(err.message)}. 새로 고침 해 주세요.</p>`;
  }
})();
