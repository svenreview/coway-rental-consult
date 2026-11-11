// 매트리스 메타 랜딩 v4: 첫 화면 사진, 취향별 모델 카드, 짧은 신청서
(async () => {
  const { esc } = Site;
  const q = new URLSearchParams(location.search);
  const ad = (q.get('utm_content') || Site.utm().utm_content || '').toLowerCase();

  // 모델 (가격 = 퀸, 2026년 11월 상담 사이트 data/catalog-prices.json 중 최저)
  const MODELS = {
    firm: [
      { n: '엘리트', tag: '가장 부담 없이', d: '단단한 독립 스프링 (EXTRA HARD)', p: 21900 },
      { n: '더블체인지', tag: '탄탄하게', d: '독립 스프링 (HARD)', p: 24900 },
      { n: '시그니처 파이어쉴드 컴포트', tag: '호텔 침대처럼', d: '9존 스프링, 난연 원단', p: 58900 },
    ],
    soft: [
      { n: '루네어', tag: '부드럽게', d: '7존 스프링', p: 25900 },
      { n: '하이브리드 3', tag: '쫀쫀하게', d: '천연 라텍스 6cm, 7존 스프링', p: 28900 },
      { n: '하이브리드 4', tag: '포근하게', d: '메리노 양모 메모리폼 탑퍼, 7존 스프링', p: 29900 },
    ],
    smart: [
      { n: '비렉스 스마트 매트리스 S6+', tag: '그날그날 다르게', d: '단단함 9단계 조절', p: 76900 },
      { n: '비렉스 스마트 매트리스 S8+', tag: '더 섬세하게', d: '단단함 9단계 조절, 상위 모델', p: 97900 },
    ],
  };
  const PREF = { firm: '단단하게', soft: '푹신하게', smart: '둘이 달라요(경도 조절)' };
  let imgs = {};
  try { imgs = await (await fetch('data/images.json')).json(); } catch {}
  const src = n => { const v = imgs['매트리스|' + n]; return v ? (typeof v === 'string' ? v : v.src) : ''; };

  const hero = document.querySelector('#mx-hero-img'); // v5는 사진을 직접 넣어서 없음
  if (hero) { const s = src('하이브리드 4') || src('엘리트'); if (s) hero.src = s; else hero.closest('.mx-hero-img').hidden = true; }

  const cards = document.querySelector('#mx-cards');
  const won = v => v.toLocaleString('ko-KR');
  let pref = '';
  const render = k => {
    cards.innerHTML = MODELS[k].map(m => `<div class="mx-card"><div class="mx-card-img">${src(m.n) ? `<img src="${esc(src(m.n))}" alt="${esc(m.n)}" loading="lazy" referrerpolicy="no-referrer">` : ''}</div><div class="mx-card-txt"><em>${esc(m.tag)}</em><b>${esc(m.n)}</b><p>${esc(m.d)}</p><p class="pr">퀸 월 <strong>${won(m.p)}</strong>원부터</p></div></div>`).join('');
  };
  const tabs = document.querySelector('#mx-tabs');
  if (tabs && cards) {
    render('firm');
    tabs.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      tabs.querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', String(x === b)));
      render(b.dataset.k);
      pref = PREF[b.dataset.k];
      document.querySelectorAll('[data-mt-form] [name=pref]').forEach(i => { i.value = pref; });
    });
  }

  // 신청서
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
        message: `[매트리스 페이지] 견적 요청${size ? ' · 사이즈 ' + size : ''}${pref ? ' · 선호 ' + pref : ''}${ad ? ' · 광고 ' + ad : ''}`,
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

  // 첫 화면을 지나면 아래 고정 버튼, 신청서가 보이면 숨김
  const heroSec = document.querySelector('.mx-hero');
  const formSec = document.querySelector('#mx-form');
  if (sticky && 'IntersectionObserver' in window) {
    const vis = new Map();
    const io = new IntersectionObserver(es => { es.forEach(en => vis.set(en.target, en.isIntersecting)); sticky.classList.toggle('show', !vis.get(heroSec) && !vis.get(formSec)); });
    [heroSec, formSec].forEach(el => el && io.observe(el));
  }
})();
