create table public.regional_discounts (
  country_code text not null,
  currency text not null,
  discount_multiplier numeric(4, 2) not null default 1.00,
  exchange_rate_to_usd numeric(10, 4) not null default 1.0000,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint regional_discounts_pkey primary key (country_code)
) TABLESPACE pg_default;

-- Set up Row Level Security
alter table public.regional_discounts enable row level security;

-- Allow public read access to regional discounts
create policy "Allow public read access to regional_discounts"
  on public.regional_discounts
  for select
  to public
  using (true);

-- Insert initial data based on previous hardcoded matrix
insert into public.regional_discounts (country_code, currency, discount_multiplier, exchange_rate_to_usd) values
  ('US', 'USD', 1.00, 1.0000),
  ('GB', 'GBP', 1.00, 0.7800),
  ('EU', 'EUR', 1.00, 0.9200),
  ('NG', 'NGN', 0.40, 1600.0000),
  ('IN', 'USD', 0.30, 1.0000),
  ('ZA', 'ZAR', 0.50, 18.5000),
  ('KE', 'KES', 0.40, 130.0000),
  ('GH', 'GHS', 0.40, 15.0000)
on conflict (country_code) do update
set currency = EXCLUDED.currency,
    discount_multiplier = EXCLUDED.discount_multiplier,
    exchange_rate_to_usd = EXCLUDED.exchange_rate_to_usd;
