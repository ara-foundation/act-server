import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import { init as InitForumClient } from './models/forum';
import { connectToDatabase  } from "./db";
import { onProjects, onProject } from "./handlers/projects";
import { onUser } from "./handlers/users";
import { onTasks, onTask, onAddNftAddonTask, onMockNftAddonTasks } from "./handlers/tasks";
import { onIdeas, onIdeasByUrl, onIdeasByUserName } from "./handlers/logos";


const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get("/", (_req: Request, res: Response) => {
    res.json({status: "OK", title: "Ara ACT Server"});
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

if (process.env.NODE_ENV !== "production") {
    app.get("/mock-nft-addon/:netId/:txid", onMockNftAddonTasks);
}

/**
 * Returns all projects
 */
app.get("/projects", onProjects);
app.get("/project/:id", onProject);

app.get("/tasks", onTasks)
app.get("/task/:id", onTask);
// todo it must be from the indexer (envio)
app.get("/add-nft-addon-task/:netId/:txid", onAddNftAddonTask);

app.get("/user/:id", onUser);
// create   -> returns a session token
// login    -> returns a session token

app.get("/logos/ideas", onIdeas);   // Return list of ideas
app.get("/logos/ideas/:userName", onIdeasByUserName);
app.post("/logos/ideas", onIdeasByUrl); // Return list of following ideas after GET /logos/ideas...

connectToDatabase()
.then(async () => {
    try {
        await InitForumClient();
    } catch (e) {
        process.exit(JSON.stringify(e));
    }
        
    app.listen(port, () => {
        console.log(`[server]: ACT Server is running at http://localhost:${port}`);
    });
})
.catch((error: Error) => {
        console.error("Database connection failed", error);
        process.exit();
});