export const INVITE_ROLES = ['PM', 'Team Member', 'Viewer'] as const

export type InviteRole = (typeof INVITE_ROLES)[number]
