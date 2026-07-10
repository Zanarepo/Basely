Implementation Plan: Sprint 1 Phase 1 - Database Schema & Supabase RLS Setup
This plan outlines the creation of the SQL migrations and schema architecture to establish the foundational, multi-tenant database layer for the Project Management Platform.

Proposed Changes
We will create a structured database folder under C:\Users\princ\3D Objects\ProjectManagement\supabase following Supabase's standard directory layout.

[NEW] Supabase Database Migrations
[NEW] 
20260709000000_init_schema.sql
A SQL migration script containing the schema definition, triggers, and RLS policies:

Enums & Types:
Create custom role enum: user_role (Admin, PM, Team Member, Viewer).
Create custom methodology enum: project_methodology (Waterfall, Agile, Hybrid).
Tables:
public.profiles: Syncs with auth.users via Supabase triggers. Holds user profile details.
public.organizations: Core tenant container.
public.organization_members: Junction table mapping users to organizations with assigned roles.
public.projects: Project container metadata.
Triggers:
Automatically create a profile in public.profiles when a user signs up in auth.users.
Row-Level Security (RLS) Policies:
Enable RLS on all tables.
Restrict access to profile/org/member/project data to only users who belong to the same organization.
Database Functions (RPC):
Write get_user_permissions to allow backend/middleware checking of roles/permissions for a user given a project or organization.
Directory Structure
We will organize files as follows:

text

C:\Users\princ\3D Objects\ProjectManagement\
└── supabase/
    └── migrations/
        └── 20260709000000_init_schema.sql  <-- Initial schema migration
Verification Plan
Automated Tests
We can syntax-check the PostgreSQL DDL statements.
In the next phase, when Supabase CLI is local or when deploying to Supabase, these migrations will be run and tested.
Manual Verification
Review SQL commands for constraints, proper foreign key cascade rules, and security loopholes in policies.