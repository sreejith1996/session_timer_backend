import { z } from 'zod';

export const CreateTaskSchema = z.object({
    body: z.object({
        taskName: z.string(),
        taskDescription: z.string().optional()
    })
})