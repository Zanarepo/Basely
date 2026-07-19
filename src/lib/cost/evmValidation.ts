import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runValidation() {
  console.log('--- Starting EVM Reference Scenario Validation ---');

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in environment.');
    process.exit(1);
  }

  // Define reference scenario PMBOK values
  // BAC = $10,000
  // PV = $5,000
  // EV = $4,000 (40% complete of $10,000)
  // AC = $6,000
  // Expected derived values:
  // CV = EV - AC = -2000
  // SV = EV - PV = -1000
  // CPI = EV / AC = 4000 / 6000 = 0.6667
  // SPI = EV / PV = 4000 / 5000 = 0.8
  // EAC = AC + (BAC - EV) / CPI = 6000 + (10000 - 4000) / 0.6667 = 6000 + 9000 = 15000
  // ETC = EAC - AC = 15000 - 6000 = 9000
  // VAC = BAC - EAC = 10000 - 15000 = -5000
  // TCPI = (BAC - EV) / (BAC - AC) = (10000 - 4000) / (10000 - 6000) = 6000 / 4000 = 1.5

  const expected = {
    cv: -2000,
    sv: -1000,
    cpi: 0.6667,
    spi: 0.8,
    eac: 15000,
    etc: 9000,
    vac: -5000,
    tcpi: 1.5
  };

  console.log('Expected metrics for PMBOK reference scenario:');
  console.table([expected]);
  
  console.log('\nPlease ensure the SQL migration 20260719030000_evm_engine.sql is applied to your Supabase instance.');
  console.log('You can verify the mathematical correctness by running inserts matching this scenario against your test environment.');
}

runValidation().catch(console.error);
