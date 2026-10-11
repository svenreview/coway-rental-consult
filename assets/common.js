// 모든 페이지가 함께 쓰는 것: 금액 자료 읽기, 제품 카드, 금액표 창, 장바구니
const Site = (() => {
  // 메인에 보여 줄 주력·신제품. 이름은 data/catalog-prices.json 의 name 과 똑같이 적는다.
  // 두 번째 칸에 '신제품'을 적으면 꼬리표가 붙는다.
  const FEATURED = {
    '정수기': [['아이콘 정수기 3'], ['아이콘 얼음정수기 미니', '신제품'], ['카페 얼음정수기', '신제품'], ['스위치 빌트인']],
    '공기청정기': [['노블 공기청정기2'], ['스퀘어핏 공기청정기'], ['히티브 온풍 공기청정기'], ['아이콘 공기청정기']],
    '비데': [['프라임 비데'], ['스타일 비데 플러스'], ['더매너 비데 플러스'], ['슬리믹 비데']],
    '매트리스': [['비렉스 스마트 매트리스 S8+', '신제품'], ['시그니처 파이어쉴드 컴포트', '신제품'], ['하이브리드 4'], ['컴팩트 메모리폼']],
  };
  const CATEGORIES = ['정수기', '공기청정기', '비데', '매트리스'];
  // 매트리스 종류: 카탈로그 목차의 분류를 따른다. 이름은 data/catalog-prices.json 의 name 과 똑같이 적는다.
  const MATTRESS_TYPES = {
    '스마트': ['비렉스 스마트 매트리스 S8+', '비렉스 스마트 매트리스 S6+'],
    '스프링 9존': ['시그니처 파이어쉴드 컴포트', '시그니처 파이어쉴드', '시그니처 컴포트', '시그니처'],
    '스프링 7존': ['하이브리드 4', '하이브리드 3', '루네어', '더블 사이드'],
    '스프링 모노존': ['더블체인지', '모디', '엘리트'],
    '메모리폼': ['컴팩트 메모리폼'],
    '프레임 일체형': ['원바디 2'],
  };
  const BASKET_KEY = 'consult-basket-v1';
  const UTM_KEY = 'utm-v1';
  const UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  // 유입 경로(UTM): 주소에 utm_ 값이 붙어 들어오면 기억해 뒀다가 상담 신청 때 함께 보낸다.
  // 예) https://내사이트/?utm_source=naver&utm_medium=blog&utm_campaign=10월
  try {
    const q = new URLSearchParams(location.search);
    if (UTM_FIELDS.some(k => q.get(k))) {
      const u = {};
      UTM_FIELDS.forEach(k => { const v = q.get(k); if (v) u[k] = v.slice(0, 120); });
      localStorage.setItem(UTM_KEY, JSON.stringify(u));
    } else if (!localStorage.getItem(UTM_KEY) && document.referrer && new URL(document.referrer).host !== location.host) {
      localStorage.setItem(UTM_KEY, JSON.stringify({ referrer: new URL(document.referrer).host }));
    }
  } catch {}
  const utm = () => { try { return JSON.parse(localStorage.getItem(UTM_KEY)) || {}; } catch { return {}; } };

  let cache;
  const load = () => cache || (cache = Promise.all([
    fetch('data/catalog-prices.json').then(r => { if (!r.ok) throw new Error('제품을 불러오지 못했어요'); return r.json(); }),
    fetch('data/images.json').then(r => r.ok ? r.json() : {}).catch(() => ({})), // 사진이 없어도 사이트는 동작한다
  ]).then(([rows, images]) => group(rows, images)));

  function group(rows, images) {
    const map = new Map();
    for (const r of rows) {
      const key = r.category + '|' + r.name;
      // 사진 자료는 두 가지 모양이다: 주소만 있는 것(블로그 배너), 주소와 제품이 있는 자리(box)가 함께 있는 것(제품 사진)
      const im = images[key];
      if (!map.has(key)) map.set(key, { key, category: r.category, name: r.name, img: im ? (im.src || im) : '', box: im && im.box, variants: [] });
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
  const modelLabel = p => { const m = [...new Set(p.variants.map(v => v.model).filter(Boolean))]; return m.length > 1 ? m[0] + ' 외' : (m[0] || ''); };
  // 제품 사진은 제품이 있는 자리만 잘라 칸 가운데에 크게 그린다(SVG). 블로그 배너는 칸에 맞춰 그대로 보여 준다.
  const picture = p => {
    if (p.box) {
      const [x, y, w, h, fullW, fullH] = p.box;
      return `<svg class="shot" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(p.name)}"><image href="${esc(p.img)}" width="${fullW}" height="${fullH}"/></svg>`;
    }
    return `<img class="banner" src="${esc(p.img)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'ph',textContent:'${esc(p.category)}'}))">`;
  };
  const thumb = (p, tag) => `<div class="thumb">${p.img ? picture(p) : `<span class="ph">${esc(p.category)}</span>`}${tag ? `<span class="tag">${esc(tag)}</span>` : ''}</div>`;

  // ── 장바구니 (이 브라우저에만 저장된다) ──
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

  const addLabel = on => on ? '담았어요' : '장바구니 담기';
  function addButton(product, cls = 'btn-small') {
    const on = inBasket(product.key);
    return `<button type="button" class="btn btn-line btn-add ${cls}" data-add="${esc(product.key)}" aria-pressed="${on}">${addLabel(on)}</button>`;
  }

  // ── 제품 카드 ──
  function card(p, tag) {
    const low = lowest(p);
    return `<article class="card">
      <button type="button" class="card-open" data-open="${esc(p.key)}" aria-label="${esc(p.name)} 금액표 보기">
        ${thumb(p, tag)}
        <span class="model">${esc(modelLabel(p))}</span>
        <h3>${esc(p.name)}</h3>
        <p class="price num">${low.normal ? `<s>${won(low.normal)}</s>` : ''}월 <b>${won(low.price)}</b>원~</p>
      </button>
      ${addButton(p)}
    </article>`;
  }

  // ── 금액표 창 ──
  let sheet;
  function openSheet(p) {
    if (!sheet) {
      sheet = document.createElement('dialog');
      sheet.className = 'sheet';
      document.body.appendChild(sheet);
      sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('[data-close]')) sheet.close(); });
    }
    const years = [...new Set(p.variants.flatMap(v => v.prices.map(x => x.years)))].sort();
    const cell = x => !x ? '—' : x.promo != null ? `<s>${won(x.rental)}</s><b>${won(x.promo)}</b>` : `<b>${won(x.rental)}</b>`;
    sheet.innerHTML = `<div class="sheet-in">
      <div class="sheet-head"><h2>${esc(p.name)}</h2><button type="button" class="sheet-close" data-close aria-label="닫기">×</button></div>
      ${p.img ? `<div class="sheet-img${p.box ? ' is-shot' : ''}">${picture(p)}</div>` : ''}
      <div class="scroll-x"><table class="ptable num">
        <thead><tr><th>모델</th><th>관리</th>${years.map(y => `<th>${y}년</th>`).join('')}</tr></thead>
        <tbody>${p.variants.map(v => `<tr><td>${esc(v.model || '—')}<span class="sub">${esc(v.variant || '')}</span></td><td>${esc([v.care, v.cycle].filter(Boolean).join(' ') || '—')}</td>${years.map(y => `<td>${cell(v.prices.find(x => x.years === y))}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
      <p class="note" style="margin-top:12px">월 렌탈료(원), 약정 기간별. 2026년 9-10월 카탈로그 기준.</p>
    </div>
    <div class="sheet-foot">${addButton(p, '')}</div>`;
    sheet.showModal();
  }

  // 카드가 들어 있는 곳에 한 번 걸어 두면 담기와 금액표 열기가 동작한다
  function wire(products) {
    if (wire.done) return; wire.done = true;
    document.addEventListener('click', e => {
      const add = e.target.closest('[data-add]');
      if (add) {
        const p = products.find(x => x.key === add.dataset.add);
        if (!p) return;
        const adding = !inBasket(p.key);
        toggle(p);
        // 금액표 창에서 담았으면 창을 닫는다. 아래 "담은 제품" 띠에서 장바구니로 갈 수 있다.
        if (adding && sheet && sheet.open && sheet.contains(add)) sheet.close();
        return;
      }
      const open = e.target.closest('[data-open]');
      if (open) { const p = products.find(x => x.key === open.dataset.open); if (p) openSheet(p); }
    });
  }
  function refresh() {
    const n = basket().length;
    document.querySelectorAll('[data-basket-count]').forEach(el => { el.textContent = n || ''; el.hidden = !n; });
    document.querySelectorAll('[data-basket-bar]').forEach(el => { el.hidden = !n; });
    document.querySelectorAll('[data-add]').forEach(btn => { const on = inBasket(btn.dataset.add); btn.setAttribute('aria-pressed', on); btn.textContent = addLabel(on); });
  }
  document.addEventListener('basket-change', refresh);
  window.addEventListener('storage', refresh);
  document.addEventListener('DOMContentLoaded', refresh);

  return { FEATURED, CATEGORIES, MATTRESS_TYPES, load, won, esc, lowest, condition, thumb, card, wire, basket, remove, clear, addButton, utm };
})();
