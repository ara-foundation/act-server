import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { ObjectId, WithId } from "mongodb";
import { randomUUID } from "crypto";
import cors from "cors";
import { collections, connectToDatabase  } from "./db";
import { all as allProjects } from "./project";
import { txToTask as txToNftAddonTask, taskBySourceId, nftAddonSourceId, saveTask } from "./nft_addon_task";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get("/", (_req: Request, res: Response) => {
    res.json({status: "OK", title: "Ara ACT Server"});
});

/**
 * Returns all projects
 */
app.get("/projects", async (req:Request, res: Response) => {
    let projects = await allProjects();

    res.json(projects)
});

app.get("/project/:id", async (req: Request, res: Response) => {
    let objectId: ObjectId;
    try {
        objectId = new ObjectId(req.params.id);
    } catch (e) {
        res.status(400).json({message: JSON.stringify(e)});
        return;
    }

    try {
        const document = await collections.projects?.findOne({"_id": objectId});
        if (document) {
            res.json(document);
        } else {
            res.status(404).json({message: "no project"})
        }
    } catch (e) {
        res.status(400).json({message: JSON.stringify(e)});
    }
})

app.get("/user/:id", async (req: Request, res: Response) => {
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
})

// for show only
app.get("/add-nft-addon-task/:netId/:txid", async (req:Request, res: Response) => {
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
});

connectToDatabase()
    .then(async () => {
        app.listen(port, () => {
            console.log(`[server]: ACT Server is running at http://localhost:${port}`);
        });
    })
    .catch((error: Error) => {
        console.error("Database connection failed", error);
        process.exit();
    });