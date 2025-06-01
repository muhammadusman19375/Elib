import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";

const createUser = async(req: Request, res: Response, next: NextFunction) => {
    const {name, email, password} = req.body;
    if(!name || !email || !password) {
        const error = createHttpError(400, "All fields are required");
        return next(error);
    }
    // validation
    // logic process
    // response
    res.json({message: "User created"})
};

export {createUser};