import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import { init as InitForumClient } from './models/forum';
import { connectToDatabase  } from "./db";
import { onProjects, onProject, onProjectByNetwork } from "./routes/projects";
import { onLinkedWallet, onLinkedWalletCreate, onLogin, onThirdwebValidate, onUser, onUserCreate, onValidToken } from "./routes/users";
import { onTasks, onTask, onAddNftAddonTask, onMockNftAddonTasks } from "./routes/tasks";
import { onIdeaCreate, onIdeas, onIdeasByUrl, onIdeasByUserName } from "./routes/logos";
import { onUserScenarioCreate, onUserScenarios } from "./routes/aurora";
import bodyParser from 'body-parser';
import { startTracking } from './indexer'
import { onAddWelcome } from "./routes/maydone";

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(bodyParser.json());
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
app.get("/project/:id/:networkId", onProjectByNetwork);

app.get("/tasks", onTasks)
app.get("/task/:id", onTask);
// todo it must be from the indexer (envio)
app.get("/add-nft-addon-task/:netId/:txid", onAddNftAddonTask);

app.get("/users/wallet/:username", onLinkedWallet);
app.post("/users/wallet/:username", onLinkedWalletCreate);
app.get("/users/:id", onUser);
app.post("/users", onUserCreate);
app.post("/users/login", onLogin);
app.post("/users/valid-token", onValidToken);
app.post("/users/thirdweb-validate", onThirdwebValidate);

app.get("/logos/ideas", onIdeas);   // Return list of ideas
app.get("/logos/ideas/:userName", onIdeasByUserName);
app.post("/logos/ideas", onIdeasByUrl); // Return list of following ideas after GET /logos/ideas...
app.post("/logos/idea", onIdeaCreate); // Create a new idea

app.get("/aurora/user-scenarios", onUserScenarios); // Create a user scenario
app.post("/aurora/user-scenario", onUserScenarioCreate); // Create a user scenario

app.post("/maydone/plan/welcome", onAddWelcome);

connectToDatabase()
.then(async () => {
    try {
        await InitForumClient();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }

    try {
        await startTracking();
    } catch (e) {
        console.error(e);
        process.exit(2);
    }
        
    app.listen(port, () => {
        console.log(`[server]: ACT Server is running at http://localhost:${port}`);
    });
})
.catch((error: Error) => {
        console.error("Database connection failed", error);
        process.exit();
});