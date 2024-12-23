import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import { init as InitForumClient } from './models/forum';
import { connectToDatabase  } from "./db";
import { onProjects, onProject, onProjectByNetwork } from "./routes/projects";
import { onLinkedWallet, onLinkedWalletCreate, onLogin, onThirdwebValidate, onUser, onUserCreate, onValidToken } from "./routes/users";
import { onTasks, onTask, onAddNftAddonTask, onMockNftAddonTasks, onTasksV2, onNestedTasksV2, onSaveTaskV2s, onSaveNestedTaskV2s } from "./routes/tasks";
import { onIdea, onIdeaCreate, onIdeas, onIdeasByUrl, onIdeasByUserName } from "./routes/logos";
import { onUserScenarioCreate, onUserScenarios } from "./routes/aurora";
import bodyParser from 'body-parser';
import { startTracking } from './indexer'
import { onAddPlan, onAddWelcome, onPlans } from "./routes/maydone";
import { onActs, onNestedParts, onNestedScene, onNestedSceneSave, onPart, onParts, onScene, onSceneSave } from "./routes/act";
import { onDIOSTransfers } from "./routes/dios";

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
app.get("/logos/idea/:id", onIdea); // fetch by forum id

app.get("/aurora/user-scenarios", onUserScenarios); // Create a user scenario
app.post("/aurora/user-scenario", onUserScenarioCreate); // Create a user scenario

app.get("/maydone/plans", onPlans);
app.post("/maydone/plan/welcome", onAddWelcome);
app.post("/maydone/plan", onAddPlan);

app.get("/act/projects", onActs);
app.get("/act/scenes/:developmentId", onScene);
app.get("/act/scenes/:developmentId/:level/:parentObjId", onNestedScene);
app.post("/act/scenes/:developmentId", onSceneSave);
app.post("/act/scenes/:developmentId/:level/:parentObjId", onNestedSceneSave);
app.get('/act/parts/:developmentId', onParts);
app.get('/act/parts/:developmentId/:level/:parentObjId', onNestedParts);
app.post('/act/part', onPart);
app.get('/act/tasks/:developmentId', onTasksV2); // Return for level 1 of development id
app.get('/act/tasks/:developmentId/:level/:parentObjId', onNestedTasksV2);
app.post('/act/tasks/:developmentId', onSaveTaskV2s); // Return for level 1 of development id
app.post('/act/tasks/:developmentId/:level/:parentObjId', onSaveNestedTaskV2s);

app.post('/dios/transfers', onDIOSTransfers);

connectToDatabase()
.then(async () => {
    try {
        await InitForumClient();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }

    const indexerDisabled = process.env.INDEXER_DISABLED!;
    if (!indexerDisabled || indexerDisabled === 'false') {
        console.log(`[Indexer]: enabled, start tracking...`);
        try {
            await startTracking();
        } catch (e) {
            console.error(e);
            process.exit(2);
        }
    } else {
        console.log(`[Indexer]: disabled in the settings`);
    }
        
    app.listen(port, () => {
        console.log(`[Server]: ACT Server is running at http://localhost:${port}`);
    });
})
.catch((error: Error) => {
        console.error("Database connection failed", error);
        process.exit();
});