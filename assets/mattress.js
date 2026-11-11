// 매트리스 (메타 광고 랜딩): 제품 사진 띠, 짧은 신청서 2곳
(async () => {
  const { esc } = Site;
  const q = new URLSearchParams(location.search);
  const ad = (q.get('utm_content') || Site.utm().utm_content || '').toLowerCase();

  // 1. 제품 사진 띠 (상담 사이트 이미지 데이터 재사용)
  const SHOW = ['비렉스 스마트 매트리스 S8+', '비렉스 스마트 매트리스 S6+', '시그니처 파이어쉴드 컴포트', '하이브리드 4', '하이브리드 3', '루네어', '더블체인지', '엘리트'];
  const gal = document.querySelector('#mt-gallery');
  if (gal) fetch('data/images.json').then(r => r.json()).then(imgs => {
    gal.innerHTML = SHOW.map(n => {
      const v = imgs['매트리스|' + n];
      const src = v && (typeof v === 'string' ? v : v.src);
      return src ? `<li><div class="b2-g"><img src="${esc(src)}" alt="${esc(n)}" loading="lazy" referrerpolicy="no-referrer"></div></li>` : '';
    }).join('');
    if (!gal.innerHTML.trim()) gal.hidden = true;
  }).catch(() => { gal.hidden = true; });

  // 1-2. 우리 집 매트리스 점검 체크
  const chk = document.querySelector('#mt-check');
  const chkOut = document.querySelector('#mt-check-result');
  let picked = 0;
  if (chk) chk.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(on));
    picked = chk.querySelectorAll('[aria-pressed="true"]').length;
    chkOut.classList.toggle('hit', picked >= 2);
    chkOut.textContent = picked === 0 ? '해당되는 항목을 눌러 보세요'
      : picked === 1 ? '1개 해당돼요. 지금 매트리스 상태를 한 번 확인해 보세요'
      : `${picked}개 해당돼요. 관리받는 매트리스, 상담받아 볼 만해요`;
  });

  // 2. 신청서
  const hyphen = v => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (/^02/.test(d)) return d.length < 3 ? d : d.length < 6 ? `${d.slice(0, 2)}-${d.slice(2)}` : d.length < 10 ? `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}` : `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
    if (d.length < 4) return d;
    if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return d.length < 11 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  };
  const done = document.querySelector('#mt-done');
  const pageParts = [...document.querySelectorAll('main > :not(#mt-done)')];
  const sticky = document.querySelector('[data-mt-top]');

  document.querySelectorAll('[data-mt-form]').forEach(form => {
    const msg = form.querySelector('.form-msg');
    const button = form.querySelector('button[type=submit]');
    form.contact.addEventListener('blur', () => { if (/^[\d\s-]+$/.test(form.contact.value)) form.contact.value = hyphen(form.contact.value); });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      msg.hidden = true;
      const fail = t => { msg.textContent = t; msg.hidden = false; };
      const size = form.size ? form.size.value : '';
      const data = {
        name: form.name.value.trim(),
        contact: /^[\d\s-]+$/.test(form.contact.value) ? hyphen(form.contact.value) : form.contact.value.trim(),
        kind: '가정',
        products: ['매트리스' + (size ? ` (${size})` : '')],
        message: `[매트리스 페이지] 매트리스 상담 요청${size ? ' · 사이즈 ' + size : ''}${picked ? ' · 점검 ' + picked + '개 해당' : ''}${ad ? ' · 광고 ' + ad : ''}`,
        consent: form.consent.checked,
        website: form.website.value,
        utm: Site.utm(),
      };
      if (!data.name || !data.contact) return fail('이름과 연락처를 적어 주세요.');
      if (!data.consent) return fail('개인정보 수집·이용에 동의해 주세요.');
      button.disabled = true;
      const label = button.textContent;
      button.textContent = '접수 중...';
      try {
        const res = await fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return fail(body.error || '접수되지 않았어요. 잠시 뒤 다시 시도해 주세요.');
        if (typeof window.fbq === 'function') window.fbq('track', 'Lead');
        pageParts.forEach(el => { el.hidden = true; });
        if (sticky) sticky.hidden = true;
        done.hidden = false; done.focus(); window.scrollTo({ top: 0 });
      } catch {
        fail('접수되지 않았어요. 잠시 뒤 다시 시도해 주세요.');
      } finally {
        button.disabled = false; button.textContent = label;
      }
    });
  });

  // 3. 신청서가 화면에 없으면 아래 고정 버튼 (모바일)
  const forms = [...document.querySelectorAll('[data-mt-form]')];
  if (sticky && 'IntersectionObserver' in window) {
    const seen = new Set();
    const io = new IntersectionObserver(es => { es.forEach(en => en.isIntersecting ? seen.add(en.target) : seen.delete(en.target)); sticky.classList.toggle('show', seen.size === 0); });
    forms.forEach(f => io.observe(f));
    sticky.addEventListener('click', e => { e.preventDefault(); forms[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => forms[0].name.focus({ preventScroll: true }), 400); });
  }
})();
