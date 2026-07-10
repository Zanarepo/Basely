import { z } from 'zod'

export const projectMethodologySchema = z.enum(['Waterfall', 'Agile', 'Hybrid'])

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  clientName: z.string().max(100).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  methodology: projectMethodologySchema,
  currency: z.string().min(1, 'Currency is required').max(10),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  calendarConfig: z.object({
    working_days: z.array(z.number().min(0).max(6)),
    daily_hours: z.number().min(1).max(24)
  })
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate)
  }
  return true;
}, {
  message: 'End date must be on or after start date',
  path: ['endDate']
})
