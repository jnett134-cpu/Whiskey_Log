-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query)

create table bottles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text not null,
  notes text,
  rating smallint check (rating between 1 and 5),
  tasted_on date,
  location text,
  created_at timestamptz not null default now()
);

-- If the table already exists, run this instead to add the newer columns:
-- alter table bottles add column if not exists tasted_on date;
-- alter table bottles add column if not exists location text;

-- Storage bucket: create this manually in the dashboard instead of SQL.
-- Go to Storage -> New bucket
--   name: bottle-images
--   Public bucket: ON
-- (Public is fine here since this is your own personal, non-sensitive photo log.
-- If you ever want it private, switch this off and generate signed URLs instead.)
