import { z } from 'zod';

export const CreateSessionSchema = z.object({
    body: z.object({
        taskId: z.string(),
        status: z.string(),
        plannedDurationInSec : z.number()
    })
})