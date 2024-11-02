import { Request, Response } from "express";
import { getActById, getAllActs, getPart, getParts, getScene, setActDev, setPart, setScene } from "../models/act";
import { ACTPart, Scene } from "../types";
import { PartModel } from "../models";
import { getPlanByProjectId, updatePlan } from "../models/maydone";
import { formatEther, parseEther } from "ethers";

/**
 * GET /acts/projects returns the list of the projects
 * @param req 
 * @param res 
 * @returns 
 */
export const onActs = async (req: Request, res: Response) => {
    let result = await getAllActs();
    return res.json(result);
}

/**
 * GET /act/scenes/:developmentId returns the scene objects such as data and their positions.
 * @param req 
 * @param res 
 */
export const onScene = async(req: Request, res: Response) => {
    const developmentId = req.params.developmentId;
    const scene = await getScene(developmentId);
    const defaultScene = {sceneId: ''} as Scene;
    if (scene === undefined) {
        return res.status(404).json(defaultScene)
    }

    return res.json(scene);
}

/**
 * POST /act/scenes/:developmentId saves the scene
 * @param req 
 * @param res 
 */
export const onSceneSave = async(req: Request, res: Response) => {
    const developmentId = req.params.developmentId;
    const scene = req.body as Scene;
    await setScene(developmentId, scene);

    return res.json({status: 'ok'})
}

/**
 * GET /act/parts/:developmentId returns the parts at the level 1
 * @param req 
 * @param res 
 */
export const onParts = async(req: Request, res: Response) => {
    const developmentId = req.params.developmentId;

    const data = await getParts(developmentId, 1, undefined);
    return res.json(data);
}

/**
 * GET /act/parts/:developmentId/:level/:parentObjId
 * @param req 
 * @param res 
 * @returns 
 */
export const onNestedParts = async(req: Request, res: Response) => {
    const developmentId = req.params.developmentId;
    const level = parseInt(req.params.level);
    if (!level) {
        return res.status(400).json("invalid level");
    }
    const parentObjId = req.params.parentObjId;

    const data = await getParts(developmentId, level, parentObjId);
    return res.json(data);
}

/**
 * POST /act/part is on Inserting or Replacing the part
 * @param req 
 * @param res 
 * @returns 
 */
export const onPart = async(req: Request, res: Response) => {
    const part = req.body as PartModel;

    if (!part.objId || !part.developmentId || !part.level) {
        return res.status(400).json({message: 'No obj id or dev id or level'});
    }

    const foundPart = await getPart(part.developmentId, part.level, part.objId);
    if (foundPart !== undefined) {
        part._id = foundPart._id;
    } else {
        part._id = undefined;
    }

    const setted = await setPart(part);
    if (typeof(setted) === 'string') {
        return res.status(500).json({message: setted});
    }
    
    // Update part amount in the Development
    if (part.level == 1 && foundPart === undefined) {
        // increase the act amount
        const actDev = await getActById(part.developmentId);
        if (typeof(actDev) === 'string') {
            return res.status(500).json({message: actDev});
        }
        if (actDev.parts_amount === undefined) {
            actDev.parts_amount = 1;
        } else {
            actDev.parts_amount++;
        }

        const actDevSetted = await setActDev(actDev);
        if (typeof(actDevSetted) === 'string') {
            return res.status(500).json({message: actDevSetted});
        }
    }

    // Budget increase
    if (part.level === 1 && (foundPart === undefined || foundPart.budget !== part.budget)) {
        // Just to get the project id, and through the project id get the plan id
        const actDev = await getActById(part.developmentId);
        if (typeof(actDev) === 'string') {
            return res.status(500).json({message: actDev});
        }
        const plan = await getPlanByProjectId(actDev.project_id);
        if (typeof(plan) === 'string') {
            return res.status(500).json({message: plan});
        }

        if (plan.used_budget === undefined) {
            plan.used_budget = parseEther(part.budget.toString()).toString();
        } else {
            const planBudgetF = parseFloat(formatEther(plan.used_budget));
            let diff = 0;
            if (foundPart === undefined) {
                diff = part.budget;
            } else {
                diff = part.budget - foundPart.budget;
            }
            const planBudgetUpdatedF = planBudgetF + diff
            plan.used_budget = parseEther(planBudgetUpdatedF.toString()).toString();
        }

        const updated = await updatePlan(plan);
        if (updated !== undefined) {
            return res.status(500).json({message: updated});
        }
    }

    return res.json({part: part, increasePartsAmount: foundPart == undefined});
}