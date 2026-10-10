// 제품: 제품군 고르기, 이름·모델명으로 찾기, 카드 목록
(async () => {
  const { CATEGORIES, esc } = Site;
  const chips = document.querySelector('#chips');
  const search = document.querySelector('#search');
  const grid = document.querySelector('#plist');
  const fromHash = decodeURIComponent(location.hash.slice(1));
  let current = CATEGORIES.includes(fromHash) ? fromHash : CATEGORIES[0];
  let products = [];

  function render() {
    chips.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.cat === current));
    const q = search.value.trim().toLowerCase();
    const shown = products.filter(p => p.category === current && (!q || p.name.toLowerCase().includes(q) || p.variants.some(v => (v.model || '').toLowerCase().includes(q))));
    grid.innerHTML = shown.length ? shown.map(p => Site.card(p)).join('') : `<p class="empty">찾는 제품이 없어요. 이름을 줄여서 다시 찾아보세요.</p>`;
  }

  try {
    products = await Site.load();
    Site.wire(products);
    chips.innerHTML = CATEGORIES.map(c => `<button type="button" data-cat="${c}">${c}<span class="n">${products.filter(p => p.category === c).length}</span></button>`).join('');
    chips.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; current = b.dataset.cat; history.replaceState(null, '', '#' + encodeURIComponent(current)); render(); });
    search.addEventListener('input', render);
    render();
  } catch (err) {
    grid.innerHTML = `<p class="empty">${esc(err.message)}. 새로 고침 해 주세요.</p>`;
  }
})();
