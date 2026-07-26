-- Migration: Business Case and Feasibility Study
-- Version: 20260801000000_business_case_feasibility

-- 1. Create Business Cases table
CREATE TABLE IF NOT EXISTS public.business_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL, -- Nullable, can be linked later
    name TEXT NOT NULL,
    problem_statement TEXT,
    proposed_solution TEXT,
    estimated_cost NUMERIC(15, 2),
    estimated_benefit TEXT,
    recommendation TEXT,
    linked_cost_estimate_id UUID, -- For future-proofing if cost core estimates are linked
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Feasibility Studies table
CREATE TABLE IF NOT EXISTS public.feasibility_studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL, -- Nullable
    business_case_id UUID REFERENCES public.business_cases(id) ON DELETE SET NULL, -- Nullable
    name TEXT NOT NULL,
    technical_assessment TEXT,
    financial_assessment TEXT,
    operational_assessment TEXT,
    overall_recommendation TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.business_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feasibility_studies ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Business Cases
CREATE POLICY "Allow members to read organization business cases"
    ON public.business_cases FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

CREATE POLICY "Allow members to insert business cases"
    ON public.business_cases FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

CREATE POLICY "Allow creator or Admins to update business cases"
    ON public.business_cases FOR UPDATE
    USING (
        created_by = auth.uid() OR 
        public.get_user_role_in_org(organization_id, auth.uid()) IN ('Admin'::public.user_role, 'PM'::public.user_role)
    );

CREATE POLICY "Allow creator or Admins to delete business cases"
    ON public.business_cases FOR DELETE
    USING (
        created_by = auth.uid() OR 
        public.get_user_role_in_org(organization_id, auth.uid()) IN ('Admin'::public.user_role, 'PM'::public.user_role)
    );

-- 5. RLS Policies for Feasibility Studies
CREATE POLICY "Allow members to read organization feasibility studies"
    ON public.feasibility_studies FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

CREATE POLICY "Allow members to insert feasibility studies"
    ON public.feasibility_studies FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

CREATE POLICY "Allow creator or Admins to update feasibility studies"
    ON public.feasibility_studies FOR UPDATE
    USING (
        created_by = auth.uid() OR 
        public.get_user_role_in_org(organization_id, auth.uid()) IN ('Admin'::public.user_role, 'PM'::public.user_role)
    );

CREATE POLICY "Allow creator or Admins to delete feasibility studies"
    ON public.feasibility_studies FOR DELETE
    USING (
        created_by = auth.uid() OR 
        public.get_user_role_in_org(organization_id, auth.uid()) IN ('Admin'::public.user_role, 'PM'::public.user_role)
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Note: set_updated_at() already exists from previous migrations, so we just attach the triggers
CREATE TRIGGER tr_business_cases_updated_at
BEFORE UPDATE ON public.business_cases
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER tr_feasibility_studies_updated_at
BEFORE UPDATE ON public.feasibility_studies
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();
