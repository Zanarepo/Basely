const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
});

async function run() {
  await client.connect();
  try {
    await client.query(`
      ALTER TABLE public.organizations 
      ADD COLUMN IF NOT EXISTS ai_features_enabled boolean not null default false;
    `);
    console.log('Successfully added ai_features_enabled column.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
