// testing the leaderboard with the fake data
import { collections } from '../db';
import { CollateralModel } from '../models'

export const createCollateral = async (collateral: CollateralModel): Promise<string | CollateralModel> => {
    try {
        const document = await collections.collaterals?.insertOne(collateral);
        if (document) {
            collateral._id = document.insertedId
            return collateral
        } else {
            throw `Failed to create a collateral`
        }
    } catch (e) {
        return JSON.stringify(e);
    }
}

export const createCollaterals = async (collaterals: CollateralModel[]): Promise<string | undefined> => {
    try {
        const document = await collections.collaterals?.insertMany(collaterals);
        if (document) {
            return;
        } else {
            throw `Failed to create a collateral`
        }
    } catch (e) {
        return JSON.stringify(e);
    }
}


export const getCollateral = async (token: string, networkId: number): Promise<undefined | CollateralModel | string> => {
    try {
        const document = await collections.collaterals?.findOne({token, networkId});
        if (document) {
            return document;
        } else {
            throw undefined;
        }
    } catch (e) {
        return JSON.stringify(e);
    }
}

export const updateCollateral = async (collateral: CollateralModel): Promise<boolean|string> => {
    try {
        const document = await collections.collaterals?.replaceOne({token: collateral.token, networkId: collateral.networkId}, collateral);
        if (document) {
            return true;
        } else {
            throw false;
        }
    } catch (e) {
        return JSON.stringify(e);
    }
}

