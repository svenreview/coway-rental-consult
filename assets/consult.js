// 장바구니: 담은 제품 보기·빼기, 상담 신청서 보내기
(async () => {
  const { won, esc, lowest } = Site;
  const listEl = document.querySelector('#basket-list');
  const emptyEl = document.querySelector('#basket-empty');
  const sumEl = document.querySelector('#basket-sum');
  const form = document.querySelector('#consult-form');
  const msg = document.querySelector('#form-msg');
  const done = document.querySelector('#consult-done');
  let products = [];
  try { products = await Site.load(); } catch {}

  // 제품 이름 옆 혜택 글자 태그 (사진 위 배지와 같은 자료)
  const promo = key => { const b = Site.BADGES[key]; return b ? ` <span class="promo ${b[1]}">${b[0].replace(/<br>/g, ' ')}</span>` : ''; };
  // 간단 정보 한 줄: 금액표 자료에 있는 기능(냉·온·정·얼음)이나 사이즈 수만 쓴다. 관리 방식은 상담 때 안내한다
  function info(p) {
    const uniq = a => [...new Set(a.filter(Boolean))];
    const variants = uniq(p.variants.map(v => v.variant));
    const first = p.category === '매트리스'
      ? (variants.length ? variants.length + '가지 사이즈' : '')
      : (variants.sort((a, b) => b.length - a.length)[0] || '').replace(/\//g, '·');
    return first;
  }
  function render() {
    const items = Site.basket();
    emptyEl.hidden = items.length > 0;
    listEl.hidden = items.length === 0;
    let sum = 0;
    listEl.innerHTML = items.map(i => {
      const p = products.find(x => x.key === i.key);
      const low = p && lowest(p);
      if (low) sum += low.price;
      return `<li class="b-item">
        ${p ? Site.thumb(p) : '<div class="thumb"></div>'}
        <div><small>${esc(i.category)}</small><b>${esc(i.name)}${promo(i.key)}</b>${p && info(p) ? `<span class="info">${esc(info(p))}</span>` : ''}${p ? Site.descList(Site.descLines(p, low && low.model)) : ''}${low ? `<span class="p num">월 ${won(low.price)}원~</span>` : ''}</div>
        <button type="button" data-remove="${esc(i.key)}" aria-label="${esc(i.name)} 빼기">×</button>
      </li>`;
    }).join('');
    sumEl.hidden = items.length < 2 || !sum;
    sumEl.innerHTML = `<span>${items.length}개 합계</span><b class="num">월 ${won(sum)}원~</b>`;
  }
  listEl.addEventListener('click', e => { const b = e.target.closest('[data-remove]'); if (b) Site.remove(b.dataset.remove); });
  document.addEventListener('basket-change', render);
  render();

  // 맞춤 추천에서 넘어온 내용이 있으면 문의 내용에 넣어 둔다
  const note = new URLSearchParams(location.search).get('note');
  if (note) form.message.value = note;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg.hidden = true;
    const data = {
      name: form.name.value.trim(),
      contact: form.contact.value.trim(),
      kind: form.kind.value,
      products: Site.basket().map(i => i.category + ' - ' + i.name),
      message: form.message.value.trim(),
      consent: form.consent.checked,
      website: form.website.value,
      utm: Site.utm(),
    };
    const fail = text => { msg.textContent = text; msg.hidden = false; };
    if (!data.name || !data.contact) return fail('이름과 연락처를 적어 주세요.');
    if (!data.consent) return fail('개인정보 수집·이용에 동의해 주세요.');
    const button = form.querySelector('button[type=submit]');
    button.disabled = true;
    try {
      const res = await fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return fail(body.error || '상담 신청이 접수되지 않았어요. 전화나 카카오톡으로 연락해 주세요.');
      Site.clear();
      document.querySelector('#consult-body').hidden = true;
      done.hidden = false;
      done.focus();
      window.scrollTo({ top: 0 });
    } catch {
      fail('상담 신청이 접수되지 않았어요. 전화나 카카오톡으로 연락해 주세요.');
    } finally {
      button.disabled = false;
    }
  });
})();
