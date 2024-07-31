import * as mongoDB from "mongodb";
import dotenv from "dotenv";
import { UserModel, ProjectModel, TaskModel } from "./models";
dotenv.config();

export const collections: { 
    users?: mongoDB.Collection<UserModel>,
    projects?: mongoDB.Collection<ProjectModel>
    tasks?: mongoDB.Collection<TaskModel>
} = {}

export async function connectToDatabase () {
    dotenv.config();
 
    const client: mongoDB.MongoClient = new mongoDB.MongoClient(process.env.DB_CONN_STRING!);
            
    await client.connect();
        
    const db: mongoDB.Db = client.db(process.env.DB_NAME);
   
    const usersCollection: mongoDB.Collection<UserModel> = db.collection(process.env.DB_COLLECTION_NAME_USERS!);
    collections.users = usersCollection;

    const projectsCollection: mongoDB.Collection<ProjectModel> = db.collection(process.env.DB_COLLECTION_NAME_PROJECTS!);
    collections.projects = projectsCollection;

    const taskCollection: mongoDB.Collection<TaskModel> = db.collection(process.env.DB_COLLECTION_NAME_TASKS!);
    collections.tasks = taskCollection;

    collections.users.createIndex({walletAddress: 1});
    collections.users.createIndex({email: 1});
    collections.users.createIndex({firstname: 1}, {});
    collections.users.createIndex({lastname: 1});
    collections.users.createIndex({username: 1});
    collections.projects.createIndex({name: 1}, {unique: true});
    collections.tasks.createIndex({maintainer: 1});
    collections.tasks.createIndex({tags: 1});
    collections.tasks.createIndex({categories: 1});
    collections.tasks.createIndex({title: 1});
    collections.tasks.createIndex({projectId: 1, checkProjectId: 1});
    collections.tasks.createIndex({sourceId: 1}, {unique: true});

    console.log(`[Server] Connected to ${db.databaseName} database.`);
 }