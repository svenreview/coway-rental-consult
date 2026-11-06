// 혜택(메타 광고 랜딩): 광고 소재에 맞춘 첫 문구, 짧은 상담 신청서 2곳, 제품 사진
(async () => {
  const { esc } = Site;

  // 1. 광고 소재(utm_content)에 맞춰 첫 문구를 바꾼다. 값이 없으면 기본 문구(ad-a)를 쓴다.
  const HEAD = {
    'ad-a': ['정수기 렌탈, 조건이 너무 복잡하죠?', '같은 기준으로 정리해 드릴게요.', '약정·관리 방식별 월 렌탈료부터 할인 끝난 뒤 금액, 약정 총액까지 한 장으로 받아보세요.'],
    'ad-b': ['알아보시는 정수기,', '월 금액을 한 장으로 받아보세요.', '약정·관리 방식별 월 렌탈료와 할인 끝난 뒤 금액까지 같은 기준으로 비교해 드려요.'],
    'ad-c': ['혜택보다 먼저 볼 것,', '할인 끝난 뒤 금액과 총액이에요.', '반값·월 1만원 기간이 끝난 뒤 금액과 약정 총액까지 미리 알려 드려요.'],
  };
  const q = new URLSearchParams(location.search);
  const content = (q.get('utm_content') || Site.utm().utm_content || '').toLowerCase();
  const key = Object.keys(HEAD).find(k => content.includes(k));
  if (key) {
    const [l1, l2, sub] = HEAD[key];
    document.querySelector('#bn-title').innerHTML = `${esc(l1)}<br><em>${esc(l2)}</em>`;
    document.querySelector('#bn-sub').textContent = sub;
  }

  // 2. 아이콘 정수기 3 사진 (사이트 제품 자료에서 가져온다. 실패해도 페이지는 그대로)
  Site.load().then(products => {
    const p = products.find(x => x.key === '정수기|아이콘 정수기 3');
    const box = document.querySelector('#bn-shot');
    if (p && p.img && box) box.innerHTML = Site.picture(p);
  }).catch(() => {});

  // 2-1. 사은품 미리보기 (사진·이름·등급만. 가격·구매처는 없다)
  const TIER = { 1: '베이직부터', 2: '플러스부터', 3: '프리미엄' };
  const gal = document.querySelector('#bn-gallery');
  if (gal) fetch('data/gifts.json').then(r => r.json()).then(list => {
    gal.innerHTML = list.slice().sort((a, b) => b.tier - a.tier).map(g => `<li class="t${g.tier}"><div class="bn-g-img">${g.img ? `<img src="${esc(g.img)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}</div><span class="bn-g-tag">${TIER[g.tier] || ''}</span><p>${esc(g.name)}</p></li>`).join('');
  }).catch(() => { gal.hidden = true; });
  document.querySelectorAll('[data-bn-jump]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const f = document.querySelector('[data-bn-form]');
    f.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => f.name.focus({ preventScroll: true }), 400);
  }));

  // 3. 연락처 하이픈 자동 입력 (상담 신청 페이지와 같은 규칙)
  const hyphen = v => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (/^02/.test(d)) return d.length < 3 ? d : d.length < 6 ? `${d.slice(0, 2)}-${d.slice(2)}` : d.length < 10 ? `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}` : `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
    if (/^1[5-9]/.test(d) && d.length <= 8) return d.length < 5 ? d : `${d.slice(0, 4)}-${d.slice(4)}`;
    if (d.length < 4) return d;
    if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return d.length < 11 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  };

  const done = document.querySelector('#bn-done');
  const page = [...document.querySelectorAll('main > :not(#bn-done)')];
  const sticky = document.querySelector('[data-bn-top]');

  document.querySelectorAll('[data-bn-form]').forEach(form => {
    const msg = form.querySelector('.form-msg');
    const button = form.querySelector('button[type=submit]');
    form.contact.addEventListener('blur', () => {
      if (/^[\d\s-]+$/.test(form.contact.value)) form.contact.value = hyphen(form.contact.value);
    });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      msg.hidden = true;
      const fail = text => { msg.textContent = text; msg.hidden = false; };
      const data = {
        name: form.name.value.trim(),
        contact: /^[\d\s-]+$/.test(form.contact.value) ? hyphen(form.contact.value) : form.contact.value.trim(),
        kind: form.kind.value,
        products: [],
        message: `[혜택 페이지] 정수기 조건 비교표·사은품 등급 안내 요청${key ? ' · 광고 ' + key : ''}`,
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
        if (!res.ok) return fail(body.error || '상담 신청이 접수되지 않았어요. 잠시 뒤 다시 시도해 주세요.');
        // 메타 픽셀이 설치돼 있으면 상담 신청(Lead)을 알린다
        if (typeof window.fbq === 'function') window.fbq('track', 'Lead');
        page.forEach(el => { el.hidden = true; });
        if (sticky) sticky.hidden = true;
        done.hidden = false;
        done.focus();
        window.scrollTo({ top: 0 });
      } catch {
        fail('상담 신청이 접수되지 않았어요. 잠시 뒤 다시 시도해 주세요.');
      } finally {
        button.disabled = false;
        button.textContent = label;
      }
    });
  });

  // 4. 첫 화면 신청서가 화면 밖으로 나가면 아래쪽 고정 버튼을 보여 준다 (모바일)
  const first = document.querySelector('[data-bn-form]');
  const last = document.querySelectorAll('[data-bn-form]')[1];
  if (sticky && 'IntersectionObserver' in window) {
    const seen = new Set();
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { en.isIntersecting ? seen.add(en.target) : seen.delete(en.target); });
      sticky.classList.toggle('show', seen.size === 0);
    });
    io.observe(first);
    if (last) io.observe(last);
    sticky.addEventListener('click', e => {
      e.preventDefault();
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => first.name.focus({ preventScroll: true }), 400);
    });
  }
})();
