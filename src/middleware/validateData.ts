import { Request, Response, NextFunction } from "express";
import { z, ZodError } from 'zod';


export const validateData = (schema: z.ZodObject<any, any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    error: error.issues.map((error) => {
                        return error.message
                    }).join("; ")
                })
            }
            next(error);
        }
    }
}