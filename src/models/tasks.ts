/**
 * This module handles the all ara tasks. Tasks are created by the maintainers of the projects.
 */
import { ObjectId, WithId } from "mongodb";
import { collections  } from "../db";
import { TaskV1Model } from "../models";

/**
 * Returns a task for a project
 * @param projectId 
 * @param taskId 
 * @returns 
 */
export const getTaskV1 = async(projectId: ObjectId, taskId: number): Promise<WithId<TaskV1Model>|string|undefined> => {
    try {
        const document = await collections.tasks_v1?.findOne({projectId, taskId});
        if (!document) {
            return undefined;
        } else {
            return document;
        }
    } catch(e) {
        return JSON.stringify(e);
    }
}


export const createTaskV1 = async(data: TaskV1Model): Promise<string|TaskV1Model> => {
    try {
        const document = await collections.tasks_v1?.insertOne(data);
        if (!document) {
            return `failed to insert ${JSON.stringify(data)}`;
        } else {
            data._id = document.insertedId;
            return data;
        }
    } catch(e) {
        return JSON.stringify(e);
    }
}

export const updateTaskV1 = async(data: TaskV1Model): Promise<string|boolean> => {
    try {
        const document = await collections.tasks_v1?.updateOne({_id: data._id}, data);
        if (!document) {
            return false;
        } else {
            return true;
        }
    } catch(e) {
        return JSON.stringify(e);
    }
}