// 상담 바구니: 담은 제품 보기·빼기, 상담 신청서 보내기
(async () => {
  const { won, esc, lowest, condition } = Site;
  const listEl = document.querySelector('#basket-list');
  const emptyEl = document.querySelector('#basket-empty');
  const sumEl = document.querySelector('#basket-sum');
  const form = document.querySelector('#consult-form');
  const msg = document.querySelector('#form-msg');
  const done = document.querySelector('#consult-done');
  let products = [];
  try { products = await Site.load(); } catch {}

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
        <div><small>${esc(i.category)}</small><b>${esc(i.name)}</b>${low ? `<span class="note">${esc(condition(low))}</span>` : ''}</div>
        <div class="b-side">${low ? `<span class="num">월 <b>${won(low.price)}원</b>부터</span>` : ''}<button type="button" data-remove="${esc(i.key)}" aria-label="${esc(i.name)} 빼기">빼기</button></div>
      </li>`;
    }).join('');
    sumEl.hidden = items.length < 2 || !sum;
    sumEl.innerHTML = `담은 제품 ${items.length}개 합계 <b class="num">월 ${won(sum)}원부터</b><span class="note">제품마다 가장 낮은 조건으로 더한 금액이에요. 실제 금액은 상담에서 조건에 맞춰 안내해 드려요.</span>`;
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
