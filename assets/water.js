// 정수기 혜택 랜딩: 30초 진단 → 추천 제품·실제 금액 계산 → 상담 신청(문의함 접수)
// 금액은 data/catalog-prices.json(종합카탈로그 약정할인가)에서 가져온다. 혜택 규칙은 2026년 11월 프로모션 기준.
(async () => {
  const { esc } = Site;
  const won = n => Math.round(n).toLocaleString('ko-KR') + '원';
  let rows = [], images = {};
  try {
    [rows, images] = await Promise.all([
      fetch('data/catalog-prices.json').then(r => r.json()),
      fetch('data/images.json').then(r => r.ok ? r.json() : {}).catch(() => ({})),
    ]);
  } catch {}
  const img = name => (images['정수기|' + name] || {}).src || '';

  // 총비용 예시 카드: 아이콘 정수기 3 냉/온/정 방문관리 5년
  const ex = rows.find(r => r.name === '아이콘 정수기 3' && r.variant === '냉/온/정' && r.care === '방문관리');
  const pImg = document.querySelector('#price-img');
  if (img('아이콘 정수기 3')) { pImg.src = img('아이콘 정수기 3'); pImg.alt = '아이콘 정수기 3'; } else pImg.hidden = true;
  if (ex) {
    const p5 = ex.prices.find(p => p.years === 5).promo;
    document.querySelector('#price-after').textContent = '월 ' + won(p5);
    document.querySelector('#price-total').textContent = won(6 * 10000 + 54 * p5);
    document.querySelector('#price-card').textContent = '월 ' + won(Math.max(p5 - 20000, 0));
  }

  // ── 30초 진단 ──
  const Q = [
    { id: 'now', q: '지금 마시는 물은요?', opts: ['생수를 사서 마셔요', '다른 브랜드 정수기를 써요', '코웨이 정수기를 써요', '수돗물을 끓여 마셔요'] },
    { id: 'family', q: '함께 사는 가족은 몇 명인가요?', opts: ['1~2명', '3~4명', '5명 이상'] },
    { id: 'func', q: '꼭 필요한 기능은요?', opts: ['정수·냉수', '정수·냉수·온수', '얼음까지 나오면 좋겠어요'] },
    { id: 'care', q: '필터 관리는 어떻게 하고 싶으세요?', opts: ['관리 담당자 방문이 편해요', '직접 교체하고 렌탈료를 낮출래요', '잘 모르겠어요'] },
  ];
  const ans = {};
  let step = 0;
  const body = document.querySelector('#quiz-body');
  const bar = document.querySelector('#quiz-bar');
  const resultEl = document.querySelector('#result');
  function drawQ() {
    const s = Q[step];
    bar.style.width = (step / Q.length * 100) + '%';
    body.innerHTML = `<p class="wt-qstep">${step + 1} / ${Q.length}</p><h3>${esc(s.q)}</h3>
      <div class="wt-opts">${s.opts.map((o, i) => `<button type="button" data-i="${i}"${ans[s.id] === o ? ' class="on"' : ''}>${esc(o)}</button>`).join('')}</div>
      ${step ? '<button type="button" class="wt-back" data-back>이전</button>' : ''}`;
  }
  body.addEventListener('click', e => {
    if (e.target.closest('[data-back]')) { step--; drawQ(); return; }
    const b = e.target.closest('[data-i]'); if (!b) return;
    ans[Q[step].id] = Q[step].opts[+b.dataset.i];
    if (step < Q.length - 1) { step++; drawQ(); } else { bar.style.width = '100%'; showResult(); }
  });
  drawQ();

  // 진단 답 → 제품·관리 방식 → 5년 약정 금액
  function choose() {
    const fam = Q[1].opts.indexOf(ans.family); // 0,1,2
    const selfCare = ans.care === Q[3].opts[1];
    let name, variant, promo, why;
    if (ans.func === Q[2].opts[2]) {
      name = ['아이콘 얼음정수기 미니', '아이콘 얼음정수기 스탠다드', '아이콘 얼음정수기 맥스'][fam];
      variant = '냉/온/정/얼음'; promo = 'half';
      why = ['1~2인 가구에 맞는 작은 크기의 얼음정수기예요.', '3~4인 가구가 쓰기 좋은 얼음 용량이에요.', '가족이 많아 얼음을 자주 쓰는 집에 맞는 큰 용량이에요.'][fam];
    } else if (ans.func === Q[2].opts[1]) {
      name = '아이콘 정수기 3'; variant = '냉/온/정'; promo = 'flat';
      why = '작은 크기에 정수·냉수·온수를 모두 쓰는 제품이에요.';
    } else {
      name = '아이콘 정수기 3'; variant = '냉/정'; promo = 'flat';
      why = '온수 없이 정수·냉수만 쓰는 슬림한 제품이에요.';
    }
    const cands = rows.filter(r => r.name === name && r.variant === variant);
    let row = selfCare ? cands.find(r => r.care === '자가관리') : null;
    const selfFallback = selfCare && !row;
    if (!row) row = cands.filter(r => r.care === '방문관리').sort((a, b) => a.prices.find(p => p.years === 5).promo - b.prices.find(p => p.years === 5).promo)[0] || cands[0];
    return { name, variant, promo, why, row, selfFallback };
  }

  let picked = null;
  function showResult() {
    const c = choose();
    if (!c.row) { resultEl.hidden = false; resultEl.innerHTML = '<p>추천 결과를 불러오지 못했어요. 상담으로 안내해 드릴게요.</p>'; return; }
    const p5 = c.row.prices.find(p => p.years === 5).promo;
    const first = c.promo === 'flat' ? 10000 : p5 / 2;
    const total = 6 * first + 54 * p5;
    const care = c.row.care + (c.row.cycle ? ` (${c.row.cycle} 1회)` : '');
    const extra = [];
    if (ans.now === Q[0].opts[1]) extra.push('다른 브랜드 정수기를 쓰고 계셔서 <b>타사 보상 할인(약정할인가 10%)</b> 대상인지 함께 확인해 드려요.');
    if (ans.now === Q[0].opts[2]) extra.push('지금 코웨이 정수기를 쓰고 계시면 <b>기존 고객 순신규 3개월 추가</b>나 재렌탈 조건을 함께 확인해 드려요.');
    if (ans.now === Q[0].opts[0] || ans.now === Q[0].opts[3]) extra.push('최근 6개월 코웨이 정수기 관리 계정이 없으면 <b>3개월 추가 혜택</b> 대상인지 확인해 드려요.');
    if (c.selfFallback) extra.push('이 제품은 자가관리 요금이 없어 방문관리 기준으로 계산했어요.');
    picked = { label: `${c.name} (${c.variant.replace(/\//g, '·')}, ${care}, 5년)`, summary: `월 ${won(p5)} / 첫 6개월 ${c.promo === 'flat' ? '월 1만원' : '반값'} / 60개월 총 ${won(total)}` };
    resultEl.hidden = false;
    resultEl.innerHTML = `
      <p class="wt-kicker">진단 결과</p>
      <div class="wt-res-card">
        ${img(c.name) ? `<img src="${esc(img(c.name))}" alt="${esc(c.name)}">` : ''}
        <div><b>${esc(c.name)}</b><span>${esc(c.variant.replace(/\//g, '·'))} · ${esc(care)}</span><p>${esc(c.why)}</p></div>
      </div>
      <dl class="wt-price-rows wt-light">
        <div><dt>첫 6개월</dt><dd><b>월 ${won(first)}</b><span>${c.promo === 'flat' ? '월 1만원 혜택' : '렌탈료 반값'}</span></dd></div>
        <div><dt>7개월 차부터</dt><dd><b>월 ${won(p5)}</b><span>5년 약정할인가</span></dd></div>
        <div class="wt-total"><dt>60개월 총 계약금액</dt><dd><b>${won(total)}</b><span>카드 할인 전</span></dd></div>
        <div><dt>제휴카드 쓰면</dt><dd><b>월 ${won(Math.max(p5 - 20000, 0))}</b><span>7개월 차부터 · 전월 실적 30만원 예시</span></dd></div>
      </dl>
      ${extra.length ? `<ul class="wt-extra">${extra.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
      <p class="wt-small">5년 약정 기준 계산 예시예요. 반값 1회차 일할 계산, 설치일, 카드 실적에 따라 실제 청구액은 달라질 수 있어요.</p>
      <div class="wt-res-cta"><a class="btn btn-main" href="#apply" data-take>이 조건으로 혜택 받기</a><button type="button" class="btn btn-line" data-again>다시 진단</button></div>`;
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  resultEl.addEventListener('click', e => {
    if (e.target.closest('[data-again]')) { step = 0; Object.keys(ans).forEach(k => delete ans[k]); resultEl.hidden = true; drawQ(); document.querySelector('#check').scrollIntoView({ behavior: 'smooth' }); }
    if (e.target.closest('[data-take]') && picked) {
      const box = document.querySelector('#wt-picked');
      box.hidden = false;
      box.innerHTML = `<b>진단 결과가 함께 접수돼요</b><span>${esc(picked.label)}</span><small>${esc(picked.summary)}</small>`;
    }
  });

  // ── 사은품 사진 (이름·사진만) ──
  try {
    const gifts = await fetch('data/gifts.json').then(r => r.json());
    document.querySelector('#gift-list').innerHTML = gifts.map(g => `<li><a href="${esc(g.link || '#')}" target="_blank" rel="noopener"><img src="${esc(g.img)}" alt="" loading="lazy"></a><span>${esc(g.name)}</span></li>`).join('');
  } catch { document.querySelector('#gifts').hidden = true; }

  // ── 신청 ──
  const form = document.querySelector('#wt-form');
  const msg = document.querySelector('#wt-msg');
  const hyphen = v => { const d = v.replace(/\D/g, '').slice(0, 11); return d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` : d.length < 11 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`; };
  form.contact.addEventListener('blur', () => { if (/^[\d\s-]+$/.test(form.contact.value)) form.contact.value = hyphen(form.contact.value); });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg.hidden = true;
    const fail = t => { msg.textContent = t; msg.hidden = false; };
    const name = form.name.value.trim(), contact = form.contact.value.trim();
    if (!name || !contact) return fail('이름과 연락처를 적어 주세요.');
    if (contact.replace(/\D/g, '').length < 9) return fail('연락처를 다시 확인해 주세요.');
    if (!form.consent.checked) return fail('개인정보 수집·이용에 동의해 주세요.');
    const products = [...form.querySelectorAll('input[name=product]:checked')].map(x => x.value);
    if (picked) products.unshift(picked.label);
    const quiz = Object.keys(ans).length ? Q.filter(s => ans[s.id]).map(s => `${s.q} ${ans[s.id]}`).join('\n') : '';
    const u = Site.utm();
    const data = {
      name, contact: hyphen(contact), kind: form.kind.value,
      products,
      message: ['[정수기 혜택 랜딩]', picked ? `진단 결과: ${picked.summary}` : '', quiz].filter(Boolean).join('\n'),
      consent: true, website: form.website.value,
      utm: { ...u, utm_content: u.utm_content || 'water-landing', referrer: u.referrer || document.referrer || '' },
    };
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = '접수 중...';
    try {
      const res = await fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) return fail(b.error || '접수되지 않았어요. 잠시 뒤 다시 시도해 주세요.');
      form.hidden = true;
      const done = document.querySelector('#wt-done'); done.hidden = false; done.focus();
    } catch { fail('접수되지 않았어요. 잠시 뒤 다시 시도해 주세요.'); }
    finally { btn.disabled = false; btn.textContent = '11월 혜택 상담 신청하기'; }
  });
})();
