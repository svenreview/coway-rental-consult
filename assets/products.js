// 제품·렌탈료: 제품군 고르기, 이름으로 찾기, 금액표, 바구니에 담기
(async () => {
  const { CATEGORIES, won, esc, lowest, condition } = Site;
  const pills = document.querySelector('#pills');
  const search = document.querySelector('#search');
  const list = document.querySelector('#plist');
  let products = [];
  let current = CATEGORIES.includes(decodeURIComponent(location.hash.slice(1))) ? decodeURIComponent(location.hash.slice(1)) : CATEGORIES[0];

  const cell = p => !p ? '—' : p.promo != null ? `<s>${won(p.rental)}</s><b>${won(p.promo)}</b>` : `<b>${won(p.rental)}</b>`;

  function card(p) {
    const low = lowest(p);
    const years = [...new Set(p.variants.flatMap(v => v.prices.map(x => x.years)))].sort();
    const rows = p.variants.map(v => `<tr>
      <td><span class="model">${esc(v.model || '—')}</span><span class="sub">${esc(v.variant || '')}</span></td>
      <td>${esc([v.care, v.cycle].filter(Boolean).join(' ') || '—')}</td>
      ${years.map(y => `<td class="num">${cell(v.prices.find(x => x.years === y))}</td>`).join('')}
    </tr>`).join('');
    return `<article class="pcard">
      <div class="pcard-head">
        <div>
          <h2>${esc(p.name)}</h2>
          <p class="from">월 <b class="num">${won(low.price)}원</b>부터 <span class="note">${esc(condition(low))}</span></p>
        </div>
        ${Site.addButton(p)}
      </div>
      <details>
        <summary>약정별 금액표</summary>
        <div class="scroll-x"><table class="ptable">
          <thead><tr><th>모델</th><th>관리</th>${years.map(y => `<th>${y}년 약정</th>`).join('')}</tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </details>
    </article>`;
  }

  function render() {
    pills.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.cat === current));
    const q = search.value.trim().toLowerCase();
    const shown = products.filter(p => p.category === current && (!q || p.name.toLowerCase().includes(q) || p.variants.some(v => (v.model || '').toLowerCase().includes(q))));
    list.innerHTML = shown.length ? shown.map(card).join('') : `<p class="empty">찾는 제품이 없어요. 이름을 줄여서 다시 찾아보거나, 상담에서 물어봐 주세요.</p>`;
  }

  try {
    products = await Site.load();
    pills.innerHTML = CATEGORIES.map(c => `<button type="button" data-cat="${c}">${c} <span class="num">${products.filter(p => p.category === c).length}</span></button>`).join('');
    pills.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; current = b.dataset.cat; history.replaceState(null, '', '#' + encodeURIComponent(current)); render(); });
    search.addEventListener('input', render);
    Site.wireAddButtons(list, products);
    render();
  } catch (err) {
    list.innerHTML = `<p class="empty">${esc(err.message)}. 잠시 뒤 새로 고침 해 주세요.</p>`;
  }
})();
