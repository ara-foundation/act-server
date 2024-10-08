/**
 * This module handles the all ara tasks. Tasks are created by the maintainers of the projects.
 */
import { Request, Response } from "express";
import { txToTask as txToNftAddonTask, taskBySourceId, nftAddonSourceId, saveTask, animateTitle, animateContent, all as allTasks, TaskWithData, addNftImage } from "../nft_addon_task";
import { ObjectId } from "mongodb";
import { collections  } from "../db";
import { TaskModel } from "../models";
import { Task } from "../types";

/**
 * GET /tasks returns all tasks
 * @param _req 
 * @param res 
 */
export const onTasks = async (_req: Request, res: Response) => {
    const list = await allTasks();

    res.json(list)
}

/**
 * /GET /task/:id returns a task parameters
 * @param req 
 * @param res 
 * @returns 
 */
export const onTask = async (req: Request, res: Response) => {
    let objectId: ObjectId;
    try {
        objectId = new ObjectId(req.params.id);
    } catch (e) {
        res.status(400).json({message: JSON.stringify(e)});
        return;
    }

    try {
        const document = await collections.tasks?.findOne({"_id": objectId});
        if (document) {
            const task: TaskWithData = {...document as TaskModel, 
                projectName: "",
                projectImage: "",
                projectVideo: "",
                projectUrl: "",
                projectDescription: "",
                maintainerUserName: "",
                maintainerLastName: "",
                maintainerFirstName: "",
            };

            const project = await collections.projects?.findOne({"_id": task.projectId});
            if (!project) {
                res.status(404).json({message: "no project"})
                return;
            }
            task.projectName = project.name
            task.projectImage = project.image
            task.projectVideo = project.video
            task.projectDescription = project.description

            const user = await collections.linked_wallets?.findOne({"_id": task.maintainer});
            if (!project) {
                res.status(404).json({message: "no user"})
                return;
            }
            task.maintainerUserName = user?.username ? user?.username : ""
            task.maintainerFirstName = "";
            task.maintainerLastName = "";

            res.json(task);
        } else {
            res.status(404).json({message: "no task"})
        }
    } catch (e) {
        res.status(400).json({message: JSON.stringify(e)});
    }
}

/**
 * GET /add-nft-addon-task/:netId/:txid mark that a new nft addon was added.
 * For now it hardcoded the ForgWars.
 * @param req 
 * @param res 
 * @returns 
 */
export const onAddNftAddonTask = async (req:Request, res: Response) => {
    const networkId = req.params.netId;
    const txid = req.params.txid;

    const sourceId = nftAddonSourceId(networkId, txid);

    const existingTask = await taskBySourceId(sourceId);
    if (existingTask) {
        res.json(existingTask)
        return;
    }

    let task = await txToNftAddonTask(networkId, txid);
    if (typeof(task) === "string") {
        res.status(400).json({message: task as string});
        return;
    }

    let saveResult = await saveTask(task);
    if (typeof(saveResult) === "string") {
        res.status(400).json({message: saveResult as string});
        return;
    }

    res.json(task);
}

/**
 * GET /mock-nft-addon/:netId/:txid adds random tasks for testing only.
 * Call it if process.env.NODE_END is not 'production'
 * @param req 
 * @param res 
 * @returns 
 */
export const onMockNftAddonTasks = async (req: Request, res: Response) => {
    const networkId = req.params.netId;
    const txid = req.params.txid;

    let task = await txToNftAddonTask(networkId, txid);
    if (typeof(task) === "string") {
        res.status(400).json({message: task as string});
        return;
    }

    let tasks: Task[] = [];

    for (let i = 2127; i < 50 + 2127; i++) {
        const nftId = `${i}`;
        const walletAddress = `0xaddr_${nftId}`;

        const sourceId = nftAddonSourceId(networkId, `0xtx_of_${nftId}`);
        const title = animateTitle(nftId);
        const content = animateContent(walletAddress, nftId);

        task.sourceId = sourceId;
        task.title = title;
        task.content = content;
        const dupl: Task = { ...task, sourceId, title, content };

        try {
            const withImage = await addNftImage(nftId, dupl);
            tasks.push(withImage);
        } catch (e) {
            console.error(e);
            tasks.push(dupl);
        }

    }
    await collections.tasks?.insertMany(tasks);

    res.json({status: "OK", message: "inserted nfts from 2127 to 2176"});
}