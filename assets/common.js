// 모든 페이지가 함께 쓰는 것: 금액 자료 읽기, 상담 바구니, 메인에 보여 줄 제품 목록
const Site = (() => {
  // 메인에 보여 줄 주력·신제품. 이름은 data/catalog-prices.json 의 name 과 똑같이 적는다.
  // 두 번째 칸에 '신제품'을 적으면 꼬리표가 붙는다.
  const FEATURED = {
    '정수기': [['아이콘 정수기 3'], ['아이콘 얼음정수기 미니', '신제품'], ['카페 얼음정수기', '신제품'], ['스위치 빌트인']],
    '공기청정기': [['노블 공기청정기2'], ['스퀘어핏 공기청정기'], ['히티브 온풍 공기청정기']],
    '비데': [['프라임 비데'], ['스타일 비데 플러스'], ['더매너 비데 플러스']],
    '매트리스': [['비렉스 스마트 매트리스 S8+', '신제품'], ['시그니처 파이어쉴드 컴포트', '신제품'], ['하이브리드 4']],
  };
  const CATEGORIES = ['정수기', '공기청정기', '비데', '매트리스'];
  const BASKET_KEY = 'consult-basket-v1';

  let cache;
  const load = () => cache || (cache = fetch('data/catalog-prices.json').then(r => {
    if (!r.ok) throw new Error('금액 자료를 불러오지 못했어요');
    return r.json();
  }).then(group));

  function group(rows) {
    const map = new Map();
    for (const r of rows) {
      const key = r.category + '|' + r.name;
      if (!map.has(key)) map.set(key, { key, category: r.category, name: r.name, variants: [] });
      map.get(key).variants.push(r);
    }
    return [...map.values()];
  }

  const won = n => n.toLocaleString('ko-KR');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // 제품에서 가장 낮은 월 렌탈료와 그 조건
  function lowest(product) {
    let best = null;
    for (const v of product.variants) for (const p of v.prices) {
      const price = p.promo ?? p.rental;
      if (price == null) continue;
      if (!best || price < best.price) {
        best = { price, normal: p.promo != null ? p.rental : null, years: p.years, variant: v.variant, care: [v.care, v.cycle].filter(Boolean).join(' ') };
      }
    }
    return best;
  }
  const condition = b => [b.years + '년 약정', b.variant, b.care].filter(Boolean).join(', ');

  // 상담 바구니 (이 브라우저에만 저장된다)
  function basket() {
    try { return JSON.parse(localStorage.getItem(BASKET_KEY)) || []; } catch { return []; }
  }
  function saveBasket(items) {
    try { localStorage.setItem(BASKET_KEY, JSON.stringify(items)); } catch {}
    document.dispatchEvent(new CustomEvent('basket-change'));
  }
  const inBasket = key => basket().some(i => i.key === key);
  function toggle(product) {
    const items = basket();
    const at = items.findIndex(i => i.key === product.key);
    if (at >= 0) items.splice(at, 1); else items.push({ key: product.key, category: product.category, name: product.name });
    saveBasket(items);
  }
  const remove = key => saveBasket(basket().filter(i => i.key !== key));
  const clear = () => saveBasket([]);

  // 담기 버튼: 누르면 담고, 다시 누르면 뺀다
  function addButton(product, extraClass = '') {
    const on = inBasket(product.key);
    return `<button type="button" class="btn btn-small ${on ? 'btn-main' : 'btn-line'} ${extraClass}" data-add="${esc(product.key)}" aria-pressed="${on}">${on ? '담았어요' : '바구니에 담기'}</button>`;
  }
  function wireAddButtons(root, products) {
    root.addEventListener('click', e => {
      const btn = e.target.closest('[data-add]');
      if (!btn) return;
      const product = products.find(p => p.key === btn.dataset.add);
      if (product) toggle(product);
    });
  }
  function refreshAddButtons() {
    document.querySelectorAll('[data-add]').forEach(btn => {
      const on = inBasket(btn.dataset.add);
      btn.setAttribute('aria-pressed', on);
      btn.classList.toggle('btn-main', on);
      btn.classList.toggle('btn-line', !on);
      btn.textContent = on ? '담았어요' : '바구니에 담기';
    });
  }
  function refreshCounts() {
    const n = basket().length;
    document.querySelectorAll('[data-basket-count]').forEach(el => { el.textContent = n ? n + '개' : ''; el.hidden = !n; });
    document.querySelectorAll('[data-basket-bar]').forEach(el => { el.hidden = !n; });
  }
  document.addEventListener('basket-change', () => { refreshCounts(); refreshAddButtons(); });
  window.addEventListener('storage', () => { refreshCounts(); refreshAddButtons(); });
  document.addEventListener('DOMContentLoaded', refreshCounts);

  return { FEATURED, CATEGORIES, load, won, esc, lowest, condition, basket, inBasket, toggle, remove, clear, addButton, wireAddButtons, refreshCounts };
})();
