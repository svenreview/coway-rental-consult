// 맞춤 추천: 미리 정해 둔 표(조건 → 제품)로만 추천한다. 금액은 카탈로그 자료에서 가져온다.
// 추천 표는 초안이다. 운영자가 확인한 뒤 아래 TREE 를 고친다. 제품 이름은 data/catalog-prices.json 의 name 과 똑같이 적는다.
(async () => {
  const { esc } = Site;
  const pick = (why, ...names) => ({ why, names });

  const TREE = {
    q: '어떤 제품을 찾으세요?',
    options: [
      { label: '정수기', category: '정수기', next: {
        q: '누가 쓰실 건가요?',
        options: [
          { label: '개인·가정', hint: '1~4인 가구', next: {
            q: '필요한 기능을 골라 주세요',
            options: [
              { label: '정수만', hint: '렌탈료가 가장 낮아요', next: {
                q: '어디에 설치하실 건가요?',
                options: [
                  { label: '싱크대 위', result: pick('정수 기능만 있는, 렌탈료가 낮은 정수기예요.', '스위치', '프라임 베이직') },
                  { label: '싱크대 아래', hint: '본체를 숨기는 빌트인', result: pick('정수 기능만 있는, 본체를 싱크대 아래에 두는 빌트인 정수기예요.', '스위치 빌트인') },
                ] } },
              { label: '냉수·온수까지', next: {
                q: '무엇이 가장 중요하세요?',
                options: [
                  { label: '좁은 주방에도 놓기', result: pick('얼음 없이 냉수·온수·정수를 쓰는 작은 크기의 정수기예요.', '아이콘 정수기 3', '아이콘 정수기 2') },
                  { label: '디자인·편의 기능', result: pick('디자인과 편의 기능을 더한 냉온정 정수기예요.', '아이콘 프로', '노블 정수기 세로·가로') },
                  { label: '싱크대 위를 비우기', hint: '본체를 싱크대 아래에 넣는 빌트인', result: pick('냉수·온수까지 되는 빌트인 정수기예요.', '엘리트 빌트인 정수기', '노블 빌트인 정수기') },
                ] } },
              { label: '얼음까지', next: {
                q: '몇 분이 함께 쓰세요?',
                options: [
                  { label: '1~2인', hint: '얼음은 가끔, 조금', result: pick('얼음정수기 중 크기가 가장 작은 제품이에요.', '아이콘 얼음정수기 미니') },
                  { label: '3~4인', hint: '얼음을 매일 써요', result: pick('크기는 작게, 얼음은 넉넉하게 쓰는 제품이에요.', '아이콘 얼음정수기 스탠다드', '아이콘 얼음정수기 오리지널') },
                  { label: '5인 이상', hint: '여름에 얼음을 많이 써요', result: pick('가정용 얼음정수기 중 얼음 용량이 가장 큰 제품이에요.', '아이콘 얼음정수기 맥스') },
                ] } },
              { label: '커피까지', hint: '냉·온·정·얼음 + 커피', result: pick('냉수·온수·정수·얼음에 커피까지 되는 제품이에요.', '카페 얼음정수기') },
            ] } },
          { label: '개인사업자', hint: '가게·매장', next: {
            q: '하루에 몇 분 정도 쓰세요?',
            options: [
              { label: '10명 미만', hint: '작은 가게, 10테이블 미만', next: {
                q: '필요한 기능을 골라 주세요',
                options: [
                  { label: '정수·냉수·온수', result: pick('작은 매장에 두기 좋은 스탠드형 정수기예요.', '워터 스탠드 2', '워터 스탠드 플러스') },
                  { label: '얼음까지', result: pick('작은 매장에서 얼음까지 쓰는 스탠드형 얼음정수기예요.', '아이스 스탠드 1.0', '아이스 스탠드 3.0') },
                  { label: '커피까지', result: pick('냉수·온수·정수·얼음에 커피까지 되는 제품이에요.', '카페 얼음정수기') },
                ] } },
              { label: '10명 이상', hint: '10테이블 이상', next: {
                q: '필요한 기능을 골라 주세요',
                options: [
                  { label: '정수·냉수·온수', result: pick('많은 사람이 쓰는 곳에 맞는 대용량 스탠드 정수기예요.', 'RO 직수 스탠드', '스탠드 정수기', '프라임 스탠드') },
                  { label: '얼음까지', result: pick('얼음을 많이 쓰는 매장용 대용량 얼음정수기예요.', '아이스 스탠드 3.8', '아이스 스탠드 5.2') },
                  { label: '커피까지', result: pick('냉수·온수·정수·얼음에 커피까지 되는 제품이에요.', '카페 얼음정수기') },
                ] } },
            ] } },
          { label: '법인·사무실', hint: '회사·기관', next: {
            q: '몇 분이 함께 쓰세요?',
            options: [
              { label: '20명 미만', next: {
                q: '필요한 기능을 골라 주세요',
                options: [
                  { label: '정수·냉수·온수', result: pick('사무실에 두기 좋은 스탠드형 정수기예요.', '워터 스탠드 2', '워터 스탠드 플러스', '프라임 스탠드') },
                  { label: '얼음까지', result: pick('사무실에서 얼음까지 쓰는 스탠드형 얼음정수기예요.', '아이스 스탠드 1.0', '아이스 스탠드 3.0') },
                  { label: '커피까지', result: pick('냉수·온수·정수·얼음에 커피까지 되는 제품이에요.', '카페 얼음정수기') },
                ] } },
              { label: '20명 이상', next: {
                q: '필요한 기능을 골라 주세요',
                options: [
                  { label: '정수·냉수·온수', result: pick('많은 인원이 쓰는 대용량 스탠드 정수기예요.', 'RO 직수 스탠드', '스탠드 정수기') },
                  { label: '얼음까지', result: pick('많은 인원이 얼음까지 쓰는 대용량 얼음정수기예요.', '아이스 스탠드 3.8', '아이스 스탠드 5.2') },
                ] } },
            ] } },
        ] } },
      { label: '공기청정기', category: '공기청정기', next: {
        q: '공기청정 말고 더 필요한 기능이 있나요?',
        options: [
          { label: '공기청정만 있으면 돼요', next: {
            q: '어느 정도 공간에 두실 건가요?',
            options: [
              { label: '방 하나', hint: '10평 안팎', result: pick('방 하나 크기에 맞는 작은 공기청정기예요.', '스퀘어핏 공기청정기', '싱글파워 공기청정기', '아이콘 공기청정기') },
              { label: '거실', hint: '15~24평', result: pick('거실 크기에 맞는 공기청정기예요. 평형별 모델은 금액표에서 고를 수 있어요.', '노블 공기청정기2', '스퀘어핏 공기청정기', '멀티액션 공기청정기2') },
              { label: '넓은 공간', hint: '30평 이상', result: pick('넓은 공간용 공기청정기예요. 평형별 모델은 금액표에서 고를 수 있어요.', '노블 공기청정기2', '콰트로파워 공기청정기', '파워업 공기청정기2') },
            ] } },
          { label: '가습도 필요해요', result: pick('가습과 공기청정을 함께 하는 제품이에요.', '듀얼클린 가습공기청정기 2') },
          { label: '제습도 필요해요', result: pick('제습과 공기청정을 함께 하는 제품이에요.', '노블 제습공기청정기', '듀얼클린 제습공기청정기') },
          { label: '온풍도 필요해요', result: pick('온풍과 공기청정을 함께 하는 제품이에요.', '히티브 온풍 공기청정기') },
        ] } },
      { label: '비데', category: '비데', next: {
        q: '무엇이 가장 중요하세요?',
        options: [
          { label: '렌탈료 낮추기', result: pick('비데 중 렌탈료가 낮은 편인 제품이에요.', '프라임 비데', '스타일 비데') },
          { label: '기능이 많은 제품', result: pick('기본형보다 기능이 더 들어간 상위 제품이에요.', '더매너 비데 플러스', '더블케어 비데 플러스') },
          { label: '우리 집은 수압이 약해요', result: pick('수압이 약한 집에 맞춘 제품이에요.', '저수압용 비데') },
        ] } },
      { label: '매트리스', category: '매트리스', next: {
        // 종류는 카탈로그 목차의 분류(스마트 / 스프링 AD9존·AD7존·모노존 / 폼 / 원바디)를 따른다. 라텍스 제품은 카탈로그에 없다.
        q: '어떤 종류의 매트리스를 찾으세요?',
        options: [
          { label: '스프링', hint: '가장 종류가 많아요', next: {
            q: '스프링 구성을 골라 주세요',
            options: [
              { label: '9존 독립스프링', hint: '시그니처 라인', result: pick('9존 독립스프링(AD9) 매트리스', '시그니처 파이어쉴드 컴포트', '시그니처 파이어쉴드', '시그니처 컴포트', '시그니처') },
              { label: '7존 스프링', hint: '하이브리드·루네어·더블 사이드', result: pick('7존 스프링(AD7) 매트리스', '하이브리드 4', '하이브리드 3', '루네어', '더블 사이드') },
              { label: '모노존 스프링', hint: '렌탈료가 가장 낮은 편', result: pick('모노존 스프링 매트리스', '엘리트', '더블체인지', '모디') },
            ] } },
          { label: '메모리폼', hint: '스프링 없이 폼으로만', result: pick('메모리폼 매트리스', '컴팩트 메모리폼') },
          { label: '스마트 매트리스', hint: '단단함을 그때그때 조절', result: pick('단단함을 조절하는 스마트 매트리스', '비렉스 스마트 매트리스 S6+', '비렉스 스마트 매트리스 S8+') },
          { label: '프레임 일체형', hint: '다리가 달려 프레임 없이 써요', result: pick('프레임 일체형 매트리스', '원바디 2') },
        ] } },
    ],
  };

  const box = document.querySelector('#quiz');
  const trail = []; // 지금까지 고른 보기
  let products = [];
  try { products = await Site.load(); } catch (err) { box.innerHTML = `<p class="empty">${esc(err.message)}. 잠시 뒤 새로 고침 해 주세요.</p>`; return; }

  const node = () => trail.reduce((n, i) => n.options[i].next || n.options[i], TREE);
  const category = () => trail.length ? TREE.options[trail[0]].category : '';
  const answers = () => { let n = TREE; return trail.map(i => { const o = n.options[i]; n = o.next || n; return o.label; }); };

  // 남은 질문 수(가장 긴 길 기준)로 진행 막대를 채운다
  const depth = n => n.result ? 0 : 1 + Math.max(...n.options.map(o => depth(o.next || o)));
  function render() {
    const n = node();
    const pct = n.result ? 100 : Math.round(trail.length / (trail.length + depth(n)) * 100);
    const bar = `<div class="quiz-bar" aria-hidden="true"><i style="width:${Math.max(pct, 6)}%"></i></div>`;
    const back = trail.length ? `<button type="button" class="quiz-back" data-back>이전 질문으로</button>` : '';
    if (n.result) {
      const found = n.result.names.map(name => products.find(p => p.category === category() && p.name === name)).filter(Boolean);
      const note = `[맞춤 추천] ${answers().join(' / ')} → ${found.map(p => p.name).join(', ')}`;
      box.innerHTML = `${bar}<p class="quiz-progress">${esc(answers().join(' › '))}</p>
        <h1>${esc(n.result.why)}</h1>
        <div class="grid">${found.map(p => Site.card(p)).join('')}</div>
        <div class="result-actions">
          <a class="btn btn-main" href="consult.html?note=${encodeURIComponent(note)}">장바구니 보기</a>
          <a class="btn btn-kakao" href="https://open.kakao.com/o/st6dXvDg" target="_blank" rel="noopener">카카오톡 상담</a>
          <a class="btn btn-line" href="tel:010-3490-8733">무료 상담 전화</a>
          <a class="btn btn-line" href="products.html#${encodeURIComponent(category())}">${esc(category())} 전체 보기</a>
        </div>
        ${back}`;
    } else {
      box.innerHTML = `${bar}<section class="quiz-card">
        <p class="quiz-progress">${trail.length ? esc(answers().join(' › ')) : ''}</p>
        <h1>${esc(n.q)}</h1>
        <div class="choices">${n.options.map((o, i) => `<button type="button" data-i="${i}"><b>${esc(o.label)}</b>${o.hint ? `<span>${esc(o.hint)}</span>` : ''}</button>`).join('')}</div>
        ${back}</section>`;
    }
    box.querySelector('h1').focus?.();
  }

  box.addEventListener('click', e => {
    const choice = e.target.closest('[data-i]');
    if (choice) { trail.push(+choice.dataset.i); render(); window.scrollTo({ top: 0 }); return; }
    if (e.target.closest('[data-back]')) { trail.pop(); render(); }
  });
  Site.wire(products);
  render();
})();
