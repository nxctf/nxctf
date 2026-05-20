import { z } from 'zod'

const keepAliveConfigSchema = z.object({
  table: z.string().min(1),
  column: z.string().min(1),
  allowInsertionAndDeletion: z.boolean(),
  disableRandomStringQuery: z.boolean(),
  sizeBeforeDeletions: z.number().int().positive(),
  consoleLogOnError: z.boolean(),
  otherEndpoints: z.array(z.string().url()),
})

const keepAliveConfigRaw = {
  table: 'keep-alive',
  column: 'name',
  allowInsertionAndDeletion: true,
  disableRandomStringQuery: false,
  sizeBeforeDeletions: 10,
  consoleLogOnError: true,
  otherEndpoints: [],
}

export const keepAliveConfig = keepAliveConfigSchema.parse(keepAliveConfigRaw)
export type KeepAliveConfig = z.infer<typeof keepAliveConfigSchema>

