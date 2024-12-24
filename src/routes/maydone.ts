import { collections } from "../db";
import { ActModel, LinkedWalletModel, PlanModel, ProjectV1Model } from "../models";
import { createDiscussion, userIdByToken, validToken } from "../models/forum";
import { createPlan, getPlanByProjectId, updatePlan } from "../models/maydone";
import { LinkedWallet, LungtaLinks, Plan } from "../types";
import { Request, Response } from "express";
import { countProjectV1, createProjectV1, getProjectV1ByNetwork, updateProjectV1 } from "../models/projects";
import { ObjectId } from "mongodb";
import { createAct, createActPost } from "../models/act";
import { getLinkWallet, getLinkWalletByWalletAddress } from "../models/users";

export type AddWelcomePage = {
    token: string;
    projectId: number;
    networkId: number;
    content: string;
}

export type AraTokenType = {
    MaxSupply: string;
    Symbol: string;
    Name: string;
}

export type AraProjectType =
{
    Active: boolean;
    Name: string;
    Logos: string;
    Aurora: string;
    TechStack: string;
    CostUsd: string;
    Duration: string;
    SourceCodeUrl: string;
    TestUrl: string;
    StartTime: number;
}

export type AddPlanRequest = {
    token: string;
    leaderUserName: string;
    sanghaWelcome: string;
    cryptoToken: AraTokenType,
    project: AraProjectType,
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

/**
 * /POST /maydone/plan adds a new plan. Call it for planning without blockchain.
 * @param req 
 * @param res 
 * @returns 
 */
export const onAddPlan = async (req: Request, res: Response) => {
    const data = req.body as AddPlanRequest;
    if (!data) {
        return res.status(400).json({message: 'missing AddPlanRequest body parameters'});
    }

    const valid = await validToken(data.token);
    if (!valid) {
        return res.status(401).json({message: 'invalid user'});
    }

    const userId = await userIdByToken(data.token);
    if (userId === undefined || userId <= 0) {
        return res.status(401).json({message: 'no user found in session'});
    }

    const projectId = await countProjectV1();
    const networkId = parseInt(process.env.ACTIVE_NETWORK_ID!);
    const lungtaLinks: LungtaLinks = {
        aurora_id: new ObjectId(data.project.Aurora),
        logos_id: parseInt(data.project.Logos)
    };

    const linkedWallet = await getLinkWallet(data.leaderUserName);
    if (typeof (linkedWallet) === 'string') {
        return res.status(400).json({message: `Failed to get linked wallet address for ${data.leaderUserName}: ${linkedWallet}`});
        return;
    }
    if ((linkedWallet as LinkedWalletModel).userId === 0) {
        console.error(`wallet not linked`);
        return;
    }

    /*
    deployed smartcontracts
    projectV1.sangha!.ownership = data.project_0;
      projectV1.sangha!.maintainer = data.project_1;
      projectV1.sangha!.check = data.project_2;
    
      projectV1.sangha!.ownershipSymbol = await symbolOf(projectV1.sangha!.ownership!, networkId);
      projectV1.sangha!.maintainerSymbol = `${projectV1.sangha!.ownershipSymbol}m`;
      projectV1.sangha!.checkSymbol = `${projectV1.sangha!.ownershipSymbol}c`;
    
    let dataToAdd: ProjectV1Model = {
        projectId,
        networkId,
        sangha: {
            ownership: data
            ownership_minted: "0",
        },
        lungta: lungtaLinks,
        project_name: data.project.Name,
    
        leader: linkedWallet as LinkedWallet,
    }

    const projectV1 = await createProjectV1(dataToAdd);
    if (typeof projectV1 === 'string') {
        console.error(`Failed to create project in database: ${JSON.stringify(dataToAdd)}: ${projectV1}`);
        return;
    }
    
    // lets add plan, act and sangha pages
    const plan = await createPlan({project_id: projectV1._id!, cost_usd: data.project.CostUsd})
    if (typeof plan === 'string') {
        console.error(`Failed to create plan in database: ${JSON.stringify(dataToAdd)}: ${plan}`);
        return;
    }
    projectV1.lungta!.maydone_id = plan._id!;
    
    // let's add act
    const actData: ActModel = {
        project_id: projectV1._id!,
        tech_stack: data.project.TechStack,
        source_code_url: data.project.SourceCodeUrl,
        test_url: data.project.TestUrl,
        start_time: data.project.StartTime,
        duration: parseInt(data.project.Duration),
    }
    let act = await createActPost(projectV1, actData);
    if (typeof(act) === 'string') {
        console.log(`Failed to create a forum post ${JSON.stringify(actData)}: ${act}`);
    }
    act = await createAct(act as ActModel)
    if (typeof(act) === 'string') {
        console.error(`Failed to create act in database: ${JSON.stringify(actData)}: ${act}`);
        return
    }
    projectV1.lungta!.act_id = act._id!;
    
    // We will skip the sangha post
    const updated = await updateProjectV1(projectV1);
    if (typeof(updated) === 'string') {
        console.error(`Failed to update project ${JSON.stringify(projectV1)}: ${updated}`);
    }
    
      // If we have in memory parameters of project that came earlier, then add them.
      const key = `${networkId}_${projectId}`
      if (inMemoryProjectSetSangha[key] !== undefined) {
        await processSetProjectSangha(inMemoryProjectSetSangha[key])
        delete inMemoryProjectSetSangha[key]
      }
      if (inMemoryTreasurySetProjects[key] !== undefined) {
        await processSetProjectInTreasury(inMemoryTreasurySetProjects[key])
        delete inMemoryTreasurySetProjects[key]
      }
      if (inMemoryTreasuryMint[key] !== undefined) {
        await processMintOwnership(inMemoryTreasuryMint[key])
        delete inMemoryTreasuryMint[key]
      }

      /////////// 
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

    return res.json(plan);*/
}