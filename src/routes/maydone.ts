import { ObjectId } from "mongodb";
import { collections } from "../db";
import { PlanModel, ProjectV1Model, UserScenarioModel } from "../models";
import { createDiscussion } from "../models/forum";
import { getPlanByProjectId, updatePlan } from "../models/maydone";
import { Plan, ProjectV1 } from "../types";
import { Request, Response } from "express";
import { getProjectV1 } from "../models/projects";

export type AddWelcomePage = {
    token: string;
    projectId: string;
    content: string;
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
    \n **Invest on the Maydone page: [${project.project_name}](https://maydone.ara.foundation/projects/${project.project_name})
### Project parameters \n
\n
- **Main leader** responsible for the project success: [${project.leader?.username}](https://forum.ara.foundation/u/${project.leader?.userId})\n
- **Cost** (in USD): ${parseInt(plan.cost_usd) / 1e18}\n
\n\n
## Sangha (a project community)
\n\n
- **Token**: ${project.sangha?.ownershipSymbol}
- **Max supply**: ${project.sangha?.ownership_max_supply}`;

    return html;
}

/**
 * GET /aurora/user-scenarios returns the list of the user scenarios
 * @param req 
 * @param res 
 * @returns 
 */
export const onPlans = async (req: Request, res: Response) => {
    let cursor = collections.plans?.find({}).sort( { forum_discussion_id: -1 } );
    let result = await cursor?.toArray();

    if (result === undefined || result.length == 0) {
        return res.json([]);
    }
    let rows = result as PlanModel[];
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

    const plan = await getPlanByProjectId(new ObjectId(data.projectId));
    if (typeof plan === 'string') {
        return res.status(400).json({message: `Failed to get plan for ${data.projectId}: ${plan}`});
    }
    
    plan.sangha_welcome = data.content;

    const projectV1 = await getProjectV1(plan.project_id);
    if (projectV1 === undefined) {
        return res.json(`binded project for the plan not found: ${JSON.stringify(plan)}`);
    }

    if (typeof(projectV1) === 'string') {
        return res.status(400).json({message: `Failed to get project for ${data.projectId}`});
    }

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