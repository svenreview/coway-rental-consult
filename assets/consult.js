// 장바구니: 담은 제품 보기·빼기, 상담 신청서 보내기
(async () => {
  const { esc, lowest } = Site;
  const listEl = document.querySelector('#basket-list');
  const emptyEl = document.querySelector('#basket-empty');
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
    document.querySelector('#basket-more').textContent = items.length ? '제품 더 담기' : '제품 보러 가기';
    listEl.innerHTML = items.map(i => {
      const p = products.find(x => x.key === i.key);
      const low = p && lowest(p);
      return `<li class="b-item">
        ${p ? Site.thumb(p) : '<div class="thumb"></div>'}
        <div><small>${esc(i.category)}</small><b>${esc(i.name)}${promo(i.key)}</b>${p && info(p) ? `<span class="info">${esc(info(p))}</span>` : ''}${p ? Site.descList(Site.descLines(p, low && low.model)) : ''}</div>
        <button type="button" data-remove="${esc(i.key)}" aria-label="${esc(i.name)} 빼기">×</button>
      </li>`;
    }).join('');
    // 신청 버튼 바로 위에서 장바구니 제품이 함께 접수되는지 알려 준다
    document.querySelector('#with-cart').textContent = items.length
      ? `장바구니 제품 ${items.length}개가 함께 접수돼요.`
      : '제품 없이 상담만 신청해요. 제품은 상담에서 함께 골라도 돼요.';
  }
  listEl.addEventListener('click', e => { const b = e.target.closest('[data-remove]'); if (b) Site.remove(b.dataset.remove); });
  document.addEventListener('basket-change', render);
  render();

  // 맞춤 추천에서 넘어온 내용이 있으면 문의 내용에 넣어 둔다
  const params = new URLSearchParams(location.search);
  const note = params.get('note');
  const kakaoAfterSubmit = params.get('next') === 'kakao';
  if (note) form.message.value = note;
  const submitButton = form.querySelector('button[type=submit]');
  if (kakaoAfterSubmit) {
    submitButton.textContent = '상담 접수하고 카카오톡 열기';
    submitButton.insertAdjacentHTML('beforebegin', '<p class="note">입력한 정보와 추천 결과가 먼저 접수된 뒤 카카오톡 채팅창으로 이동해요.</p>');
  }

  // 연락처: 숫자를 넣으면 하이픈을 자동으로 넣는다 (010-1234-5678, 02-123-4567, 1588-1234)
  const hyphen = v => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (/^02/.test(d)) return d.length < 3 ? d : d.length < 6 ? `${d.slice(0, 2)}-${d.slice(2)}` : d.length < 10 ? `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}` : `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
    if (/^1[5-9]/.test(d) && d.length <= 8) return d.length < 5 ? d : `${d.slice(0, 4)}-${d.slice(4)}`;
    if (d.length < 4) return d;
    if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return d.length < 11 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  };
  let prevContact = form.contact.value;
  form.contact.addEventListener('input', e => {
    const el = form.contact, digits = x => x.replace(/\D/g, '');
    let v = el.value;
    if (!/^[\d\s-]*$/.test(v)) { prevContact = v; return; } // 숫자가 아닌 글자를 적으면 그대로 둔다
    // 커서 앞 숫자 개수를 기억해 두었다가 하이픈을 넣은 뒤 같은 자리에 커서를 다시 놓는다
    let before = digits(v.slice(0, el.selectionStart)).length;
    // 하이픈만 지운 경우: 그 앞 숫자를 지운 것으로 본다 (안 그러면 하이픈이 다시 생겨 지워지지 않는다)
    if (e.inputType === 'deleteContentBackward' && digits(v) === digits(prevContact) && before > 0) {
      const d = digits(v); v = d.slice(0, before - 1) + d.slice(before); before--;
    }
    const out = hyphen(v);
    el.value = prevContact = out;
    let pos = 0, n = 0;
    while (pos < out.length && n < before) { if (/\d/.test(out[pos])) n++; pos++; }
    if (document.activeElement === el) el.setSelectionRange(pos, pos);
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg.hidden = true;
    const data = {
      name: form.name.value.trim(),
      contact: /^[\d\s-]+$/.test(form.contact.value) ? hyphen(form.contact.value) : form.contact.value.trim(),
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
    const button = submitButton;
    button.disabled = true;
    try {
      const res = await fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return fail(body.error || '상담 신청이 접수되지 않았어요. 전화나 카카오톡으로 연락해 주세요.');
      Site.clear();
      if (kakaoAfterSubmit) {
        location.href = 'http://pf.kakao.com/_Upxian/chat';
        return;
      }
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
