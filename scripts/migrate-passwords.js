/**
 * ONE-TIME password migration: hashes all plaintext passwords in tbl_user with bcrypt.
 *
 * BEFORE RUNNING:
 *   1. Deploy the bcrypt login code (this block) to a maintenance window.
 *   2. Run: RUN_PASSWORD_MIGRATION=yes node scripts/migrate-passwords.js
 *   3. Verify logins work.
 *
 * WARNING: Running this script a second time will double-hash passwords and
 * lock out all users. Do NOT run it again once complete.
 */

if (process.env.RUN_PASSWORD_MIGRATION !== 'yes') {
  console.error('ERROR: Set RUN_PASSWORD_MIGRATION=yes to run this script.');
  console.error('WARNING: Run this only once. Running twice will double-hash passwords.');
  process.exit(1);
}

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

try {
  const [users] = await conn.query('SELECT idx, usu, paz FROM tbl_user');
  console.log(`Migrating ${users.length} users...`);

  for (const user of users) {
    const hashed = await bcrypt.hash(user.paz, 12);
    await conn.execute('UPDATE tbl_user SET paz = ? WHERE idx = ?', [hashed, user.idx]);
    console.log(`✓ Migrated user: ${user.usu}`);
  }

  console.log('Migration complete. This script must never be run again.');
} finally {
  await conn.end();
}
