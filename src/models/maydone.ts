import { ObjectId } from "mongodb";
import { collections } from "../db";
import { PlanModel, UserScenarioModel } from "../models";
import { createDiscussion } from "../models/forum";
import { Plan } from "../types";
import { Request, Response } from "express";



export const planToMarkdown = (plan: Plan): string => {
    let html = `
    # Project "${plan.project_name}" plan\n\n
    * [User Scenario that it implements](https://forum.ara.foundation/d/${plan.user_scenario_id})\n
    * [Idea that it implements](https://forum.ara.foundation/d/${plan.logos_id})\n
    \n
    \n> ${plan.sangha_welcome}\n
    \n **Invest on the Maydone page: [${plan.project_name}](https://maydone.ara.foundation/projects/${plan.project_name})
### Project parameters \n
\n
- **Main leader** responsible for the project success: [${plan.leader_username}](https://forum.ara.foundation/u/${plan.leader_user_id})\n
- **Tech stack** how it it will be build: ${plan.tech_stack}\n
- **Cost** (in USD): ${plan.cost_usd}\n
- **Source Code**: ${plan.source_code_url}\n
- **Testing URL**: ${plan.test_url ? plan.test_url : "no url :("}\n
\n\n
## Sangha (a project community)
\n\n
- **Token**: ${plan.token_name} $${plan.token_symbol}
- **Max supply**: ${plan.token_max_supply}`;

    return html;
}

/**
 * GET /aurora/user-scenarios returns the list of the user scenarios
 * @param req 
 * @param res 
 * @returns 
 */
export const onPlans = async (req: Request, res: Response) => {
    let cursor = collections.user_scenarios?.find({}).sort( { forum_discussion_id: -1 } );
    let result = await cursor?.toArray();

    if (result === undefined || result.length == 0) {
        return res.json([]);
    }
    let rows = result as UserScenarioModel[];
    return res.json(rows);
}

export const getPlanByProjectId = async (projectId: ObjectId): Promise<PlanModel|string> => {
    // put the data
    try {
        const dbResult = await collections.plans?.findOne({project_id: projectId});

        if (!dbResult) {
            return `not found in database`;
        }
        return dbResult;
    } catch (error) {
        return JSON.stringify(error);
    } 
}

/**
 * Creates a new plan in the database without welcome page.
 * This function is called automatically by cron.
 * @param req 
 * @param res 
 * @returns 
 */
export const createPlan = async (data: PlanModel): Promise<PlanModel|string> => {
    // put the data
    try {
        const dbResult = await collections.plans?.insertOne(data);

        if (!dbResult) {
            return `Failed to insert the plan in the database`;
        }

        data._id = dbResult.insertedId;
        return data;
    } catch (error) {
        return JSON.stringify(error);
    } 
}

export const updatePlan = async(data: PlanModel): Promise<string|undefined> => {
    // put the data
    try {
        const dbResult = await collections.plans?.updateOne({_id: data._id}, data);

        if (!dbResult) {
            return `Failed to insert the user scenario in the database`;
        }
    } catch (error) {
        return JSON.stringify(error);;
    } 

    return undefined;
}