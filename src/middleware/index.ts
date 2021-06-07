import { Request, Response, NextFunction } from "express";

export const asyncErrorHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => void) =>
    (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next))
            .then((result) => res.status(200).json(result))
            .catch(next);
    };
