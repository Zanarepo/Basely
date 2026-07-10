import { z } from 'zod'

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be at most 100 characters'),
  teamSize: z
    .string()
    .optional()
    .transform((val) => (val === '' || val === undefined ? undefined : Number(val)))
    .pipe(
      z
        .number()
        .int('Team size must be a whole number')
        .positive('Team size must be greater than zero')
        .max(100000, 'Team size seems too large')
        .optional()
    ),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
