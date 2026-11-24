// Koneksi database dibuat saat dibutuhkan agar validasi input tetap jalan tanpa DB.
let _sql;
function getSql() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum diatur');
  if (!_sql) {
    const { neon } = require('@neondatabase/serverless');
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}
function clientIp(req) {
  const xf = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return (xf || (req.socket && req.socket.remoteAddress) || '').slice(0, 45);
}
module.exports = { getSql, clientIp };
