import { ObjectId } from "mongodb";
import { collections } from "../db";
import { PlanModel, UserScenarioModel } from "../models";
import { Request, Response } from "express";


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
        const dbResult = await collections.plans?.replaceOne({_id: data._id}, data);

        if (!dbResult) {
            return `Failed to insert the user scenario in the database`;
        }
    } catch (error) {
        return JSON.stringify(error);;
    } 

    return undefined;
}