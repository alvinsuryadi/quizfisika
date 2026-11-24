# Modul Fisika AI — Momentum & Impuls (Vercel + DeepSeek + Neon)

Struktur: `public/` (halaman), `api/tutor.js` & `api/submit.js` (serverless), `schema.sql` (database).

## Langkah deploy
1. **Database (Neon, gratis)**: daftar di neon.tech → buat project → buka *SQL Editor* → tempel isi `schema.sql` → Run.
   Salin *connection string* (`postgresql://...`).
2. **API key DeepSeek**: platform.deepseek.com → API keys → buat key → isi saldo (top-up kecil cukup).
3. **GitHub**: unggah folder ini ke repositori (private lebih baik). Jangan unggah file `.env`.
4. **Vercel**: vercel.com → Add New Project → pilih repositori → Framework: *Other* → Deploy.
5. **Environment Variables** (Project → Settings → Environment Variables):
   - `DEEPSEEK_API_KEY` = key DeepSeek
   - `DATABASE_URL` = connection string Neon
   Setelah mengisi, lakukan **Redeploy**.
6. Buka URL `*.vercel.app`, masuk dengan nama/kelas, coba tutor dan kuis.

Alternatif tanpa GitHub: `npm i -g vercel` → `vercel` → `vercel env add` → `vercel --prod`.

## Melihat hasil
Neon → SQL Editor:
- `SELECT student_name, class_name, test_type, score, created_at FROM test_results ORDER BY created_at DESC;`
- `SELECT * FROM tutor_chat_logs ORDER BY created_at DESC LIMIT 100;`

## Catatan
- Model default `deepseek-chat`; ganti lewat env `AI_MODEL` bila perlu.
- Rate limit: 20 pesan/10 menit per IP dan 60 pesan/jam per nama+kelas (satu IP sekolah yang sama bisa terkena; naikkan angka di `api/tutor.js` bila satu kelas memakai Wi-Fi yang sama).
- Fungsi serverless Vercel gratis (Hobby) punya batas waktu eksekusi; jawaban 150 kata biasanya aman.
- Kunci jawaban hanya di `api/submit.js` (server).
- Privasi: gunakan kode peserta, minta persetujuan, tetapkan masa retensi data. Soal belum divalidasi ahli; konteks budaya perlu divalidasi ahli budaya.
