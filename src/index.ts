import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectToDatabase  } from "./db";
import { onProjects, onProject } from "./handlers/projects";
import { onUser } from "./handlers/users";
import { onTasks, onTask, onAddNftAddonTask, onMockNftAddonTasks } from "./handlers/tasks";

dotenv.config();

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


app.get("/user/:id", onUser);

// for show only
// todo it must be from the indexer (envio)
app.get("/add-nft-addon-task/:netId/:txid", onAddNftAddonTask);


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