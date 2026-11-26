// 상담 신청 받기: 브라우저가 보낸 내용을 확인해서 Supabase inquiries 표에 저장한다.
// 키는 환경변수에서만 읽는다. 코드에 값을 적지 않는다.
const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const KINDS = ['가정', '사업장', '법인'];
const clip = (v, n) => String(v ?? '').trim().slice(0, n);
const sbHeaders = () => ({
  apikey: SB_KEY,
  ...(String(SB_KEY).startsWith('eyJ') ? { Authorization: `Bearer ${SB_KEY}` } : {}),
  'Content-Type': 'application/json',
});

const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST만 가능해요' });
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: 'Supabase 연결 정보가 없어요. Vercel Storage 연결 후 다시 배포해 주세요.' });
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  if (b.website) return res.status(200).json({ ok: true }); // 스팸 함정 칸(사람에게는 안 보임)
  const products = Array.isArray(b.products) ? b.products.slice(0, 30).map(p => clip(p, 80)).filter(Boolean).join('\n') : '';
  const row = {
    name: clip(b.name, 50),
    contact: clip(b.contact, 100),
    kind: KINDS.includes(b.kind) ? b.kind : null,
    products: clip(products, 2000) || null,
    message: clip(b.message, 1000),
    consent: b.consent === true,
  };
  // 유입 경로(UTM): 값이 있을 때만 저장한다
  const utm = b.utm && typeof b.utm === 'object' ? b.utm : {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'referrer']) row[k] = clip(utm[k], 120) || null;
  if (!row.name || !row.contact) return res.status(400).json({ error: '이름과 연락처를 적어 주세요' });
  if (!row.consent) return res.status(400).json({ error: '개인정보 수집·이용에 동의해 주세요' });
  const r = await fetch(`${SB_URL}/rest/v1/inquiries`, { method: 'POST', headers: { ...sbHeaders(), Prefer: 'return=minimal' }, body: JSON.stringify(row) });
  if (!r.ok) return res.status(500).json({ error: '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.' });
  // 알림이 실패해도 접수는 된 것으로 본다. 메일·문자·시트 기록을 동시에 시도한다.
  await Promise.allSettled([notify(row, req.headers.host), textAlerts(row), sheetLog(row)]);
  return res.status(200).json({ ok: true });
};

// 사은품 신청이면 상품 번호([g01])로 GIFT_SOURCES 환경변수에서 쿠팡 링크와 실제 주문할 아마존 링크를 찾아 붙인다.
// 형식: {"g01":{"n":"상품명","m":"아마존","p":"$9.99 + 한국배송 $8.36","u":"아마존 링크","c":"쿠팡 링크"}}
function giftSources(products) {
  const ids = [...String(products || '').matchAll(/\[(g\d{2,3})\]/g)].map(m => m[1]);
  if (!ids.length) return [];
  let map = {};
  try { map = JSON.parse(process.env.GIFT_SOURCES_V2 || process.env.GIFT_SOURCES || '{}'); } catch { map = {}; }
  return ids.flatMap(id => {
    const s = map[id];
    if (!s) return [`[${id}] 구매처 정보 없음`, ''];
    return [
      `[${id}] ${s.n || ''}`,
      s.c ? `  쿠팡 상품: ${s.c}` : '',
      s.u ? `  아마존 주문: ${s.u}` : '',
      s.p ? `  참고가: ${s.p}` : '',
    ].filter(Boolean).concat('');
  });
}

// 새 문의 알림 메일. RESEND_API_KEY 와 NOTIFY_EMAIL 환경변수가 둘 다 있을 때만 보낸다.
// 개인정보 동의를 받은 상담 신청의 연락처·제품·문의 내용을 담당자 이메일로 함께 보낸다.
async function notify(row, host) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!key || !to) return;
  const source = row.utm_source ? [row.utm_source, row.utm_medium, row.utm_campaign].filter(Boolean).join(' / ') : (row.referrer || '직접 방문');
  // 사은품 신청이면 구매처(마켓·링크·가격)를 담당자 메일에만 붙인다. 구매처는 환경변수 GIFT_SOURCES 에만 있다.
  const giftLines = giftSources(row.products);
  const text = [
    '새 상담 신청이 들어왔어요.',
    '',
    `이름: ${row.name}`,
    `연락처: ${row.contact}`,
    `사용 장소: ${row.kind || '-'}`,
    '',
    '상담받을 제품:',
    row.products || '(제품을 정하지 않음)',
    '',
    '문의 내용:',
    row.message || '(별도 문의 내용 없음)',
    '',
    ...(giftLines.length ? ['', '사은품 구매처:', ...giftLines] : []),
    '',
    `유입 경로: ${source}`,
    `관리자 페이지: https://${host}/admin`,
  ].join('\n');
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.NOTIFY_FROM || '코웨이 상담 알림 <onboarding@resend.dev>', to: [to], subject: `${giftLines.length ? '새 사은품 신청' : '새 상담 신청'}: ${row.name}`, text }),
    signal: AbortSignal.timeout(5000),
  });
}

