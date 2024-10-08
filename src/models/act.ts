import { collections } from "../db";
import { ActModel, ProjectV1Model } from "../models";
import { createDiscussion } from "./forum";

export const actToMarkdown = (project: ProjectV1Model, act: ActModel): string => {
    let html = `
### To see progress, download Ara Client on [Official website](https://www.ara.foundation/)

    # Project "${project.project_name}" progress\n\n
    * [Idea that it implements](https://forum.ara.foundation/d/${project.lungta?.logos_id})\n
    * [User Scenario that it implements](https://forum.ara.foundation/d/${project.lungta?.aurora_id})\n
    * [Invest](https://forum.ara.foundation/d/${project.lungta?.maydone_id})\n
    * [Be an owner](https://forum.ara.foundation/d/${project.lungta?.sangha_id})\n
    \n
    \n **Invest on the Maydone page: [${project.project_name}](https://maydone.ara.foundation/projects/${project.project_name})
### Project parameters \n
\n
- **Start time**: ${new Date(act.start_time * 1000)}\n
- **Duration**: ${act.duration / 86400} DAYS\n
- **Source code**: ${act.source_code_url}\n
- **Test**: ${act.test_url}\n
- **Tech Stack**:\n
${act.tech_stack}\n
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

    const post = await createDiscussion(process.env.ARA_DEV_API_KEY!, title, content, process.env.ARA_MAYDONE_TAG_ID!);
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