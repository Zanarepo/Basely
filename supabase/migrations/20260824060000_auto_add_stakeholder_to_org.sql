-- Migration: Ensure stakeholders are automatically added to the organization when they sign up
-- Version: 20260824060000_auto_add_stakeholder_to_org

create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
    v_project_record record;
begin
    insert into public.profiles (id, email, full_name, avatar_url)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', ''),
        coalesce(new.raw_user_meta_data->>'avatar_url', '')
    );
    
    -- Auto-link any existing stakeholders with the same email
    update public.stakeholders
    set linked_user_id = new.id
    where lower(email) = lower(new.email)
      and linked_user_id is null;

    -- For any stakeholder records that were just linked, add them to the organization if not already there
    for v_project_record in (
        select distinct p.organization_id, s.role_title
        from public.stakeholders s
        join public.projects p on p.id = s.project_id
        where s.linked_user_id = new.id
    ) loop
        if not exists (
            select 1 from public.organization_members 
            where organization_id = v_project_record.organization_id and user_id = new.id
        ) then
            -- Default to 'Sponsor' if the role is sponsor, otherwise 'Viewer'
            insert into public.organization_members (organization_id, user_id, role)
            values (
                v_project_record.organization_id, 
                new.id, 
                (case when v_project_record.role_title ilike '%sponsor%' then 'Sponsor' else 'Sponsor' end)::public.user_role
            );
        end if;
    end loop;

    return new;
end;
$$;
