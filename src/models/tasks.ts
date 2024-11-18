/**
 * This module handles the all ara tasks. Tasks are created by the maintainers of the projects.
 */
import { ObjectId, WithId } from "mongodb";
import { collections  } from "../db";
import { TaskV1Model, TaskV2Model } from "../models";
import { TaskV2 } from "../types";

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

/**
 * Count amount of tasks. In case of error returns an error string. Otherwise a number.
 * @param developmentId 
 * @param level 
 * @param parentObjId 
 * @returns 
 */
export const countTasksV2 = async(developmentId: string, level?: number, parentObjId?: string): Promise<number|string> => {
    const query: any = {developmentId, level};
    if (parentObjId) {
        query['parentObjId'] = parentObjId;
    }

    try {
        const dbResult = await collections.tasks_v2?.estimatedDocumentCount(query);
        if (dbResult !== undefined) {
            return dbResult!
        } else {
            return 0;
        }
    } catch (e) {
        return JSON.stringify(e);
    }
}


export const getTasksV2 = async(developmentId: string, level?: number, parentObjId?: string): Promise<TaskV2Model[]> => {
        const query: any = {developmentId, level};
        if (parentObjId && level != undefined && level >= 1) {
            query['parentObjId'] = parentObjId;
            query['level'] = level;
        }
    
        try {
            const dbResult = await collections.tasks_v2?.find(query).toArray();
            if (dbResult !== undefined) {
                return dbResult as TaskV2Model[]
            }
        } catch (e) {
            console.error(`Error: ${e}`);
        }
        return [];   
}

export const saveTaskV2s = async(data: TaskV2[]): Promise<string|undefined> => {
    try {
        const document = await collections.tasks_v2?.insertMany(data);
        if (!document) {
            return `failed to insert ${JSON.stringify(data)}`;
        } else {
            return undefined;
        }
    } catch(e) {
        return JSON.stringify(e);
    }
}
