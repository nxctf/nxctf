import { z } from 'zod'

export const nxctlActionSchema = z.enum(['up', 'down', 'restart', 'extend'])
export const nxctlGetActionSchema = z.enum(['inspect', 'status'])

export const nxctlPostBodySchema = z.object({
  action: nxctlActionSchema,
  name: z.string().min(1),
})

export const nxctlInspectQuerySchema = z.object({
  action: z.literal('inspect'),
  name: z.string().min(1),
})

