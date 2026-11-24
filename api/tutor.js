const { getSql, clientIp } = require('../lib/db');

const SYSTEM = `Kamu Tutor AI pendamping modul Fisika SMA, fokus hanya pada momentum, impuls, teorema impuls-momentum, hukum kekekalan momentum, dan jenis tumbukan. Konteks budaya pada modul: martonun ulos (hentakan alat tenun merapatkan benang) dan pembuatan tipa-tipa (alu menumbuk padi). Gunakan Bahasa Indonesia sederhana, ramah, dan singkat. Terapkan pedagogi scaffolding: mulai dengan pertanyaan pemantik, bantu bertahap dari petunjuk konsep ke langkah hitung, minta siswa menjelaskan alasan. Jangan langsung memberikan jawaban akhir untuk soal latihan/kuis; bantu mereka bernalar. Jika siswa sudah mencoba, tanggapi dan luruskan miskonsepsi dengan penjelasan. Jangan mengarang detail budaya; jika ditanya detail tradisi yang tidak ada dalam konteks, nyatakan bahwa perlu dikonfirmasi oleh ahli budaya. Jika pertanyaan di luar fisika materi tersebut, arahkan kembali secara sopan. Maksimal sekitar 150 kata per respons. Jangan meminta data pribadi.`;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ message: 'Gunakan metode POST.' });
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return res.status(503).json({ message: 'API key belum dipasang. Atur DEEPSEEK_API_KEY di Vercel.' });

  const input = req.body;
  if (!input || typeof input !== 'object') return res.status(400).json({ message: 'Format data tidak valid.' });
  const name = String(input.name ?? '').trim().slice(0, 100);
  const cls = String(input.class_name ?? '').trim().slice(0, 50);
  const sessionId = String(input.session_id ?? '').replace(/[^a-zA-Z0-9_-]/g, '');
  const messages = input.messages;
  if (!name || !cls || sessionId.length < 12 || !Array.isArray(messages) || messages.length < 1 || messages.length > 12)
    return res.status(400).json({ message: 'Data identitas atau riwayat chat tidak valid.' });

  const clean = [];
  for (const m of messages) {
    if (!m || !['user', 'assistant'].includes(m.role)) continue;
    const content = String(m.content ?? '').trim().slice(0, 1000);
    if (content) clean.push({ role: m.role, content });
  }
  if (!clean.length || clean[clean.length - 1].role !== 'user')
    return res.status(400).json({ message: 'Pertanyaan siswa tidak ditemukan.' });

  const ip = clientIp(req);
  let sql = null;
  try { sql = getSql(); } catch (e) { console.error(e.message); }

  // Rate limit: 20 pesan/10 menit per IP, 60 pesan/jam per nama+kelas.
  if (sql) {
    try {
      const [a] = await sql`SELECT COUNT(*)::int AS n FROM tutor_chat_logs
        WHERE role='user' AND ip_address=${ip} AND created_at > now() - interval '10 minutes'`;
      const [b] = await sql`SELECT COUNT(*)::int AS n FROM tutor_chat_logs
        WHERE role='user' AND student_name=${name} AND class_name=${cls} AND created_at > now() - interval '1 hour'`;
      if (a.n >= 20 || b.n >= 60)
        return res.status(429).json({ message: 'Terlalu banyak pesan. Tunggu beberapa menit lalu coba lagi.' });
    } catch (e) { console.error('rate-limit', e.message); }
  }

  let reply;
  try {
    const r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'deepseek-chat',
        messages: [{ role: 'system', content: SYSTEM }, ...clean],
        temperature: 0.5,
        max_tokens: 400,
        stream: false,
      }),
      signal: AbortSignal.timeout(45000),
    });
    const json = await r.json().catch(() => ({}));
    reply = json?.choices?.[0]?.message?.content?.trim();
    if (!r.ok || !reply) {
      console.error('deepseek error', r.status, JSON.stringify(json).slice(0, 300));
      return res.status(502).json({ message: 'Layanan AI gagal merespons. Periksa API key dan saldo DeepSeek.' });
    }
  } catch (e) {
    console.error('deepseek fetch', e.message);
    return res.status(502).json({ message: 'Tidak dapat menghubungi layanan AI.' });
  }

  if (sql) {
    try {
      const last = clean[clean.length - 1];
      await sql`INSERT INTO tutor_chat_logs (session_id, student_name, class_name, role, content, ip_address)
        VALUES (${sessionId}, ${name}, ${cls}, 'user', ${last.content}, ${ip}),
               (${sessionId}, ${name}, ${cls}, 'assistant', ${reply}, ${ip})`;
    } catch (e) { console.error('log', e.message); }
  }
  return res.status(200).json({ reply });
};
