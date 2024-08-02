/**
 * Tasks are created for the NFT Addon
 */

import { TransactionReceipt, JsonRpcProvider, LogDescription, Contract, Block } from "ethers";
import { collections } from "./db";
import { ProjectModel, TaskModel, UserModel } from "./models";
import { WithId } from "mongodb";
import NftAddonAbi from "../abi/nft_addon";
import { CheckProjectParams, Link, Task, User } from "./types";

export type TaskWithRawData = TaskModel & {
    project: ProjectModel[];
    maintainerInfo: UserModel[];
}

export type TaskWithData = TaskModel & {
    projectName: string
    projectImage?: string
    projectVideo?: string
    projectUrl?: string
    projectDescription?: string
    maintainerFirstName: string
    maintainerLastName: string
    maintainerUserName: string
}

export type NftMetadata = {
    id: string
    name: string
    image: string
}

export type Nfts = {
    nfts: NftMetadata[]
}

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

export const addNftImage = async (nftId: string, task: Task): Promise<Task> => {
    const frogWarsUrl = `${process.env.FROG_WARS_SERVER_URL!}/nft/${nftId}`;
    console.log(`Fetching nft metadata on ${frogWarsUrl}`);
    const json = await fetch(frogWarsUrl).then(res => res.json())

    const nfts = json as Nfts;
    console.log(nfts);

    if (nfts.nfts.length > 0) {
        const nftImage: Link = {
            link: nfts.nfts[0].image!,
            title: `Image of ${nfts.nfts[0].name}`
        }
        task.images = [nftImage]
    }

    console.log(task);

    return task;
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
        title: animateTitle(nftId),
        content: animateContent(walletAddress, nftId),
        categories: ["art-category"],
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

    try {
        let newTask = await addNftImage(nftId, task);
        console.log(`Image was added`);
        console.log(newTask)
        return newTask;
    } catch(e) {
        console.error(`Failed to get nft image`);
    }

    return task;
}

export const animateTitle = (nftId: string): string => {
    return `Create pixel art sprites for NFT ${nftId}`;
}

export const animateContent = (walletAddress: string, nftId: string): string => {
    return `A player
                      <a
                        class='text-blue-300 hover:text-blue-400'
                        href='https://lineascan.build/address/${walletAddress}'>
                        ${walletAddress}
                      </a>
                      has asked to convert his NFT (${nftId}) into a game character.
                      <br />
                      Your task is to create a pixel art sprite for:
                      <img
                        class='mx-auto'
                        width='40%'
                        loading='lazy'
                        alt=''
                        src='{image_placeholder_0}'
                      />
                      <br />
                      The resolution must be 880x1440 in PNG format. As a reference check the sprites that were made
                      before:
                      <a
                        href='https://github.com/kidagine/Darklings-FightingGame/tree/development/Assets/_Project/Sprites/PlayerSprites'
                        class='text-blue-300 hover:text-blue-400'>
                        Github game source
                      </a>
                      . Also, need to create the player's portrait in the pixel art format. Here is the reference:
                      <a
                        href='https://github.com/kidagine/Darklings-FightingGame/tree/development/Assets/_Project/Sprites/PlayerSprites/AbaddonSprites/PortraitSprites'
                        class='text-blue-300 hover:text-blue-400'>
                        Game source: portraits
                      </a>
    <div class="divider"></div>
    <p>To feel what kind of sprites you create, I advise you to play on your browser: <a href="https://game.frog-wars.com"  class='text-blue-300 hover:text-blue-400'>Frog Wars</a></p>
    <p>Or it's base on, as it doesn't require a any crypto and free: <a href="https://gamejolt.com/games/darklings/640842"  class='text-blue-300 hover:text-blue-400'>Darklings</a></p>`
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

export const all = async (): Promise<TaskModel[]> => {
    const agg: Array<object> = [
        {
            '$lookup': {
              'from': 'projects', 
              'localField': 'projectId', 
              'foreignField': '_id', 
              'as': 'project'
            }
          }, 
          /*{
            '$lookup': {
              'from': 'users', 
              'localField': 'maintainer', 
              'foreignField': '_id', 
              'as': 'maintainerInfo'
            }
          }*/
    ];

    let cursor = collections.tasks?.aggregate(agg);
    let result = await cursor?.toArray();

    if (result === undefined || result.length == 0) {
        return [];
    }
    let rawRows = result as TaskWithRawData[];
    let rows: TaskWithData[] = [];

    for (let i in rawRows) {
        let raw = rawRows[i];
        if (raw.project.length == 0 || raw.maintainerInfo.length == 0) {
            continue;
        }

        let newRaw = {...raw};
        newRaw.project = [];
        newRaw.maintainerInfo = [];

        let rowWithData: TaskWithData = {...newRaw as TaskModel,
            projectName: raw.project[0].name,
            projectImage: raw.project[0].image,
            projectVideo: raw.project[0].video,
            projectDescription: raw.project[0].description,
            projectUrl: "",
            maintainerUserName: raw.maintainerInfo[0].username,
            maintainerLastName: raw.maintainerInfo[0].lastname,
            maintainerFirstName: raw.maintainerInfo[0].firstname,
        }
        
        rows.push(JSON.parse(JSON.stringify(rowWithData)));
    }

    return rows;
}
