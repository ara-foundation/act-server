/**
 * This module handles the users
 */
import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { collections  } from "../db";
import { convertForumUserToAraUser, createSessionToken, createUser, getUser } from "../models/forum";

export type UserCreate = {
    username: string;
    password: string;
    email: string;
}

/**
 * GET /user/:id returns a user information
 * @param req 
 * @param res 
 * @returns 
 */
export const onUserOld = async (req: Request, res: Response) => {
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

/**
 * GET /users/:id
 * @param req 
 * @param res 
 * @returns 
 */
export const onUser = async(req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id === 0) {
        return res.status(400).json({message: `invalid user id`});
    }
    const user = await getUser(id);
    if (typeof(user) === 'string') {
        return res.status(400).json({message: user});
    }

    res.json(user.data)
}

/**
 * POST /users creates a user
 * @param req 
 * @param res 
 * @returns 
 */
export const onUserCreate = async(req: Request, res: Response) => {
    const data = req.body as UserCreate;
    if (!data) {
        return res.status(400).json({message: 'missing UserCreate body parameters'});
    }

    const user = await createUser(data.username, data.password, data.email);
    if (typeof(user) === 'string') {
        return res.status(400).json({message: user});
    }

    const araUser = convertForumUserToAraUser(user.data);

    const creationStatus = await createSessionToken(data.username, data.password);
    if (typeof(creationStatus) === 'string') {
        return res.status(400).json({message: `failed to create a session token, but user was registered: ${creationStatus}`})
    }

    araUser.token = creationStatus.token;

    res.json(araUser)
}

/**
 * POST /users/login creates a token that a person can use to interact
 * @param req 
 * @param res 
 */
export const onLogin = async(req: Request, res: Response) => {
    const data = req.body as UserCreate;
    if (!data) {
        return res.status(400).json({message: 'missing UserCreate body parameters'});
    }

    const creationStatus = await createSessionToken(data.username, data.password);
    if (typeof(creationStatus) === 'string') {
        return res.status(400).json({message: `failed to create a session token, but user was registered: ${creationStatus}`})
    }

    return res.json(creationStatus);
}