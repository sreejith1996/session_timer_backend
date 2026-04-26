import { Request, Response, NextFunction } from "express";

function logger(req: Request, res: Response, next: NextFunction) {
    const method: string = req.method;
    const url: string = req.url;
    const timestamp: string = new Date().toISOString();
    console.log(`[${timestamp} ${method} ${url}]`);
    next();
}

export default logger;