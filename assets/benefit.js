// 혜택(메타 광고 랜딩, 사은품 중심): 광고별 첫 문구, 사은품 사진 띠, 짧은 신청서 2곳
(async () => {
  const { esc } = Site;

  // 1. 광고 소재(utm_content)에 맞춰 첫 문구를 바꾼다. 값이 없으면 기본 문구
  const HEAD = {
    'ad-a': ['정수기 렌탈, 고민되시죠?', '사은품부터 직접 고르세요'],
    'ad-b': ['정수기 알아보고 계신다면', '사은품, 직접 고르세요'],
    'ad-c': ['혜택만 비교하지 마세요', '사은품은 직접 고르세요'],
  };
  const q = new URLSearchParams(location.search);
  const content = (q.get('utm_content') || Site.utm().utm_content || '').toLowerCase();
  const key = Object.keys(HEAD).find(k => content.includes(k));
  if (key) document.querySelector('#bn-title').innerHTML = `${esc(HEAD[key][0])}<br><em>${esc(HEAD[key][1])}</em>`;

  // 2. 사은품 사진 띠 (프리미엄 상품부터, 사진·이름만)
  const gal = document.querySelector('#bn-gallery');
  if (gal) fetch('data/gifts.json').then(r => r.json()).then(list => {
    gal.innerHTML = list.slice().sort((a, b) => b.tier - a.tier).map(g => `<li><div class="b2-g">${g.img ? `<img src="${esc(g.img)}" alt="${esc(g.name)}" loading="lazy" referrerpolicy="no-referrer">` : ''}</div></li>`).join('');
  }).catch(() => { gal.hidden = true; });

  // 3. 신청서
  const hyphen = v => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (/^02/.test(d)) return d.length < 3 ? d : d.length < 6 ? `${d.slice(0, 2)}-${d.slice(2)}` : d.length < 10 ? `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}` : `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
    if (d.length < 4) return d;
    if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return d.length < 11 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  };
  const done = document.querySelector('#bn-done');
  const pageParts = [...document.querySelectorAll('main > :not(#bn-done)')];
  const sticky = document.querySelector('[data-bn-top]');

  document.querySelectorAll('[data-bn-form]').forEach(form => {
    const msg = form.querySelector('.form-msg');
    const button = form.querySelector('button[type=submit]');
    form.contact.addEventListener('blur', () => { if (/^[\d\s-]+$/.test(form.contact.value)) form.contact.value = hyphen(form.contact.value); });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      msg.hidden = true;
      const fail = t => { msg.textContent = t; msg.hidden = false; };
      const data = {
        name: form.name.value.trim(),
        contact: /^[\d\s-]+$/.test(form.contact.value) ? hyphen(form.contact.value) : form.contact.value.trim(),
        kind: '가정',
        products: [],
        message: `[혜택 페이지] 사은품 등급·렌탈료 안내 요청${key ? ' · 광고 ' + key : ''}`,
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

  // 4. 신청서가 화면에 없으면 아래 고정 버튼 (모바일)
  const forms = [...document.querySelectorAll('[data-bn-form]')];
  if (sticky && 'IntersectionObserver' in window) {
    const seen = new Set();
    const io = new IntersectionObserver(es => { es.forEach(en => en.isIntersecting ? seen.add(en.target) : seen.delete(en.target)); sticky.classList.toggle('show', seen.size === 0); });
    forms.forEach(f => io.observe(f));
    sticky.addEventListener('click', e => { e.preventDefault(); forms[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => forms[0].name.focus({ preventScroll: true }), 400); });
  }
})();
