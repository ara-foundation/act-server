import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";
import cors from "cors";
import { collections, connectToDatabase  } from "./db";
import { all as allProjects } from "./project";
import { txToTask as txToNftAddonTask, taskBySourceId, nftAddonSourceId, saveTask, animateTitle, animateContent, all as allTasks, TaskWithData, addNftImage } from "./nft_addon_task";
import { Task } from "./types";
import { TaskModel } from "./models";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get("/", (_req: Request, res: Response) => {
    res.json({status: "OK", title: "Ara ACT Server"});
});

if (process.env.NODE_ENV !== "production") {
    app.get("/mock-nft-addon/:netId/:txid", async (req: Request, res: Response) => {
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
    });
}

/**
 * Returns all projects
 */
app.get("/projects", async (_req:Request, res: Response) => {
    const projects = await allProjects();

    res.json(projects)
});

app.get("/tasks", async (_req: Request, res: Response) => {
    const list = await allTasks();

    res.json(list)
})

app.get("/task/:id", async (req: Request, res: Response) => {
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

            const user = await collections.users?.findOne({"_id": task.maintainer});
            if (!project) {
                res.status(404).json({message: "no user"})
                return;
            }
            task.maintainerUserName = user?.username ? user?.username : ""
            task.maintainerLastName = user?.lastname ? user?.lastname : ""
            task.maintainerFirstName = user?.firstname ? user?.firstname : ""

            res.json(task);
        } else {
            res.status(404).json({message: "no task"})
        }
    } catch (e) {
        res.status(400).json({message: JSON.stringify(e)});
    }
})

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

app.get("/stats", async (req: Request, res: Response) => {
    res.json({
        checkProjects: 12,      // number of projects
        tasks: 51,              // number of created tokens
        paidWork: 2300,         // number of distributed tokens
        averageEarning: 1500,   // per month
        averageSpending: 4,     // hours per day
    })
})

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