// 맞춤 추천: 미리 정해 둔 표(조건 → 제품)로만 추천한다. 금액은 카탈로그 자료에서 가져온다.
// 추천 표는 초안이다. 운영자가 확인한 뒤 아래 TREE 를 고친다. 제품 이름은 data/catalog-prices.json 의 name 과 똑같이 적는다.
(async () => {
  const { esc } = Site;
  const pick = (why, ...names) => ({ why, names });

  const TREE = {
    q: '어떤 제품을 찾으세요?',
    options: [
      { label: '정수기', category: '정수기', next: {
        q: '어디에서 사용하시나요?',
        options: [
          { label: '개인·가정', hint: '집·아파트·원룸', next: {
            q: '어떤 물을 사용하시나요?',
            options: [
              { label: '상수도', next: {
                q: '필요한 기능을 골라 주세요',
                options: [
                  { label: '정수만', hint: '상온 정수', next: {
                    q: '설치 형태를 골라 주세요',
                    options: [
                      { label: '싱크대 위', result: pick('정수 기능에 집중한 데스크형 제품이에요.', '스위치', '프라임 베이직') },
                      { label: '싱크대 아래', hint: '본체를 숨기는 빌트인', result: pick('싱크대 위 공간을 비우는 정수 전용 빌트인 제품이에요.', '스위치 빌트인') },
                    ] } },
                  { label: '냉수·온수·정수', next: {
                    q: '무엇이 가장 중요하세요?',
                    options: [
                      { label: '좁은 공간', result: pick('크기가 작고 냉수·온수·정수를 쓰는 제품이에요.', '아이콘 정수기 3', '아이콘 정수기 2') },
                      { label: '편의 기능·디자인', result: pick('출수 편의와 디자인을 중시한 제품이에요.', '아이콘 프로', '노블 정수기 세로·가로') },
                      { label: '싱크대 위를 비우기', hint: '빌트인', result: pick('냉수·온수까지 쓰면서 본체를 싱크대 아래에 두는 제품이에요.', '엘리트 빌트인 정수기', '노블 빌트인 정수기') },
                    ] } },
                  { label: '얼음까지', next: {
                    q: '얼음을 어떻게 사용하시나요?',
                    options: [
                      { label: '1~2명이 가볍게', result: pick('작은 공간에서 일상적으로 얼음을 쓰기 좋은 제품이에요.', '아이콘 얼음정수기 미니') },
                      { label: '3~4명이 자주', result: pick('가정에서 얼음을 자주 쓰는 조건에 맞춘 제품이에요.', '아이콘 얼음정수기 스탠다드', '아이콘 얼음정수기 오리지널') },
                      { label: '5명 이상·사용량 많음', result: pick('가정용 중 얼음 사용량을 넉넉하게 고려한 제품이에요.', '아이콘 얼음정수기 맥스', '아이콘 얼음정수기 스탠다드') },
                      { label: '커피도 함께', result: pick('냉수·온수·정수·얼음에 커피 기능까지 필요한 조건이에요.', '카페 얼음정수기') },
                    ] } },
                ] } },
              { label: '지하수·기타 용수', hint: '설치 전 확인 필요', result: pick('지하수는 수질과 제품별 허용 원수를 먼저 확인해야 해요. 모델명만으로 결정하지 않고 전문 상담으로 설치 가능 여부부터 확인합니다.') },
            ] } },
          { label: '개인사업자·매장', hint: '카페·음식점·소형 사업장', next: {
            q: '어떤 물을 사용하시나요?',
            options: [
              { label: '상수도', next: {
                q: '하루 이용 규모는 어느 정도인가요?',
                options: [
                  { label: '10명 미만', hint: '작은 매장·사무공간', next: {
                    q: '원하는 형태와 기능을 골라 주세요',
                    options: [
                      { label: '데스크형 냉온정', result: pick('작은 사업장에 두기 좋은 데스크형 냉온정수기예요.', '아이콘 정수기 3', '아이콘 프로') },
                      { label: '스탠드형 냉온정', result: pick('작은 사업장에서 물을 편하게 쓰는 스탠드형 제품이에요.', '워터 스탠드 2', '워터 스탠드 플러스') },
                      { label: '스탠드형 얼음', result: pick('소규모 사업장에서 얼음까지 쓰는 제품이에요.', '아이스 스탠드 1.0', '아이스 스탠드 3.0') },
                      { label: '커피까지', result: pick('커피와 얼음을 한 기기에서 쓰는 제품이에요.', '카페 얼음정수기') },
                    ] } },
                  { label: '10명 이상', hint: '사용량 많은 매장', next: {
                    q: '필요한 기능을 골라 주세요',
                    options: [
                      { label: '냉수·온수·정수', result: pick('피크 시간대 사용량을 고려한 스탠드형 제품이에요.', '프라임 스탠드', 'RO 직수 스탠드', '스탠드 정수기') },
                      { label: '얼음까지', result: pick('얼음 사용량이 많은 사업장에서 검토할 제품이에요.', '아이스 스탠드 3.8', '아이스 스탠드 5.2') },
                      { label: '커피까지', result: pick('커피 기능은 사용량과 운영 방식을 확인한 뒤 설치 수량까지 함께 상담해요.', '카페 얼음정수기') },
                    ] } },
                ] } },
              { label: '지하수·기타 용수', hint: '설치 전 확인 필요', result: pick('사업장 지하수는 수질·피크 사용량·배수와 제품별 허용 원수를 먼저 확인해야 해요. 자동 추천 대신 전문 상담으로 연결합니다.') },
            ] } },
          { label: '법인·사무실', hint: '회사·기관·여러 설치 장소', next: {
            q: '어떤 물을 사용하시나요?',
            options: [
              { label: '상수도', next: {
                q: '몇 분이 함께 사용하시나요?',
                options: [
                  { label: '10명 미만', next: {
                    q: '필요한 기능을 골라 주세요',
                    options: [
                      { label: '냉수·온수·정수', result: pick('소형 사무실에 두기 좋은 스탠드형 제품이에요.', '워터 스탠드 2', '워터 스탠드 플러스', '프라임 스탠드') },
                      { label: '얼음까지', result: pick('소형 사무실에서 얼음까지 쓰는 제품이에요.', '아이스 스탠드 1.0', '아이스 스탠드 3.0') },
                      { label: '커피까지', result: pick('사무실에서 커피와 얼음을 함께 쓰는 제품이에요.', '카페 얼음정수기') },
                    ] } },
                  { label: '10~30명', next: {
                    q: '필요한 기능을 골라 주세요',
                    options: [
                      { label: '냉수·온수·정수', result: pick('중형 사무실 사용량을 고려한 스탠드형 제품이에요.', '프라임 스탠드', 'RO 직수 스탠드', '스탠드 정수기') },
                      { label: '얼음까지', result: pick('중형 사무실에서 얼음까지 쓰는 제품이에요.', '아이스 스탠드 3.0', '아이스 스탠드 3.8') },
                      { label: '커피까지', result: pick('커피 기능과 실제 이용량을 함께 확인할 제품이에요.', '카페 얼음정수기') },
                    ] } },
                  { label: '30명 이상·여러 장소', result: pick('대규모 법인은 피크 사용량, 설치 대수, 결제와 계약 담당자를 먼저 확인해요. 자동 추천보다 법인 상담으로 견적을 구성합니다.') },
                ] } },
              { label: '지하수·기타 용수', hint: '설치 전 확인 필요', result: pick('법인·사업장 지하수는 수질과 설치 장소별 조건을 확인해야 해요. 모델을 자동 확정하지 않고 법인 상담으로 연결합니다.') },
            ] } },
        ] } },

      { label: '공기청정기', category: '공기청정기', next: {
        q: '가장 필요한 기능은 무엇인가요?',
        options: [
          { label: '공기청정', next: {
            q: '어느 정도 공간에 두실 건가요?',
            options: [
              { label: '방·작은 공간', hint: '방 하나 크기', result: pick('방이나 작은 공간에 두기 좋은 제품이에요.', '스퀘어핏 공기청정기', '싱글파워 공기청정기', '아이콘 공기청정기') },
              { label: '거실·중형 공간', result: pick('거실과 중형 공간에서 방향과 청정 범위를 고려한 제품이에요.', '노블 공기청정기 플러스', '노블 공기청정기2', '멀티액션 공기청정기2') },
              { label: '넓은 공간·사업장', result: pick('넓은 공간의 청정 면적과 흡입 성능을 고려한 제품이에요.', '파워업 공기청정기2', '콰트로파워 공기청정기', '노블 공기청정기 플러스') },
              { label: '벽걸이 설치', result: pick('바닥 공간을 사용하지 않는 벽걸이형 제품이에요.', '벽걸이 공기청정기 2') },
            ] } },
          { label: '가습 + 공기청정', result: pick('가습과 공기청정을 한 제품에서 사용하는 조건이에요.', '듀얼클린 가습공기청정기 2') },
          { label: '제습 + 공기청정', result: pick('제습과 공기청정을 함께 사용하는 조건이에요.', '노블 제습공기청정기', '듀얼클린 제습공기청정기') },
          { label: '제습만', next: {
            q: '제습할 공간은 어느 정도인가요?',
            options: [
              { label: '방·작은 공간', result: pick('방과 작은 공간에서 사용하기 좋은 제습기예요.', '노블 제습기', '인버터 제습기 20L') },
              { label: '거실·넓은 공간', result: pick('넓은 공간과 많은 제습량을 고려한 제품이에요.', '인버터 제습기 23L', '인버터 제습기 25L') },
            ] } },
          { label: '온풍 + 공기청정', result: pick('온풍과 공기청정을 함께 쓰는 조건이에요.', '히티브 온풍 공기청정기') },
        ] } },

      { label: '비데', category: '비데', next: {
        q: '무엇이 가장 중요하세요?',
        options: [
          { label: '렌탈료 부담 낮추기', result: pick('필요한 기본 기능에 집중한 제품이에요.', '프라임 비데', '스타일 비데') },
          { label: '위생·관리 기능', result: pick('위생과 관리 기능을 중시한 제품이에요.', '더블케어 비데', '더매너 비데 플러스') },
          { label: '기능이 많은 상위 제품', result: pick('편의 기능이 더 들어간 상위 제품이에요.', '더블케어 비데 플러스', '스타일 비데 플러스') },
          { label: '수압이 약한 편', result: pick('수압이 약한 설치 환경에서 우선 검토할 제품이에요.', '저수압용 비데') },
          { label: '설치할 수 있는지 모르겠어요', result: pick('비데는 변기 형태, 전원 콘센트, 급수와 수압을 먼저 확인해요. 사진이나 방문 상담으로 설치 가능 여부부터 안내합니다.') },
        ] } },

      { label: '매트리스', category: '매트리스', next: {
        q: '가장 원하는 수면 방식은 무엇인가요?',
        options: [
          { label: '스프링 매트리스', next: {
            q: '어떤 구성을 선호하세요?',
            options: [
              { label: '지지력과 편안함 중시', hint: '9존 독립스프링', result: pick('지지력과 편안함을 중시한 9존 스프링 제품이에요.', '시그니처 파이어쉴드 컴포트', '시그니처 파이어쉴드', '시그니처 컴포트') },
              { label: '균형 잡힌 구성', hint: '7존 스프링', result: pick('균형 잡힌 착와감을 고려한 7존 스프링 제품이에요.', '하이브리드 4', '하이브리드 3', '루네어') },
              { label: '렌탈료 부담 낮추기', result: pick('스프링 매트리스 중 부담을 낮춘 제품이에요.', '엘리트', '더블체인지', '모디') },
            ] } },
          { label: '경도 조절', hint: '스마트 매트리스', result: pick('그때그때 단단함을 조절하는 스마트 매트리스예요.', '비렉스 스마트 매트리스 S6+', '비렉스 스마트 매트리스 S8+') },
          { label: '수면 측정 + 경도 조절', hint: '슬립 싱크 스마트', result: pick('수면을 측정하면서 경도까지 조절하는 스마트 매트리스예요.', '비렉스 스마트 매트리스 S8+ 슬립 싱크', '비렉스 스마트 매트리스 S6+ 슬립 싱크') },
          { label: '수면 측정 + 스프링', hint: '슬립 싱크 스프링', result: pick('스프링 착와감과 수면 측정 기능을 함께 원하는 조건이에요.', '시그니처 파이어쉴드 매트리스 슬립 싱크') },
          { label: '메모리폼', result: pick('스프링 없이 폼으로 구성된 매트리스예요.', '컴팩트 메모리폼') },
          { label: '프레임 일체형', result: pick('별도 프레임 없이 설치하는 일체형 매트리스예요.', '원바디 2') },
        ] } },

      { label: '음식물처리기', category: '음식물처리기', next: {
        q: '어디에서 사용하시나요?',
        options: [
          { label: '개인·가정', next: {
            q: '어떤 처리 방식이 더 편하세요?',
            options: [
              { label: '음식물을 수시로 넣기', hint: '미생물형', result: pick('음식물을 모아두기보다 수시로 투입하는 생활에 맞는 미생물형 제품이에요.', '미생물 음식물처리기') },
              { label: '분쇄·건조로 빠르게 줄이기', next: {
                q: '평소 음식물 발생량은 어느 정도인가요?',
                options: [
                  { label: '적은 편', hint: '1~2인·좁은 주방', result: pick('적은 양과 좁은 공간에 맞는 2L 제품이에요.', '음식물처리기 2L') },
                  { label: '보통 이상', hint: '3인 이상·집밥이 잦음', result: pick('처리량을 넉넉하게 고려한 3L 제품이에요.', '음식물처리기 3L', '음식물처리기 2L') },
                ] } },
              { label: '아직 잘 모르겠어요', result: pick('사용 습관에 따라 미생물형과 분쇄·건조형을 비교해 볼 수 있어요.', '미생물 음식물처리기', '음식물처리기 2L', '음식물처리기 3L') },
            ] } },
          { label: '사업장·업소', result: pick('현재 등록 제품은 가정의 처리량과 설치 환경을 기준으로 먼저 안내해요. 사업장은 음식물 발생량과 사용 목적을 확인한 뒤 적합 여부를 별도 상담합니다.') },
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
      const resultNames = found.length ? found.map(p => p.name).join(', ') : '설치·전문 상담 필요';
      const note = `[맞춤 추천] ${answers().join(' / ')} → ${resultNames}`;
      const cards = found.length
        ? `<div class="grid">${found.map((p, i) => Site.card(p, i === 0 ? '가장 적합' : '비교 후보')).join('')}</div>`
        : '<p class="empty">설치 환경과 사용 조건을 먼저 확인한 뒤 제품을 안내해 드려요.</p>';
      box.innerHTML = `${bar}<p class="quiz-progress">${esc(answers().join(' › '))}</p>
        <h1>${esc(n.result.why)}</h1>
        ${cards}
        <p class="note">추천 결과의 가격표에서 약정과 관리 방식을 확인할 수 있어요. 최종 렌탈료·프로모션·설치 가능 여부는 상담 시 다시 확인합니다.</p>
        <div class="result-actions">
          <a class="btn btn-main" href="consult.html?note=${encodeURIComponent(note)}">${found.length ? '추천 결과로 상담 신청' : '설치 상담 신청'}</a>
          <a class="btn btn-kakao" href="https://open.kakao.com/o/st6dXvDg" target="_blank" rel="noopener">카카오톡 상담</a>
          <a class="btn btn-line" href="tel:010-3490-8733"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg>바로 문의</a>
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
