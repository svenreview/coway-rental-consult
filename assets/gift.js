// 사은품 리스트: 24개 전체를 6×4로 보여 주고, 받은 링크(g=코드)의 등급 안 상품만 담아서 신청할 수 있다.
// 사진을 누르면 쿠팡 상품 페이지가 새 탭으로 열린다.
// 고객 화면에는 가격·구매처를 두지 않는다. 구매처는 서버 환경변수(GIFT_SOURCES)에만 있다.
(async () => {
  const { esc } = Site;
  // 링크 코드 → 등급. 1 = 위 3줄(5만원 미만 구간), 2·3 = 24개 전체
  const CODES = {
    'bs7k2q': { tier: 1, label: '베이직', lead: '월 렌탈료 3만원 이하 고객님 전용 사은품이에요.' },
    'pl4m9x': { tier: 2, label: '플러스', lead: '월 렌탈료 4만원 이하 고객님 전용 사은품이에요.' },
    'pr8v3t': { tier: 3, label: '프리미엄', lead: '월 렌탈료 4만원 초과 고객님 전용 사은품이에요.' },
  };
  const q = new URLSearchParams(location.search);
  const code = (q.get('g') || '').toLowerCase();
  const level = CODES[code];
  const max = Math.min(Math.max(parseInt(q.get('n'), 10) || 1, 1), 3); // 고를 수 있는 개수 (기본 1, 1+1은 n=2)

  const grid = document.querySelector('#gf-grid');
  if (level) {
    document.querySelector('#gf-badge').textContent = `${level.label} 등급`;
    document.querySelector('#gf-lead').textContent = `${level.lead} ${max}개를 고를 수 있어요. 사진을 누르면 상품을 자세히 볼 수 있어요.`;
  } else {
    document.querySelector('#gf-lead').textContent = '사진을 누르면 상품을 자세히 볼 수 있어요. 신청은 담당자에게 받은 링크로 들어오시면 할 수 있어요.';
  }
  const myTier = level ? level.tier : 0;

  let items = [];
  try {
    const res = await fetch('data/gifts.json', { cache: 'no-cache' });
    items = (await res.json()).sort((a, b) => (a.row - b.row) || a.id.localeCompare(b.id));
  } catch {
    grid.innerHTML = '<li class="empty">목록을 불러오지 못했어요. 새로 고침 해 주세요.</li>';
    return;
  }

  const KEY = 'gift-cart-' + code;
  const can = g => myTier > 0 && g.tier <= myTier;
  let cart = [];
  try { cart = (JSON.parse(sessionStorage.getItem(KEY)) || []).filter(id => items.some(g => g.id === id && can(g))); } catch {}
  const save = () => sessionStorage.setItem(KEY, JSON.stringify(cart));

  const bar = document.querySelector('#gf-bar');
  function render() {
    grid.innerHTML = items.map(g => {
      const on = cart.includes(g.id);
      const ok = can(g);
      const img = g.img ? `<img src="${esc(g.img)}" alt="${esc(g.name)}" loading="lazy" referrerpolicy="no-referrer">` : '';
      const pic = g.link
        ? `<a class="gf-img" href="${esc(g.link)}" target="_blank" rel="noopener" title="쿠팡에서 상품 자세히 보기">${img}<span class="gf-view">자세히 보기</span></a>`
        : `<div class="gf-img">${img}</div>`;
      const btn = !level ? ''
        : ok ? `<button type="button" class="btn ${on ? 'btn-main' : 'btn-line'} btn-small" data-id="${esc(g.id)}" aria-pressed="${on}">${on ? '담았어요' : '담기'}</button>`
        : '<span class="gf-lock">플러스 등급부터</span>';
      return `<li class="gf-card${on ? ' on' : ''}${level && !ok ? ' off' : ''}">${pic}<p class="gf-name">${esc(g.name)}</p>${btn}</li>`;
    }).join('');
    bar.hidden = cart.length === 0;
    document.querySelector('#gf-bar-text').textContent = `${cart.length} / ${max}개 담음`;
  }
  grid.addEventListener('click', e => {
    const b = e.target.closest('button[data-id]'); if (!b) return;
    const id = b.dataset.id;
    if (!can(items.find(x => x.id === id))) return;
    if (cart.includes(id)) cart = cart.filter(x => x !== id);
    else if (cart.length >= max) { if (max === 1) cart = [id]; else { alert(`${max}개까지 고를 수 있어요. 담은 것을 빼고 다시 골라 주세요.`); return; } }
    else cart.push(id);
    save(); render();
  });
  render();

  // 신청서
  if (!level) return;
  const sheet = document.querySelector('#gf-sheet');
  const form = document.querySelector('#gf-form');
  const msg = document.querySelector('#gf-msg');
  const picked = document.querySelector('#gf-picked');
  document.querySelector('#gf-open').addEventListener('click', () => {
    picked.innerHTML = cart.map(id => { const g = items.find(x => x.id === id); return `<li>${g.img ? `<img src="${esc(g.img)}" alt="" referrerpolicy="no-referrer">` : ''}<span>${esc(g.name)}</span></li>`; }).join('');
    msg.hidden = true;
    sheet.showModal();
  });
  document.querySelector('#gf-close').addEventListener('click', () => sheet.close());

  const hyphen = v => { const d = v.replace(/\D/g, '').slice(0, 11); return d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` : d.length < 11 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`; };
  form.contact.addEventListener('blur', () => { if (/^[\d\s-]+$/.test(form.contact.value)) form.contact.value = hyphen(form.contact.value); });
  form.pccc.addEventListener('input', () => { form.pccc.value = form.pccc.value.toUpperCase().replace(/\s/g, ''); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg.hidden = true;
    const fail = t => { msg.textContent = t; msg.hidden = false; };
    const v = k => form[k].value.trim();
    if (!cart.length) return fail('사은품을 먼저 담아 주세요.');
    if (!v('name') || !v('contact') || !v('addr')) return fail('이름, 연락처, 주소를 적어 주세요.');
    if (!/^P\d{12}$/.test(v('pccc'))) return fail('개인통관고유부호는 P로 시작하는 13자리예요.');
    if (!form.c1.checked || !form.c2.checked || !form.c3.checked) return fail('필수 동의 3가지를 모두 체크해 주세요.');
    const names = cart.map(id => items.find(x => x.id === id));
    const data = {
      name: v('name'),
      contact: hyphen(v('contact')),
      kind: '가정',
      products: names.map(g => `사은품 [${g.id}] ${g.name}`),
      message: [
        `[사은품 신청] ${level.label} 등급 · ${cart.length}/${max}개`,
        `주소: ${v('zip') ? '(' + v('zip') + ') ' : ''}${v('addr')}`,
        `개인통관고유부호: ${v('pccc')}`,
        v('memo') ? `요청: ${v('memo')}` : '',
        '동의: 수집·이용, 배송 제3자 제공, 사은품 안내 확인',
      ].filter(Boolean).join('\n'),
      consent: true,
      website: form.website.value,
      utm: { ...Site.utm(), utm_source: 'gift', utm_medium: 'link', utm_campaign: level.label },
    };
    const button = form.querySelector('button[type=submit]');
    button.disabled = true; button.textContent = '접수 중...';
    try {
      const res = await fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return fail(body.error || '신청이 접수되지 않았어요. 잠시 뒤 다시 시도해 주세요.');
      cart = []; save();
      sheet.close();
      document.querySelector('#gf-body').hidden = true;
      bar.hidden = true;
      const done = document.querySelector('#gf-done'); done.hidden = false; done.focus(); window.scrollTo({ top: 0 });
    } catch {
      fail('신청이 접수되지 않았어요. 잠시 뒤 다시 시도해 주세요.');
    } finally {
      button.disabled = false; button.textContent = '사은품 신청하기';
    }
  });
})();
