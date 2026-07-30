const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL || process.env.DB_URL;

async function applyMigration() {
  if (!dbUrl) {
    console.log('NO_DIRECT_DB_URL_FOUND: No Postgres connection string found in .env.local.');
    console.log('Please run the migration directly in your Supabase Dashboard SQL Editor.');
    process.exit(0);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database successfully.');

    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260925000000_sprint51_adr_skills_raid.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing Sprint 51 migration...');
    await client.query(sql);
    console.log('SUCCESS: Sprint 51 migration completed! Tables created successfully.');
  } catch (err) {
    console.error('ERROR running migration:', err.message);
  } finally {
    await client.end();
  }
}

applyMigration();
