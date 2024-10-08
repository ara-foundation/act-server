/**
 * This module works with the projects created in the Ara Foundation
 */
import { Request, Response } from "express";
import { all as allProjects, getProjectV1, getProjectV1ByNetwork } from "../models/projects";
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

    const project = await getProjectV1(objectId);
    if (project === undefined) {
        return res.status(404).json({message: 'not found'});
    }
    if (typeof project === 'string') {
        return res.status(500).json({message: project});
    }

    return res.json(project)
}

/**
 * /GET /project/:id/:networkId returns a project parameter by it's id on network
 * @param req 
 * @param res 
 * @returns 
 */
export const onProjectByNetwork = async (req: Request, res: Response) => {
    let projectId = parseInt(req.params.id);
    let networkId = parseInt(req.params.networkId);
    if (!projectId || !networkId) {
        res.status(400).json({message: 'invalid parameter'});
        return;
    }

    const project = await getProjectV1ByNetwork(projectId, networkId);
    if (project === undefined) {
        return res.status(404).json({message: 'not found'});
    }
    if (typeof project === 'string') {
        return res.status(500).json({message: project});
    }

    return res.json(project)
}