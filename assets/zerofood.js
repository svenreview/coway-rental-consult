// 코웨이 제로 음식물처리기 랜딩: 상담 신청(/api/inquiry), 하단 고정 CTA
(async () => {
  const q = new URLSearchParams(location.search);
  const ad = (q.get('utm_content') || Site.utm().utm_content || '').toLowerCase();
  // 상담 신청
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
      const room = form.room ? form.room.value : '';
      const care = form.care ? form.care.value : '';
      const data = {
        name: form.name.value.trim(),
        contact: /^[\d\s-]+$/.test(form.contact.value) ? hyphen(form.contact.value) : form.contact.value.trim(),
        kind: '가정',
        products: ['제로 음식물처리기'],
        message: `[제로 음식물처리기 페이지] 견적 요청${room ? ' · 장소 ' + room : ''}${care ? ' · ' + care : ''}${ad ? ' · 광고 ' + ad : ''}`,
        consent: form.consent.checked,
        website: form.website.value,
        utm: Site.utm(),
      };
      if (!data.name || !data.contact) return fail('이름과 연락처를 입력해 주세요.');
      if (!data.consent) return fail('개인정보 수집·이용에 동의해 주세요.');
      button.disabled = true;
      const label = button.textContent;
      button.textContent = '접수 중...';
      try {
        const res = await fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return fail(body.error || '접수되지 않았습니다. 잠시 후 다시 시도해 주세요.');
        if (typeof window.fbq === 'function') window.fbq('track', 'Lead');
        pageParts.forEach(el => { el.hidden = true; });
        if (sticky) sticky.hidden = true;
        done.hidden = false; done.focus(); window.scrollTo({ top: 0 });
      } catch {
        fail('접수되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      } finally {
        button.disabled = false; button.textContent = label;
      }
    });
  });

  // 하단 고정 CTA: 히어로 버튼과 신청 폼이 화면에 없을 때만 표시
  const heroBtn = document.querySelector('.ms-hero .ms-btn');
  const formSec = document.querySelector('#ms-form');
  if (sticky && 'IntersectionObserver' in window) {
    const vis = new Map();
    const io = new IntersectionObserver(es => { es.forEach(en => vis.set(en.target, en.isIntersecting)); sticky.classList.toggle('show', !vis.get(heroBtn) && !vis.get(formSec)); });
    [heroBtn, formSec].forEach(el => el && io.observe(el));
  }
})();
