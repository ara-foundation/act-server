/**
 * This module handles the users
 */
import { Request, Response } from "express";
import { collections  } from "../db";
import { createSessionToken, createUser, getUser, userIdByToken, validToken } from "../models/forum";
import { LinkedWalletModel } from "../models";
import { CreateSessionToken } from "@ara-foundation/flarum-js-client";
import { createLinkedWallet, getLinkWallet } from "../models/users";

export type UserCreate = {
    username: string;
    password: string;
    email: string;
}

export type ValidToken = CreateSessionToken;

export type LinkWallet = ValidToken & {
    walletAddress: string;
    userId: number;
}

/**
 * GET /user/wallet/:username returns a user's wallet that he linked
 * @param req 
 * @param res 
 * @returns 
 */
export const onLinkedWallet = async (req: Request, res: Response) => {
    const username = req.params.username;
    if (!username) {
        return res.status(400).json({message: "invalid parameter"});
    }

    const document = await getLinkWallet(username);
    if (typeof document === 'string') {
        return res.status(500).json({message: document});
    }

    return res.json(document);
}

/**
 * POST /users/wallet/:username links user's wallet. If wallet already linked, then throws an error.
 * @param req 
 * @param res 
 * @returns 
 */
export const onLinkedWalletCreate = async (req: Request, res: Response) => {
    const username = req.params.username;
    if (!username) {
        return res.status(400).json({message: "invalid parameter"});
    }

    const data = req.body as LinkWallet;
    if (!data) {
        return res.status(400).json({message: 'missing LinkWallet body parameters'});
    }

    // validate
    const valid = await validToken(data.token);
    if (!valid) {
        return res.status(401).json({message: 'Login first'});
    }

    const doc: LinkedWalletModel = {
        username: username,
        walletAddress: data.walletAddress,
        userId: data.userId,
        nonce: 0,
    }

    const result = await createLinkedWallet(doc);
    if (typeof result === 'string') {
        return res.status(401).json({message: result});
    }

    return res.json(doc);
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

    const creationStatus = await createSessionToken(data.username, data.password);
    if (typeof(creationStatus) === 'string') {
        return res.status(400).json({message: `failed to create a session token, but user was registered: ${creationStatus}`})
    }

    res.json(creationStatus)
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

/**
 * POST /users/valid-token
 * @param req 
 * @param res 
 * @returns 
 */
export const onValidToken = async(req: Request, res: Response) => {
    const data = req.body as ValidToken;
    if (!data || !data.token) {
        return res.status(400).json({message: 'missing ValidToken body parameters'});
    }

    const valid = await validToken(data.token);
    res.json({valid: valid})
}

/**
 * POST /users/thirdweb-validate returns a validated thirdweb tokens
 * @param req 
 * @param res 
 */
export const onThirdwebValidate = async(req: Request, res: Response) => {
    console.log("Thirdweb validate:");
    console.log(req.body);
    const { payload: token } = req.body;
    if (!token) {
        return res.status(401).json({message: "Invalid payload"})
    }
   
    // You would write your own logic here to verify the payload here
    const userId = await userIdByToken(token);
    if (userId === undefined) {
        return res.status(500).json({message: "Invalid token"});
    }
    const user = await getUser(userId);
    if (typeof(user) === "string") {
        return res.status(500).json({message: user});
    }

    // Once the user is successfully verified, you can return the following field
    return res.send({
      userId: user.data.attributes.username,
    });
}