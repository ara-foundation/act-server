import * as mongoDB from "mongodb";
import dotenv from "dotenv";
import { LinkedWalletModel, ProjectModel, TaskModel, UserScenarioModel } from "./models";
dotenv.config();

export const collections: { 
    linked_wallets?: mongoDB.Collection<LinkedWalletModel>,
    projects?: mongoDB.Collection<ProjectModel>
    tasks?: mongoDB.Collection<TaskModel>
    user_scenarios?: mongoDB.Collection<UserScenarioModel>
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

    console.log(`[Server] Connected to ${db.databaseName} database.`);
 }