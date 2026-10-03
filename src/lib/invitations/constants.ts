export const INVITE_ROLES = ['PM', 'Team Member', 'Sponsor', 'Viewer'] as const

export type InviteRole = (typeof INVITE_ROLES)[number]
