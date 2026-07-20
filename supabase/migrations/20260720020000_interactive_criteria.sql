-- Add new jsonb column for interactive acceptance criteria
alter table public.wbs_elements 
add column if not exists acceptance_criteria_data jsonb default '[]'::jsonb;

-- Migrate existing text criteria into the new jsonb format
do $$
declare
  r record;
  criteria_lines text[];
  line text;
  items jsonb;
begin
  for r in 
    select id, acceptance_criteria 
    from public.wbs_elements 
    where acceptance_criteria is not null and acceptance_criteria != ''
  loop
    items := '[]'::jsonb;
    -- Split the old text by newline
    criteria_lines := string_to_array(r.acceptance_criteria, E'\n');
    
    foreach line in array criteria_lines loop
      line := trim(line);
      if length(line) > 0 then
        -- Remove bullet points if they exist
        line := regexp_replace(line, '^[-*•]\s+', '');
        items := items || jsonb_build_object(
          'id', gen_random_uuid(),
          'text', line,
          'completed', false
        );
      end if;
    end loop;
    
    if jsonb_array_length(items) > 0 then
      update public.wbs_elements 
      set acceptance_criteria_data = items 
      where id = r.id;
    end if;
  end loop;
end
$$;
