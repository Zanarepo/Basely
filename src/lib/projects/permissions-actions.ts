"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type UpdatePermissionsPayload = {
  can_edit_schedule: boolean;
  can_edit_cost: boolean;
  can_edit_risks: boolean;
  can_edit_documents: boolean;
  project_role_title: string;
};

export async function updateProjectMemberPermissions(
  projectId: string,
  userId: string,
  payload: UpdatePermissionsPayload,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  // 1. Check if caller has permission to assign (must be Admin, PM, or Creator/Owner)
  const { data: project } = await supabase
    .from("projects")
    .select("organization_id, created_by, is_archived")
    .eq("id", projectId)
    .single();

  if (!project) return { ok: false, error: "Project not found" };
  if (project.is_archived) return { ok: false, error: "Project is archived" };

  const { data: callerOrgMember } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", project.organization_id)
    .eq("user_id", user.id)
    .single();

  const { data: org } = await supabase
    .from("organizations")
    .select("owner_id")
    .eq("id", project.organization_id)
    .single();

  const isOrgOwner = org?.owner_id === user.id;
  const isCreator = project.created_by === user.id;
  const callerRole = callerOrgMember?.role;

  const canAssign =
    isOrgOwner || isCreator || callerRole === "Admin" || callerRole === "PM";
  if (!canAssign) {
    return {
      ok: false,
      error: "You do not have permission to modify roles on this project.",
    };
  }

  // 2. Perform upsert into project_members
  const { error } = await supabase.from("project_members").upsert(
    {
      project_id: projectId,
      user_id: userId,
      ...payload,
    },
    { onConflict: "project_id,user_id" },
  );

  if (error) {
    console.error("Failed to update project member permissions:", error);
    return { ok: false, error: "Failed to update permissions" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { ok: true };
}

export async function bulkUpdateProjectMemberPermissions(
  projectId: string,
  userIds: string[],
  payload: UpdatePermissionsPayload,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  // 1. Check if caller has permission to assign
  const { data: project } = await supabase
    .from("projects")
    .select("organization_id, created_by, is_archived")
    .eq("id", projectId)
    .single();

  if (!project) return { ok: false, error: "Project not found" };
  if (project.is_archived) return { ok: false, error: "Project is archived" };

  const { data: callerOrgMember } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", project.organization_id)
    .eq("user_id", user.id)
    .single();

  const { data: org } = await supabase
    .from("organizations")
    .select("owner_id")
    .eq("id", project.organization_id)
    .single();

  const isOrgOwner = org?.owner_id === user.id;
  const isCreator = project.created_by === user.id;
  const callerRole = callerOrgMember?.role;

  const canAssign =
    isOrgOwner || isCreator || callerRole === "Admin" || callerRole === "PM";
  if (!canAssign) {
    return {
      ok: false,
      error: "You do not have permission to modify roles on this project.",
    };
  }

  // 2. Perform bulk upsert into project_members
  const rows = userIds.map((uid) => ({
    project_id: projectId,
    user_id: uid,
    ...payload,
  }));

  const { error } = await supabase
    .from("project_members")
    .upsert(rows, { onConflict: "project_id,user_id" });

  if (error) {
    console.error("Failed to bulk update project member permissions:", error);
    return { ok: false, error: "Failed to update permissions" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { ok: true };
}
