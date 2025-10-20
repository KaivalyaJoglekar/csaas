-----------------------------------------------------------------------
-- PART 1: RLS and User Profile Setup (Existing Tables)
-----------------------------------------------------------------------

-- 1. Enable RLS on auth.users (Good practice)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Table: Stores custom user metadata and role
CREATE TABLE public.profiles (
    id uuid references auth.users ON DELETE CASCADE not null primary key,
    created_at timestamp with time zone default now() not null,
    email text unique,
    role text default 'sme' not null check (role in ('sme', 'auditor', 'admin'))
);

-- 3. Automatic Profile Creation Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- 4. Trigger for Profile Creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. RLS Policies for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow self read" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 6. Vendors Table
CREATE TABLE public.vendors (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default now() not null,
    name text not null,
    contact_email text,
    owner_id uuid references public.profiles(id)
);
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SME can manage their own vendors" ON public.vendors FOR ALL
USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Auditors and Admins can read all vendors" ON public.vendors FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('auditor', 'admin')));

-- 7. Vendor Assessments Table (The Workflow table)
CREATE TYPE assessment_status AS ENUM ('Draft', 'Pending Review', 'Approved', 'Rejected');

CREATE TABLE public.vendor_assessments (
    id uuid primary key default gen_random_uuid(),
    vendor_id uuid references public.vendors(id) not null,
    submitted_by_id uuid references public.profiles(id) not null,
    reviewed_by_id uuid references public.profiles(id),
    status assessment_status default 'Draft' not null,
    submission_date timestamp with time zone default now() not null,
    review_date timestamp with time zone,
    evidence_url text -- URL from Supabase Storage
);
ALTER TABLE public.vendor_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SME can manage their own assessments" ON public.vendor_assessments FOR ALL
USING (auth.uid() = submitted_by_id) WITH CHECK (auth.uid() = submitted_by_id AND status != 'Approved' AND status != 'Rejected');
CREATE POLICY "Auditor can review assessments" ON public.vendor_assessments FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'auditor') AND status = 'Pending Review');
CREATE POLICY "Allow read access to all reviewed assessments" ON public.vendor_assessments FOR SELECT
USING (status IN ('Approved', 'Rejected'));

-- 8. Scan Policies Table (Admin Only)
CREATE TABLE public.scan_policies (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    policy_json jsonb,
    created_by_id uuid references public.profiles(id)
);
ALTER TABLE public.scan_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access to policies" ON public.scan_policies FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 9. Scan Results Table
CREATE TABLE public.scan_results (
    id uuid primary key default gen_random_uuid(),
    target text not null,
    risk_score numeric,
    details_json jsonb,
    run_by_id uuid references public.profiles(id)
);
ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated to read scan results" ON public.scan_results FOR SELECT USING (auth.role() = 'authenticated');

-- 10. Audit Logs Table
CREATE TABLE public.audit_logs (
    id bigserial primary key,
    timestamp timestamp with time zone default now() not null,
    user_id uuid references public.profiles(id),
    action text not null,
    details jsonb
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read access to audit logs" ON public.audit_logs FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-----------------------------------------------------------------------
-- PART 2: New Tables for Module Expansion (Threats, Incidents, Training, Reports)
-----------------------------------------------------------------------

-- 11. Threats Table (from Correlate Events & Compute Risk Score)
CREATE TABLE public.threats (
    id uuid primary key default gen_random_uuid(),
    scan_result_id uuid references public.scan_results(id) not null,
    risk_score numeric not null,
    risk_level text not null, -- High, Medium, Low
    description text,
    created_at timestamp with time zone default now()
);
ALTER TABLE public.threats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read all threats" ON public.threats FOR SELECT USING (true);


-- 12. Incident Tickets Table (from Create Incident Ticket)
CREATE TYPE ticket_status AS ENUM ('Open', 'Acknowledged', 'Fixed', 'Closed');

CREATE TABLE public.incident_tickets (
    id uuid primary key default gen_random_uuid(),
    threat_id uuid references public.threats(id) not null,
    status ticket_status default 'Open' not null,
    assigned_user_id uuid references public.profiles(id),
    remediation_notes text,
    created_at timestamp with time zone default now()
);
ALTER TABLE public.incident_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SME/Admin ticket management" ON public.incident_tickets FOR ALL
USING (auth.uid() = assigned_user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- 13. Training Courses Table
CREATE TABLE public.training_courses (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    quiz_score_required numeric not null
);

-- 14. User Training Progress Table (from Record Completion)
CREATE TABLE public.user_training_progress (
    user_id uuid references public.profiles(id) not null,
    course_id uuid references public.training_courses(id) not null,
    completion_date timestamp with time zone,
    last_score numeric,
    primary key (user_id, course_id)
);
ALTER TABLE public.user_training_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow self-manage training progress" ON public.user_training_progress FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 15. Reports Table (from Report Generator)
CREATE TABLE public.reports (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) not null,
    report_type text not null, -- e.g., 'Risk Assessment', 'Vendor Compliance'
    file_storage_path text not null, -- Path to file in Supabase Storage
    generated_at timestamp with time zone default now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read reports" ON public.reports FOR SELECT
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('auditor', 'admin')));

-----------------------------------------------------------------------
-- FINISHED SCHEMA
-----------------------------------------------------------------------