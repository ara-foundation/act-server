/**
 * This module handles the users
 */
import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { collections  } from "../db";

/**
 * GET /user/:id returns a user information
 * @param req 
 * @param res 
 * @returns 
 */
export const onUser = async (req: Request, res: Response) => {
    let objectId: ObjectId;
    try {
        objectId = new ObjectId(req.params.id);
    } catch (e) {
        res.status(400).json({message: JSON.stringify(e)});
        return;
    }

    try {
        const document = await collections.users?.findOne({"_id": objectId});
        if (document) {
            res.json(document);
        } else {
            res.status(404).json({message: "no project"})
        }
    } catch (e) {
        res.status(400).json({message: JSON.stringify(e)});
    }
}