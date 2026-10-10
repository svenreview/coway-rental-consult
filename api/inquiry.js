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
  return res.status(200).json({ ok: true });
};
