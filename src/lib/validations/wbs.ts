import { z } from 'zod'

export const wbsElementStatusSchema = z.enum([
  'Not Started',
  'In Progress',
  'Complete',
  'On Hold',
])

export const wbsElementSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(1000).nullable().optional(),
  deliverables: z.string().max(2000).nullable().optional(),
  acceptanceCriteria: z.string().max(2000).nullable().optional(),
  status: wbsElementStatusSchema.default('Not Started'),
  isWorkPackage: z.boolean().default(false),
  ownerId: z.string().uuid().nullable().optional(),
})
