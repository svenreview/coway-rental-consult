(() => {
  const q = new URLSearchParams(location.search);
  const ad = (q.get('utm_content') || (window.Site && Site.utm ? Site.utm().utm_content : '') || '').toLowerCase();
  const adline = document.querySelector('#wd-adline');
  const hooks = {
    'ad-a': '정수기 렌탈, 쉽지 않으시죠?',
    'ad-b': '정수기 설치, 알아보고 계신가요?',
    'ad-c': '정수기 설치, 혜택만 보고 계신가요?'
  };
  if (adline && hooks[ad]) adline.textContent = hooks[ad];

  const prod = location.hostname === 'www.coway-rental.com' || location.hostname === 'coway-rental.com';
  if (prod && typeof window.fbq !== 'function') {
    (function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=true;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=true;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init','1801530487790406'); fbq('track','PageView');
  }

  const hyphen = v => {
    const d = String(v || '').replace(/\D/g, '').slice(0, 11);
    if (/^02/.test(d)) return d.length < 3 ? d : d.length < 6 ? d.slice(0,2)+'-'+d.slice(2) : d.length < 10 ? d.slice(0,2)+'-'+d.slice(2,5)+'-'+d.slice(5) : d.slice(0,2)+'-'+d.slice(2,6)+'-'+d.slice(6,10);
    if (d.length < 4) return d;
    if (d.length < 8) return d.slice(0,3)+'-'+d.slice(3);
    return d.length < 11 ? d.slice(0,3)+'-'+d.slice(3,6)+'-'+d.slice(6) : d.slice(0,3)+'-'+d.slice(3,7)+'-'+d.slice(7);
  };
  const form = document.querySelector('#wd-consult-form');
  const done = document.querySelector('#wd-done');
  const mainSections = Array.from(document.querySelectorAll('main > section'));
  const sticky = document.querySelector('[data-wd-sticky]');
  if (form) {
    const contact = form.querySelector('[name=contact]');
    const msg = form.querySelector('.wd-form-msg');
    const button = form.querySelector('button[type=submit]');
    contact.addEventListener('blur', () => { if (/^[\d\s-]+$/.test(contact.value)) contact.value = hyphen(contact.value); });
    form.addEventListener('submit', async e => {
      e.preventDefault(); msg.hidden = true;
      const fd = new FormData(form);
      const timing = fd.get('timing') || '';
      const situation = fd.get('situation') || '';
      const name = String(fd.get('name') || '').trim();
      const rawContact = String(fd.get('contact') || '').trim();
      const contactValue = /^[\d\s-]+$/.test(rawContact) ? hyphen(rawContact) : rawContact;
      const contactTime = fd.get('contactTime') || '';
      const consent = fd.get('consent') === 'on';
      const fail = t => { msg.textContent = t; msg.hidden = false; };
      if (!timing) return fail('설치 희망 시기를 선택해 주세요.');
      if (!situation) return fail('현재 상황을 선택해 주세요.');
      if (!name || !contactValue) return fail('이름과 연락처를 입력해 주세요.');
      if (!consent) return fail('개인정보 수집·이용에 동의해 주세요.');
      const data = {
        name: name,
        contact: contactValue,
        kind: situation === '사업장 신규 설치' ? '사업장' : '가정',
        products: ['정수기 설치 상담'],
        message: '[정수기 팀장 직접상담 페이지] 설치 시기 '+timing+' · 현재 상황 '+situation+(contactTime ? ' · 연락 가능 시간 '+contactTime : '')+(ad ? ' · 광고 '+ad : ''),
        consent: true,
        website: fd.get('website') || '',
        utm: window.Site && Site.utm ? Site.utm() : {}
      };
      button.disabled = true; const label = button.textContent; button.textContent = prod ? '접수 중...' : '미리보기 확인 중...';
      try {
        if (prod) {
          const res = await fetch('/api/inquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
          const body = await res.json().catch(() => ({}));
          if (!res.ok) return fail(body.error || '접수되지 않았습니다. 잠시 후 다시 시도해 주세요.');
          if (typeof window.fbq === 'function') window.fbq('track','Lead');
        }
        mainSections.forEach(el => { el.hidden = true; });
        if (sticky) sticky.hidden = true;
        done.hidden = false;
        const copy = document.querySelector('#wd-done-copy');
        if (!prod && copy) copy.textContent = '미리보기에서는 실제 상담이 접수되지 않습니다. 운영 반영 후 정상 접수됩니다.';
        done.focus(); window.scrollTo({top:0});
      } catch { fail('접수되지 않았습니다. 잠시 후 다시 시도해 주세요.'); }
      finally { button.disabled = false; button.textContent = label; }
    });
  }

  const heroBtn = document.querySelector('.wd-hero .wd-btn-main');
  const formSec = document.querySelector('#wd-form');
  if (sticky && 'IntersectionObserver' in window) {
    const vis = new Map();
    const io = new IntersectionObserver(es => { es.forEach(en => vis.set(en.target,en.isIntersecting)); sticky.classList.toggle('show',!vis.get(heroBtn)&&!vis.get(formSec)); });
    if (heroBtn) io.observe(heroBtn); if (formSec) io.observe(formSec);
  }
})();