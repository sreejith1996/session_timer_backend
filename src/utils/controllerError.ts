import { Response } from "express";

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function sendControllerError(res: Response, error: unknown, status = 500): void {
    console.log(error);
    res.status(status).json({ error: getErrorMessage(error) });
}

export { getErrorMessage, sendControllerError };
