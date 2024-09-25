/**
 * Logos is in the Ara terminology, means the ideas.
 * This module handles the Ara platform's idea hub.
 */
import { Request, Response } from "express";
import { convertForumDiscussionsToAraDiscussions, createDiscussion, getDiscussions, getDiscussionsByUrl } from "../models/forum";
import { LungtaType } from "../types";

export type IdeasByUrl = {
    url: string;
}

export type IdeaCreate = {
    token: string;
    title: string;
    content: string;
}

/**
 * GET /logos/ideas returns all ideas on the main page
 * @param req 
 * @param res 
 */
export const onIdeas = async (req: Request, res: Response) => {
    const discussions = await getDiscussions({tag: LungtaType.Logos});
    if (typeof(discussions) === 'string') {
        return res.status(400).json({message: discussions});
    }

    const araDiscussions = convertForumDiscussionsToAraDiscussions(discussions.data, discussions.included);
    
    res.json({
        links: discussions.links,
        data: araDiscussions,
    })
}

/**
 * GET /logos/ideas/:userName returns list of ideas filtered by the user name
 * @param req 
 * @param res 
 * @returns 
 */
export const onIdeasByUserName = async (req: Request, res: Response) => {
    const userName = req.params.userName;
    if (!userName) {
        return res.status(400).json({message: 'Invalid userName argument'});
    }
    const discussions = await getDiscussions({author: userName, tag: LungtaType.Logos});
    if (typeof(discussions) === 'string') {
        return res.status(400).json({message: discussions});
    }

    const araDiscussions = convertForumDiscussionsToAraDiscussions(discussions.data, discussions.included);
    
    res.json({
        links: discussions.links,
        data: araDiscussions,
    })
}

/**
 * POST /logos/ideas returns list of ideas by given flarum api url.
 * This function is intended to be called by the navigation links.
 * All discussions return Links with 'prev', 'next' parameters.
 * 
 * Calling them through this function will convert the forum data type into Ara data type.
 * @param req 
 * @param res 
 */
export const onIdeasByUrl = async (req: Request, res: Response) => {
    let url = "";
    try {
        const params = JSON.parse(req.body) as IdeasByUrl;
        if (!params || !params.url) {
            throw `Invalid body`;
        }
        url = params.url;
    } catch (e) {
        return res.status(400).json({message: JSON.stringify(e)});
    }

    const discussions = await getDiscussionsByUrl(url);
    if (typeof(discussions) === 'string') {
        return res.status(400).json({message: discussions});
    }

    const araDiscussions = convertForumDiscussionsToAraDiscussions(discussions.data, discussions.included);
    
    res.json({
        links: discussions.links,
        data: araDiscussions,
    })
}

/**
 * POST /logos/idea is used to create a new discussion
 * @param req 
 * @param res 
 */
export const onIdeaCreate = async (req: Request, res: Response) => {
    const ideaCreateData = req.body as IdeaCreate;
    if (!ideaCreateData) {
        return res.status(400).json({message: 'missing IdeaCreate body parameters'});
    }

    const idea = await createDiscussion(ideaCreateData.token, ideaCreateData.title, ideaCreateData.content, process.env.ARA_LOGOS_TAG_ID!);
    if (typeof(idea) === 'string') {
        return res.status(400).json({message: idea})
    }

    return res.json(idea);
}