/**
 * This module handles the users
 */
import { collections  } from "../db";
import { LinkedWalletModel } from "../models";
import { CreateSessionToken } from "@ara-foundation/flarum-js-client";

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
 * returns a user's wallet that he linked
 * @param req 
 * @param res 
 * @returns 
 */
export const getLinkWallet = async (username: string): Promise<LinkedWalletModel|string> => {
    try {
        const document = await collections.linked_wallets?.findOne({"username": username});
        if (document) {
            return document;
        } else {
            return {walletAddress: "", username: username, userId: 0, nonce: 0} as LinkedWalletModel;
        }
    } catch (e) {
        return JSON.stringify(e);
    }
}

/**
 * Returns linked wallet address, user id and username by wallet address
 * @param walletAddress 
 * @returns 
 */
export const getLinkWalletByWalletAddress = async (walletAddress: string): Promise<LinkedWalletModel|string> => {
    try {
        const document = await collections.linked_wallets?.findOne({walletAddress});
        if (document) {
            return document;
        } else {
            return {walletAddress: "", username: "", userId: 0, nonce: 0};
        }
    } catch (e) {
        return JSON.stringify(e);
    }
}

/**
 * Creates a user's wallet link to his username and user id. 
 * If wallet already linked, then returns an error
 * @param req 
 * @param res 
 * @returns 
 */
export const createLinkedWallet = async (doc: LinkedWalletModel): Promise<undefined|string> => {
    try {
        const document = await collections.linked_wallets?.findOne({"username": doc.username});
        if (document && document.walletAddress) {
            return 'Wallet address already linked. Contact to support.';
        }
    } catch (e) {
        return JSON.stringify(e);
    }

    try {
        const document = await collections.linked_wallets?.insertOne(doc);
        if (document) {
            return undefined
        } else {
            return `Failed to create a linked wallet: ${JSON.stringify(doc)}`
        }
    } catch (e) {
        return JSON.stringify(e);
    }
}
