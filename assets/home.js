// 메인: 주력·신제품 보기, 제품군 카드, 상담 신청서
(async () => {
  const { FEATURED, CATEGORIES, won, esc, lowest, condition } = Site;
  const tabs = document.querySelector('#finder-tabs');
  const list = document.querySelector('#finder-list');
  const more = document.querySelector('#finder-more');
  let products = [];

  function showCategory(cat) {
    tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', b.dataset.cat === cat));
    more.href = 'products.html#' + encodeURIComponent(cat);
    more.textContent = cat + ' 전체 보기';
    list.innerHTML = FEATURED[cat].map(([name, tag]) => {
      const p = products.find(x => x.category === cat && x.name === name);
      if (!p) return '';
      const low = lowest(p);
      return `<li class="finder-row">
        <div class="fr-main">
          <span class="fr-name">${esc(name)}</span>${tag ? ` <span class="tag">${esc(tag)}</span>` : ''}
          <span class="fr-cond">${esc(condition(low))}</span>
        </div>
        <div class="fr-price num">${low.normal ? `<s>${won(low.normal)}원</s>` : ''}<b>${won(low.price)}</b><small>원부터</small></div>
        ${Site.addButton(p, 'fr-add')}
      </li>`;
    }).join('');
  }

  try {
    products = await Site.load();
    tabs.innerHTML = CATEGORIES.map(c => `<button type="button" role="tab" data-cat="${c}">${c}</button>`).join('');
    tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) showCategory(b.dataset.cat); });
    Site.wireAddButtons(list, products);
    showCategory(CATEGORIES[0]);

    // 제품군 카드: 제품 수와 가장 낮은 금액
    document.querySelectorAll('[data-cat-card]').forEach(card => {
      const cat = card.dataset.catCard;
      const inCat = products.filter(p => p.category === cat);
      const low = inCat.map(lowest).filter(Boolean).sort((a, b) => a.price - b.price)[0];
      card.querySelector('.count').textContent = inCat.length + '개 제품';
      card.querySelector('.from').innerHTML = `월 렌탈료<b class="num">${won(low.price)}원부터</b>`;
    });
  } catch (err) {
    list.innerHTML = `<li class="empty">${esc(err.message)}. 잠시 뒤 새로 고침 해 주세요.</li>`;
  }
})();