// ── 카카오 알림톡 (솔라피) ─────────────────────────────────────────
// 문자·RCS 권한은 허용 IP 고정이 필요해 Vercel 에서는 쓸 수 없어 알림톡으로 보낸다. (2026-11-26)
// 환경변수 SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER(등록 발신번호), SOLAPI_PFID(카카오 채널 연동 ID)가 모두 있을 때만 동작한다.
// SOLAPI_TPL_OWNER + OWNER_ALERT_PHONE 이 있으면 담당자에게 새 상담 알림톡을 보낸다.
//   템플릿 변수: #{이름} #{연락처} #{구분} #{제품} #{유입}
// SOLAPI_TPL_REPLY 가 있으면 신청한 고객에게 첫인사 알림톡을 보낸다. 템플릿 변수: #{이름}
// 템플릿은 카카오 심사를 통과한 것만 넣는다. 템플릿 ID 가 없으면 그 알림톡은 보내지 않는다.
const mobile = v => { const d = String(v || '').replace(/\D/g, ''); return /^01[016789]\d{7,8}$/.test(d) ? d : null; };
function solapiAuth() {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString('hex');
  const signature = crypto.createHmac('sha256', process.env.SOLAPI_API_SECRET).update(date + salt).digest('hex');
  return `HMAC-SHA256 apiKey=${process.env.SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
}
async function sendAlimtalk(to, templateId, variables) {
  const r = await fetch('https://api.solapi.com/messages/v4/send', {
    method: 'POST',
    headers: { Authorization: solapiAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: {
      to,
      from: String(process.env.SOLAPI_SENDER).replace(/\D/g, ''),
      type: 'ATA',
      kakaoOptions: { pfId: process.env.SOLAPI_PFID, templateId, variables, disableSms: true },
    } }),
    signal: AbortSignal.timeout(5000),
  });
  if (!r.ok) console.error('solapi', r.status, await r.text().catch(() => ''));
}
async function textAlerts(row) {
  const env = process.env;
  if (!env.SOLAPI_API_KEY || !env.SOLAPI_API_SECRET || !env.SOLAPI_SENDER || !env.SOLAPI_PFID) return;
  const jobs = [];
  const owner = mobile(env.OWNER_ALERT_PHONE);
  if (owner && env.SOLAPI_TPL_OWNER) {
    jobs.push(sendAlimtalk(owner, env.SOLAPI_TPL_OWNER, {
      '#{이름}': row.name,
      '#{연락처}': row.contact,
      '#{구분}': row.kind || '-',
      '#{제품}': String(row.products || '').split('\n')[0] || '제품 미정',
      '#{유입}': row.utm_campaign || row.utm_source || '직접 방문',
    }));
  }
  const customer = mobile(row.contact);
  const isGift = /\[g\d{2,3}\]/.test(row.products || '');
  if (customer && !isGift && env.SOLAPI_TPL_REPLY) jobs.push(sendAlimtalk(customer, env.SOLAPI_TPL_REPLY, { '#{이름}': row.name }));
  await Promise.allSettled(jobs);
}

// ── 구글 시트 기록 ─────────────────────────────────────────────────
// 환경변수 SHEET_WEBHOOK_URL(구글 Apps Script 웹앱 주소)이 있을 때만, 새 상담을 시트에 한 줄씩 보낸다.
async function sheetLog(row) {
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url) return;
  const at = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: process.env.SHEET_WEBHOOK_TOKEN || '', at, ...row }),
    signal: AbortSignal.timeout(5000),
  });
}
