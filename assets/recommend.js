// 맞춤 추천: 미리 정해 둔 표(조건 → 제품)로만 추천한다. 금액은 카탈로그 자료에서 가져온다.
// 추천 표는 초안이다. 운영자가 확인한 뒤 아래 TREE 를 고친다. 제품 이름은 data/catalog-prices.json 의 name 과 똑같이 적는다.
(async () => {
  const { esc } = Site;
  const pick = (why, ...names) => ({ why, names });

  const TREE = {
    q: '어떤 제품을 찾으세요?',
    options: [
      { label: '정수기', category: '정수기', next: {
        q: '어디에 두실 건가요?',
        options: [
          { label: '집', hint: '1~4인 가구', next: {
            q: '얼음도 필요하세요?',
            options: [
              { label: '얼음은 필요 없어요', next: {
                q: '무엇이 가장 중요하세요?',
                options: [
                  { label: '좁은 주방에도 놓기', result: pick('얼음 없이 냉수·온수·정수를 쓰는 작은 크기의 정수기예요.', '아이콘 정수기 3', '아이콘 정수기 2') },
                  { label: '싱크대 위를 비우기', hint: '본체를 싱크대 아래에 넣는 빌트인', result: pick('본체를 싱크대 아래에 두는 빌트인 정수기예요.', '스위치 빌트인', '노블 빌트인 정수기') },
                  { label: '렌탈료 낮추기', hint: '정수만 있으면 돼요', result: pick('정수 기능만 있는, 렌탈료가 낮은 정수기예요.', '스위치', '프라임 베이직') },
                ] } },
              { label: '얼음도 필요해요', next: {
                q: '얼음을 얼마나 쓰세요?',
                options: [
                  { label: '가끔, 조금', result: pick('얼음정수기 중 크기가 가장 작은 제품이에요.', '아이콘 얼음정수기 미니') },
                  { label: '매일, 보통', result: pick('크기는 작게, 얼음은 넉넉하게 쓰는 제품이에요.', '아이콘 얼음정수기 스탠다드', '아이콘 얼음정수기 오리지널') },
                  { label: '많이', hint: '식구가 많거나 여름에 자주', result: pick('가정용 얼음정수기 중 얼음 용량이 가장 큰 제품이에요.', '아이콘 얼음정수기 맥스') },
                ] } },
            ] } },
          { label: '가게·사무실', hint: '여러 사람이 함께 써요', next: {
            q: '얼음도 필요하세요?',
            options: [
              { label: '얼음은 필요 없어요', result: pick('여러 사람이 쓰는 곳에 두는 스탠드형 정수기예요.', '워터 스탠드 2', '워터 스탠드 플러스', '프라임 스탠드') },
              { label: '얼음도 필요해요', result: pick('매장·사무실에서 얼음까지 쓰는 스탠드형 얼음정수기예요.', '아이스 스탠드 1.0', '아이스 스탠드 3.0', '아이스 스탠드 5.2') },
              { label: '커피도 뽑고 싶어요', result: pick('냉수·온수·정수·얼음에 커피까지 되는 제품이에요.', '카페 얼음정수기') },
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
        q: '어떤 매트리스를 찾으세요?',
        options: [
          { label: '단단함을 그때그때 바꾸고 싶어요', result: pick('단단함을 조절할 수 있는 스마트 매트리스예요.', '비렉스 스마트 매트리스 S6+', '비렉스 스마트 매트리스 S8+') },
          { label: '렌탈료 낮추기', result: pick('매트리스 중 렌탈료가 낮은 편인 제품이에요.', '엘리트', '더블체인지', '모디') },
          { label: '중간 가격대', result: pick('가격과 구성의 균형을 맞춘 제품이에요.', '하이브리드 4', '하이브리드 3') },
          { label: '고급형', result: pick('시그니처 라인의 고급형 매트리스예요.', '시그니처 컴포트', '시그니처 파이어쉴드 컴포트') },
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

  function render() {
    const n = node();
    const back = trail.length ? `<button type="button" class="quiz-back" data-back>이전 질문으로</button>` : '';
    if (n.result) {
      const found = n.result.names.map(name => products.find(p => p.category === category() && p.name === name)).filter(Boolean);
      const note = `[맞춤 추천] ${answers().join(' / ')} → ${found.map(p => p.name).join(', ')}`;
      box.innerHTML = `<p class="quiz-progress">${esc(answers().join(' › '))}</p>
        <h1>${esc(n.result.why)}</h1>
        <div class="grid">${found.map(p => Site.card(p)).join('')}</div>
        <div class="result-actions">
          <a class="btn btn-main" href="consult.html?note=${encodeURIComponent(note)}">장바구니 보기</a>
          <a class="btn btn-line" href="products.html#${encodeURIComponent(category())}">${esc(category())} 전체 보기</a>
        </div>
        ${back}`;
    } else {
      box.innerHTML = `<p class="quiz-progress">${trail.length ? esc(answers().join(' › ')) : ''}</p>
        <h1>${esc(n.q)}</h1>
        <div class="choices">${n.options.map((o, i) => `<button type="button" data-i="${i}"><b>${esc(o.label)}</b>${o.hint ? `<span>${esc(o.hint)}</span>` : ''}</button>`).join('')}</div>
        ${back}`;
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
