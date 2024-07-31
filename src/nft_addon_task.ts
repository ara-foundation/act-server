/**
 * Tasks are created for the NFT Addon
 */

import { TransactionReceipt, JsonRpcProvider, LogDescription, Contract, Block } from "ethers";
import { collections } from "./db";
import { ProjectModel, TaskModel } from "./models";
import { WithId } from "mongodb";
import NftAddonAbi from "../abi/nft_addon";
import { CheckProjectParams, Task } from "./types";

// submit a tx id
// from tx id get the nft addon address.
// get from database what is the project that it belongs too

export const providerByNetworkId = (networkId: string): JsonRpcProvider|undefined => {
    if (process.env["RPC_URL_" + networkId] === undefined) {
        return undefined;
    }
    return new JsonRpcProvider(process.env["RPC_URL_"+networkId]);
}

const checkProjectIdByAddonAddress = (project: WithId<ProjectModel>, nftAddonAddress: string): CheckProjectParams|undefined => {
    for (let checkProject of project.checkProjectParams) {
        if (!checkProject.addon) {
            continue;
        }
        if (checkProject.addon.address == nftAddonAddress) {
            return checkProject!;
        }
    }
    return undefined;
}

export const nftAddonSourceId = (networkId: string, tx: string): string => {
    return `${networkId}_${tx}`;
}

export const taskBySourceId = async (sourceId: string): Promise<undefined|WithId<TaskModel>> => {
    let query = {
        "sourceId": sourceId,
    }

    try {
        const found = await collections.tasks?.findOne(query)
        // already exists
        if (found === null || found === undefined) {
            return undefined;
        } else {
            return found as WithId<TaskModel>;
        }
    } catch (error) {
        return undefined;
    }
}

export const txToTask = async (networkId: string, tx: string): Promise<string|Task> => {
    const provider = providerByNetworkId(networkId);

    if (provider === undefined) {
        return "No network URL was given"
    }
    let txReceipt: null | TransactionReceipt;

    try {
        txReceipt = await provider.getTransactionReceipt(tx);
    } catch (e) {
        console.error(`failed to get tx: ` + e);
        return "failed to get transaction";
    }

    if (txReceipt === null) {
        return "invalid tx";
    }

    const nftAddonAddress = txReceipt.to;
    
    let query = {
        "checkProjectParams": {
		    "$elemMatch": {
			    "addon.address": nftAddonAddress
		    },
        }
    }

    let foundDocument:  WithId<ProjectModel>;

    try {
        const found = await collections.projects?.findOne(query)
        // already exists
        if (found === null || found === undefined) {
            return "no project with a such collateral";
        }

        foundDocument = found as WithId<ProjectModel>;
    } catch (error) {
        return JSON.stringify(error);
    }

    let parsedLog: LogDescription | null = null;

    for (let log of txReceipt.logs) {
        if (log.address.toLowerCase() !== nftAddonAddress!.toLowerCase()) {
            continue;
        }

        const nftAddon = new Contract(nftAddonAddress!, NftAddonAbi, provider);

        parsedLog = nftAddon.interface.parseLog(log);
        if (parsedLog === null) {
            continue;
        }
        if (parsedLog.name !== "NewOrder") {
            parsedLog = null;
            continue;
        }
    }

    if (parsedLog === null) {
        return "invalid event";
    }

    // now getting a time
    let block: null | Block = await provider.getBlock(txReceipt.blockNumber);
    if (block === null) {
        return "Failed to get block time"
    }

    const walletAddress = parsedLog.args[0];
    const nftId = parsedLog.args[1];
    const checkProject = checkProjectIdByAddonAddress(foundDocument, nftAddonAddress!);

    const task: Task = {
        sourceId: nftAddonSourceId(networkId, tx),
        maintainer: foundDocument.leader,
        projectId: foundDocument._id,
        checkProjectId: checkProject!.id!,
        title: `Animate NFT ${nftId}`,
        content: `A user ${walletAddress} asked to animate his NFT.
        You can check base on https://github.com/kidagine/Darklings-FightingGame as our game is based on that.
        `,
        categories: ["Design", "Art"],
        tags: ["2d", "sprite", "game"],
        created: block.timestamp,        // Unix timestamp when this task was created
        estHours: 4,       // Estimated hours to complete this task
        prize: 50,          // Amount of check tokens to give
        prizeType: {
            abi: "",
            address: "",
            name: "USDC",
            symbol: "USDC",
        },
        status: "created",
    };
    return task;
}

export const saveTask = async (task: Task): Promise<undefined|string> => {
   // put the data
   try {
        const dbResult = await collections.tasks?.insertOne(task);

        if (dbResult) {
            return;
        }
    } catch (error) {
        return JSON.stringify(error);
    } 
}