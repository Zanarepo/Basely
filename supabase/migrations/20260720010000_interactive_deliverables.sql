-- Migration: Interactive Deliverables
-- Adds a structured JSONB column for checklist deliverables and migrates existing text data

alter table public.wbs_elements 
add column if not exists deliverables_data jsonb not null default '[]'::jsonb;

do $$
declare
  r record;
  items jsonb;
  line text;
  lines text[];
begin
  for r in select id, deliverables from public.wbs_elements where deliverables is not null and trim(deliverables) != '' loop
    items := '[]'::jsonb;
    -- Handle both \n and \r\n
    lines := string_to_array(replace(r.deliverables, E'\r', ''), E'\n');
    
    for i in 1 .. array_length(lines, 1) loop
      line := trim(lines[i]);
      if line != '' then
        items := items || jsonb_build_object(
          'id', gen_random_uuid(),
          'text', line,
          'completed', false
        );
      end if;
    end loop;
    
    if jsonb_array_length(items) > 0 then
      update public.wbs_elements 
      set deliverables_data = items 
      where id = r.id;
    end if;
  end loop;
end
$$;
