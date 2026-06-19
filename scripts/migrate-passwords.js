/**
 * ONE-TIME password migration: hashes all plaintext passwords in tbl_user with bcrypt.
 *
 * BEFORE RUNNING:
 *   1. Deploy the bcrypt login code (this block) to a maintenance window.
 *   2. Run: RUN_PASSWORD_MIGRATION=yes node scripts/migrate-passwords.js
 *   3. Verify logins work.
 *
 * SCHEMA REQUIREMENT: tbl_user.paz must be at least VARCHAR(60).
 *   The script widens it automatically if needed.
 *   On production, run during a maintenance window with DB backup.
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
  const [[col]] = await conn.query(
    "SELECT CHARACTER_MAXIMUM_LENGTH as len FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tbl_user' AND COLUMN_NAME='paz'"
  );
  if (col.len < 60) {
    // ALTER requires a privileged user (e.g. root). The app user (erp_staging) lacks ALTER.
    // On production, run the ALTER manually before this script:
    //   ALTER TABLE tbl_user MODIFY paz VARCHAR(60) NOT NULL;
    console.error(`ERROR: tbl_user.paz is VARCHAR(${col.len}) — too short for a bcrypt hash (60 chars).`);
    console.error('Run this SQL with a privileged user first:');
    console.error('  ALTER TABLE tbl_user MODIFY paz VARCHAR(60) NOT NULL;');
    process.exit(1);
  }

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
