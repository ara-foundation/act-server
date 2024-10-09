import { collections } from "../db";
import { PlanModel, ProjectV1Model } from "../models";
import { createDiscussion, userIdByToken, validToken } from "../models/forum";
import { getPlanByProjectId, updatePlan } from "../models/maydone";
import { Plan } from "../types";
import { Request, Response } from "express";
import { getProjectV1ByNetwork } from "../models/projects";

export type AddWelcomePage = {
    token: string;
    projectId: number;
    networkId: number;
    content: string;
}

export type PlanWithProject = PlanModel & {
    project_v1: ProjectV1Model[]
}

export const planToMarkdown = (project: ProjectV1Model, plan: Plan): string => {
    let html = `
# Project "${project.project_name}" plan\n\n
    
 * [Idea that it implements](https://forum.ara.foundation/d/${project.lungta?.logos_id})\n
 * [User Scenario that it implements](https://forum.ara.foundation/d/${project.lungta?.aurora_id})\n
 * [Development progress](https://forum.ara.foundation/d/${project.lungta?.act_id})\n
 * [Be an owner](https://forum.ara.foundation/d/${project.lungta?.sangha_id})\n
 \n
\n> ${plan.sangha_welcome}\n

**Invest on the Maydone page**: [${project.project_name}](https://maydone.ara.foundation/projects/${project.project_name})
### Project parameters \n
\n
- **Main leader** responsible for the project success: [${project.leader?.username}](https://forum.ara.foundation/u/${project.leader?.userId})\n
- **Cost** (in USD): ${parseInt(plan.cost_usd) / 1e18}\n
\n\n
## Sangha (a project community)
\n\n
- **Token** control over the project: ${project.sangha?.ownershipSymbol}
- **Max supply**: ${parseInt(project.sangha?.ownership_max_supply!)/1e18}`;

    return html;
}

/**
 * GET /maydone/plans returns the list of the user scenarios
 * @param req 
 * @param res 
 * @returns 
 */
export const onPlans = async (req: Request, res: Response) => {
    let cursor = collections.plans?.aggregate([
        {
            $match: {
                sangha_welcome : {$ne : undefined}
            }
        },{
        $lookup: {
                from: process.env.DB_COLLECTION_NAME_PROJECTS_V1!,
                localField: "project_id",
                foreignField: "_id",
                as: "project_v1"
            }
    }]);
    let result = await cursor?.toArray();

    if (result === undefined || result.length == 0) {
        return res.json([]);
    }
    let rows = result as PlanWithProject[];
    return res.json(rows);
}

/**
 * /POST /maydone/plan/welcome adds a welcome page. Call it from maydone after project was set
 * @param req 
 * @param res 
 * @returns 
 */
export const onAddWelcome = async (req: Request, res: Response) => {
    const data = req.body as AddWelcomePage;
    if (!data) {
        return res.status(400).json({message: 'missing AddWelcomePage body parameters'});
    }

    const valid = await validToken(data.token);
    if (!valid) {
        return res.status(401).json({message: 'invalid user'});
    }

    const userId = await userIdByToken(data.token);
    if (userId === undefined || userId <= 0) {
        return res.status(401).json({message: 'no user found in session'});
    }

    const projectV1 = await getProjectV1ByNetwork(data.projectId, data.networkId);
    if (projectV1 === undefined) {
        return res.status(404).json(`project ${data.projectId} on ${data.networkId} network not found`);
    }

    if (typeof(projectV1) === 'string') {
        return res.status(400).json({message: `Failed to get project for ${data.projectId} on ${data.networkId} network: ${projectV1}`});
    }

    if (!projectV1.leader || projectV1.leader.userId !== userId) {
        return res.status(400).json({message: 'only leader can call it'});
    }

    const plan = await getPlanByProjectId(projectV1._id);
    if (typeof plan === 'string') {
        return res.status(400).json({message: `Failed to get plan for ${data.projectId}: ${plan}`});
    }
    
    if (plan.sangha_welcome && plan.sangha_welcome.length > 0) {
        return res.status(500).json({message: 'already added a welcome page'});
    }
    plan.sangha_welcome = data.content;

    let content = planToMarkdown(projectV1, plan);
    if (!content) {
        return res.status(400).json({message: 'failed to convert project plan into a forum post'});
    }

    const planTitle = `Invest in '${projectV1.project_name}'`;

    const post = await createDiscussion(data.token, planTitle, content, process.env.ARA_MAYDONE_TAG_ID!);
    if (typeof(post) === 'string') {
        return res.status(400).json({message: post})
    }

    plan.forum_username = post.relationships.user?.attributes.username!;
    plan.forum_discussion_id = post.id;
    plan.forum_created_at = post.relationships.firstPost?.attributes.createdAt!;
    plan.forum_user_id = post.relationships.user?.id! as number;
    
    const updated = await updatePlan(plan);
    if (typeof(updated) === 'string') {
        return res.status(400).json({message: `failed to update plan: ${updated}`});
    }

    return res.json(plan);
}