const { getSql } = require('../lib/db');
// Kunci jawaban hanya ada di server.
const KEY = [0, 2, 1, 1, 2, 1, 0, 1, 0, 2];

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ message: 'Gunakan metode POST.' });
  const d = req.body;
  if (!d || typeof d !== 'object' || d.name == null || d.class_name == null || !d.test_type || !d.answers)
    return res.status(400).json({ message: 'Data pengiriman tidak lengkap' });
  const name = String(d.name).trim().slice(0, 100);
  const cls = String(d.class_name).trim().slice(0, 50);
  const type = d.test_type;
  const answers = d.answers;
  if (!name || !cls || !['pre-test', 'post-test'].includes(type) || !Array.isArray(answers) || answers.length !== 10)
    return res.status(400).json({ message: 'Nama, kelas, jenis tes, atau jumlah jawaban tidak valid' });
  for (const a of answers) {
    if (a !== null && (!Number.isInteger(a) || a < 0 || a > 3))
      return res.status(400).json({ message: 'Pilihan jawaban tidak valid' });
  }
  const correct = KEY.reduce((n, k, i) => n + (answers[i] === k ? 1 : 0), 0);
  const score = correct * 10;
  try {
    const sql = getSql();
    await sql`INSERT INTO test_results (student_name, class_name, test_type, answers_json, correct_count, score)
              VALUES (${name}, ${cls}, ${type}, ${JSON.stringify(answers)}::jsonb, ${correct}, ${score})`;
    return res.status(200).json({ success: true, test_type: type, correct, score });
  } catch (e) {
    console.error('submit error', e.message);
    return res.status(500).json({ message: 'Hasil tidak dapat disimpan ke database. Periksa DATABASE_URL dan schema.sql.' });
  }
};
