// 제품: 제품군 고르기, (매트리스는) 종류 고르기, 이름·모델명으로 찾기, 카드 목록
(async () => {
  const { CATEGORIES, MATTRESS_TYPES, esc } = Site;
  const PRODUCT_CATEGORIES = [...CATEGORIES, '가습기', '침대·프레임', '안마·마사지', '의류청정기', '전기레인지', '헬스케어', '벽걸이 에어컨'];
  const chips = document.querySelector('#chips');
  const typeChips = document.querySelector('#type-chips');
  const search = document.querySelector('#search');
  const grid = document.querySelector('#plist');
  const result = document.createElement('p');
  result.className = 'search-result note';
  result.hidden = true;
  grid.before(result);
  const fromHash = decodeURIComponent(location.hash.slice(1));
  let current = PRODUCT_CATEGORIES.includes(fromHash) ? fromHash : PRODUCT_CATEGORIES[0];
  let type = '전체';
  let products = [];

  function render() {
    // 검색어가 있으면 고른 제품군과 상관없이 전 제품에서 찾는다. 지우면 원래 제품군으로 돌아간다
    const norm = t => (t || '').toLowerCase().replace(/[\s-]/g, '');
    const q = norm(search.value);
    chips.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', !q && b.dataset.cat === current));
    // 매트리스일 때만 종류 고르기를 보여 준다
    typeChips.hidden = q || current !== '매트리스';
    typeChips.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.type === type));
    const inType = p => current !== '매트리스' || type === '전체' || MATTRESS_TYPES[type].includes(p.name);
    const MODEL_ALIASES = {
      '매트리스|모디': {
        'CMLK-SE02': ['CMLK-SE02H', 'CMLK-SE02M'],
        'CMK-SE02': ['CMK-SE02H', 'CMK-SE02M'],
        'CMQ-SE02': ['CMQ-SE02H', 'CMQ-SE02M'],
        'CMSS-SE02': ['CMSS-SE02H', 'CMSS-SE02M'],
      },
    };
    const hit = p => norm(p.name).includes(q) || norm(p.category).includes(q) || p.variants.some(v => norm(v.model).includes(q) || norm(v.variant).includes(q) || (MODEL_ALIASES[p.key]?.[v.model] || []).some(a => norm(a).includes(q)));
    const shown = q ? products.filter(hit) : products.filter(p => p.category === current && inType(p));
    result.hidden = !q;
    result.textContent = q ? `전체 제품에서 ${shown.length}개 찾았어요` : '';
    grid.innerHTML = shown.length ? shown.map(p => Site.card(p, q ? p.category : '')).join('') : `<p class="empty">찾는 제품이 없어요. 이름을 줄여서 다시 찾아보세요.</p>`;
  }

  try {
    products = await Site.load();
    Site.wire(products);
    chips.innerHTML = PRODUCT_CATEGORIES.map(c => `<button type="button" data-cat="${c}">${c}<span class="n">${products.filter(p => p.category === c).length}</span></button>`).join('');
    typeChips.innerHTML = ['전체', ...Object.keys(MATTRESS_TYPES)].map(t => `<button type="button" data-type="${t}">${t}</button>`).join('');
    chips.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; current = b.dataset.cat; type = '전체'; search.value = ''; history.replaceState(null, '', '#' + encodeURIComponent(current)); render(); });
    typeChips.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; type = b.dataset.type; render(); });
    search.addEventListener('input', render);
    render();
  } catch (err) {
    grid.innerHTML = `<p class="empty">${esc(err.message)}. 새로 고침 해 주세요.</p>`;
  }
})();
