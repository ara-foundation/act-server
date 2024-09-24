/**
 * This module works with the projects created in the Ara Foundation
 */
import { Request, Response } from "express";
import { all as allProjects } from "../models/projects";
import { collections  } from "../db";
import { ObjectId } from "mongodb";

/**
 * GET /projects returns list of all projects
 * @param _req 
 * @param res 
 */
export const onProjects = async (_req:Request, res: Response) => {
    const projects = await allProjects();

    res.json(projects)
};

/**
 * /GET /project/:id returns a project parameter
 * @param req 
 * @param res 
 * @returns 
 */
export const onProject = async (req: Request, res: Response) => {
    let objectId: ObjectId;
    try {
        objectId = new ObjectId(req.params.id);
    } catch (e) {
        res.status(400).json({message: JSON.stringify(e)});
        return;
    }

    try {
        const document = await collections.projects?.findOne({"_id": objectId});
        if (document) {
            res.json(document);
        } else {
            res.status(404).json({message: "no project"})
        }
    } catch (e) {
        res.status(400).json({message: JSON.stringify(e)});
    }
}