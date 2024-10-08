import * as mongoDB from "mongodb";
import dotenv from "dotenv";
import { ActModel, CollateralModel, LinkedWalletModel, PlanModel, ProjectModel, ProjectV1Model, TaskModel, TaskV1Model, UserScenarioModel } from "./models";
import { LastIndexTimestampModel } from "./models";
dotenv.config();

export const collections: { 
    linked_wallets?: mongoDB.Collection<LinkedWalletModel>,
    projects?: mongoDB.Collection<ProjectModel>,
    tasks?: mongoDB.Collection<TaskModel>,
    user_scenarios?: mongoDB.Collection<UserScenarioModel>,
    plans?: mongoDB.Collection<PlanModel>,
    indexes?: mongoDB.Collection<LastIndexTimestampModel>,
    collaterals?: mongoDB.Collection<CollateralModel>
    projects_v1?: mongoDB.Collection<ProjectV1Model>
    developments?: mongoDB.Collection<ActModel>
    tasks_v1?: mongoDB.Collection<TaskV1Model>
} = {}

export async function connectToDatabase () {
    dotenv.config();
 
    const client: mongoDB.MongoClient = new mongoDB.MongoClient(process.env.DB_CONN_STRING!);
            
    await client.connect();
        
    const db: mongoDB.Db = client.db(process.env.DB_NAME);
   
    const usersCollection: mongoDB.Collection<LinkedWalletModel> = db.collection(process.env.DB_COLLECTION_NAME_USERS!);
    collections.linked_wallets = usersCollection;

    const projectsCollection: mongoDB.Collection<ProjectModel> = db.collection(process.env.DB_COLLECTION_NAME_PROJECTS!);
    collections.projects = projectsCollection;

    const taskCollection: mongoDB.Collection<TaskModel> = db.collection(process.env.DB_COLLECTION_NAME_TASKS!);
    collections.tasks = taskCollection;

    const userScenarioCollection: mongoDB.Collection<UserScenarioModel> = db.collection(process.env.DB_COLLECTION_NAME_USER_SCENARIOS!);
    collections.user_scenarios = userScenarioCollection;

    const planCollection: mongoDB.Collection<PlanModel> = db.collection(process.env.DB_COLLECTION_NAME_PLANS!);
    collections.plans = planCollection;

    const indexCollection: mongoDB.Collection<LastIndexTimestampModel> = db.collection(process.env.DB_COLLECTION_NAME_INDEXES!);
    collections.indexes = indexCollection

    const collateralCollection: mongoDB.Collection<CollateralModel> = db.collection(process.env.DB_COLLECTION_NAME_COLLATERALS!);
    collections.collaterals = collateralCollection

    const projectsV1Collection: mongoDB.Collection<ProjectV1Model> = db.collection(process.env.DB_COLLECTION_NAME_PROJECTS_V1!);
    collections.projects_v1 = projectsV1Collection

    const actCollection: mongoDB.Collection<ActModel> = db.collection(process.env.DB_COLLECTION_NAME_ACTS!);
    collections.developments = actCollection

    const tasksV1Collection: mongoDB.Collection<TaskV1Model> = db.collection(process.env.DB_COLLECTION_NAME_TASKS_V1!);
    collections.tasks_v1 = tasksV1Collection

    collections.linked_wallets.createIndex({walletAddress: 1});
    collections.linked_wallets.createIndex({username: 1}, {unique: true});

    collections.projects.createIndex({name: 1}, {unique: true});

    collections.tasks.createIndex({maintainer: 1});
    collections.tasks.createIndex({tags: 1});
    collections.tasks.createIndex({categories: 1});
    collections.tasks.createIndex({title: 1});
    collections.tasks.createIndex({projectId: 1, checkProjectId: 1});
    collections.tasks.createIndex({sourceId: 1}, {unique: true});

    collections.user_scenarios.createIndex({forum_discussion_id: 1}, {unique: true})
    collections.user_scenarios.createIndex({forum_username: 1}, {unique: false})

    collections.indexes.createIndex({ event_type: 1 }, { unique: true })

    collections.collaterals.createIndex({token: 1, networkId: 1}, {unique: true})

    collections.projects_v1.createIndex({projectId: 1, networkId: 1}, {unique: true})
    collections.projects_v1.createIndex({project_name: 1}, {unique: false});

    collections.tasks_v1.createIndex({projectId: 1, taskId: 1}, {unique: true})
    collections.tasks_v1.createIndex({completed: 1}, {unique: false})
    collections.tasks_v1.createIndex({canceled: 1}, {unique: false})

    console.log(`[Server] Connected to ${db.databaseName} database.`);
 }