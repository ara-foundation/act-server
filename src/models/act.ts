import { ObjectId } from "mongodb";
import { collections } from "../db";
import { ActModel, PartModel, ProjectV1Model } from "../models";
import { ActWithProjectAndPlan, Scene } from "../types";
import { createDiscussion } from "./forum";
import { Level } from "level";

const db = new Level('./act_scenes.json', { valueEncoding: 'json' })

export const actToMarkdown = (project: ProjectV1Model, act: ActModel): string => {
    let html = `
### To see progress, download Ara Client on [Official website](https://www.ara.foundation/)\n
\n
# Project "${project.project_name}" progress\n
\n
 * [Idea that it implements](https://forum.ara.foundation/d/${project.lungta?.logos_id})\n
 * [User Scenario that it implements](https://forum.ara.foundation/d/${project.lungta?.aurora_id})\n
 * [Invest](https://forum.ara.foundation/d/${project.lungta?.maydone_id})\n
 * [Be an owner](https://forum.ara.foundation/d/${project.lungta?.sangha_id})\n
\n
**Invest on the Maydone page**: [${project.project_name}](https://maydone.ara.foundation/projects/${project.project_name})\n
\n
### Project parameters \n
\n
- **Start time**: ${new Date(act.start_time * 1000)}\n
- **Duration**: ${act.duration / 86400} DAYS\n
- **Source code**: ${act.source_code_url}\n
- **Test**: ${act.test_url}\n
- **Tech Stack**:\n
${act.tech_stack}
`
    return html;
}


/**
 * Creates a new plan in the database without welcome page.
 * This function is called automatically by cron.
 * @param req 
 * @param res 
 * @returns 
 */
export const createAct = async (data: ActModel): Promise<ActModel|string> => {
    // put the data
    try {
        const dbResult = await collections.developments?.insertOne(data);

        if (!dbResult) {
            return `Failed to insert the plan in the database`;
        }

        data._id = dbResult.insertedId;
        return data;
    } catch (error) {
        return JSON.stringify(error);
    } 
}

export const createActPost = async(project: ProjectV1Model, data: ActModel): Promise<ActModel|string> => {
    let content = actToMarkdown(project, data);
    if (!content) {
        return 'failed to convert project progress into a forum post';
    }

    const title = `Development progress of '${project.project_name}'`;

    const post = await createDiscussion(process.env.ARA_DEV_API_KEY!, title, content, process.env.ARA_ACT_TAG_ID!);
    if (typeof(post) === 'string') {
        return post
    }

    data.forum_username = post.relationships.user?.attributes.username!;
    data.forum_discussion_id = post.id;
    data.forum_created_at = post.relationships.firstPost?.attributes.createdAt!;
    data.forum_user_id = post.relationships.user?.id! as number;
    return data;
}

export const updateAct = async(data: ActModel): Promise<string|undefined> => {
    // put the data
    try {
        const dbResult = await collections.developments?.updateOne({_id: data._id}, data);

        if (!dbResult) {
            return `Failed to insert the user scenario in the database`;
        }
    } catch (error) {
        return JSON.stringify(error);;
    } 

    return undefined;
}

export const getAllActs = async(): Promise<ActWithProjectAndPlan[]> => {
    try {
        const dbResult = await collections.developments?.aggregate([
            {
                $lookup: {
                    from: process.env.DB_COLLECTION_NAME_PROJECTS_V1!,
                    localField: "project_id",
                    foreignField: "_id",
                    as: "project_v1"
                }
            },
            {
                $match: {
                    "project_v1" : {$ne : []}
                }
            },
            {
                $lookup: {
                    from: process.env.DB_COLLECTION_NAME_PLANS!,
                    localField: "project_id",
                    foreignField: "project_id",
                    as: "plan"
                }
            }
        ]).toArray();
        if (dbResult !== undefined) {
            return dbResult as ActWithProjectAndPlan[]
        }
    } catch (e) {
        console.error(`Error: ${e}`);
    }
    return [];
}

export const getActById = async(devId: string): Promise<ActModel|string> => {
    const _id = new ObjectId(devId);

    // put the data
    try {
        const dbResult = await collections.developments?.findOne({_id});

        if (!dbResult) {
            return `not found in database`;
        }
        return dbResult;
    } catch (error) {
        return JSON.stringify(error);
    } 
}

export const setActDev = async (data: ActModel): Promise<undefined|string> => {
    // put the data
    try {
        const dbResult = await collections.developments?.replaceOne({_id: data._id}, data);
    
        if (!dbResult) {
            return `Failed to insert the user scenario in the database`;
        }
    } catch (error) {
        return JSON.stringify(error);;
    } 
    
    return undefined;
}

export const getScene = async (developmentId: string): Promise<Scene|undefined> => {
    let raw: string = '';
    try {
        raw = await db.get(developmentId);
    } catch (e) {
        return undefined;
    }

    return JSON.parse(raw) as Scene;
}

export const setScene = async(developmentId: string, scene: Scene) => {
    await db.put(developmentId, JSON.stringify(scene));
}

export const getParts = async (developmentId: string, level: number, parentObjId?: string): Promise<PartModel[]> => {
    const query: any = {developmentId, level};
    if (parentObjId) {
        query['parentObjId'] = parentObjId;
    }

    try {
        const dbResult = await collections.parts?.find(query).toArray();
        if (dbResult !== undefined) {
            return dbResult as PartModel[]
        }
    } catch (e) {
        console.error(`Error: ${e}`);
    }
    return [];   
}

export const getPart = async (developmentId: string, level: number, objId: string): Promise<PartModel|undefined> => {
    const query: any = {developmentId, level, objId};

    try {
        const dbResult = await collections.parts?.findOne(query);
        if (dbResult !== null) {
            return dbResult as PartModel;
        }
    } catch (e) {
        console.error(`Error: ${e}`);
    }
    return undefined;
}

export const setPart = async (data: PartModel): Promise<undefined|string> => {
    if (data._id) {
        // put the data
        try {
            const dbResult = await collections.parts?.replaceOne({_id: data._id}, data);
        
            if (!dbResult) {
                return `Failed to insert the user scenario in the database`;
            }
        } catch (error) {
            return JSON.stringify(error);;
        } 
    } else {
        // put the data
        try {
            const dbResult = await collections.parts?.insertOne(data);
        
            if (!dbResult) {
                return `Failed to insert the user scenario in the database`;
            }
        } catch (error) {
            return JSON.stringify(error);;
        }
    }
    
    return undefined;
}