import { ObjectId } from "mongodb";
import { collections } from "../db";
import { ProjectModel, ProjectV1Model } from "../models";

export const all = async (): Promise<ProjectModel[]> => {
    let cursor = collections.projects?.find({});
    let result = await cursor?.toArray();

    if (result === undefined || result.length == 0) {
        return [];
    }
    let rows = result as ProjectModel[];
    return rows;
}

export const getProjectV1 = async(projectId: ObjectId): Promise<ProjectV1Model|undefined|string> => {
    try {
        const document = await collections.projects_v1?.findOne({_id: projectId});
        if (document) {
            return document;
        } else {
            return undefined;
        }
    } catch (e) {
        return JSON.stringify(e);
    }
}

export const getProjectV1ByNetwork = async(projectId: number, networkId: number) => {
    try {
        const document = await collections.projects_v1?.findOne({projectId, networkId});
        if (document) {
            return document;
        } else {
            return undefined;
        }
    } catch (e) {
        return JSON.stringify(e);
    }
}

export const getProjectV1ByCheck = async(check: string, networkId: number) => {
    try {
        const document = await collections.projects_v1?.findOne({"sangha.check": check, "networkId": networkId});
        if (document) {
            return document;
        } else {
            return undefined;
        }
    } catch (e) {
        return JSON.stringify(e);
    }
}

export const createProjectV1 = async(data: ProjectV1Model): Promise<ProjectV1Model|string> => {
    try {
        const document = await collections.projects_v1?.insertOne(data);
        if (document) {
            data._id = document.insertedId;
            return data;
        } else {
            return 'failed to insert project v1';
        }
    } catch (e) {
        return JSON.stringify(e);
    }
}

export const updateProjectV1 = async(data: ProjectV1Model): Promise<undefined|string> => {
    try {
        const document = await collections.projects_v1?.updateOne({_id: data._id}, data);
        if (document) {
            return undefined;
        } else {
            return 'failed to insert project v1';
        }
    } catch (e) {
        return JSON.stringify(e);
    }
}