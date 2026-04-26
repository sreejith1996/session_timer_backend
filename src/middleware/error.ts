import { Request, Response, NextFunction } from "express";

function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {

    const errStatus = err.status || 500;

    res.status(errStatus).json({
        msg: err.message
    });
    next();
}

// Add an error

// if (!something) {
//     const error = new Error('Something was not found');
//     error.status = 404;
//     return next(error);
// }

export default errorHandler