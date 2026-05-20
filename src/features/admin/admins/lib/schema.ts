import { z } from 'zod'

export const grantEventAdminSchema = z.object({
  userId: z.string().uuid(),
  eventId: z.string().uuid(),
})

