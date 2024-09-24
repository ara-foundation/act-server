/**
 * Logos is in the Ara terminology, means the ideas.
 * This module handles the Ara platform's idea hub.
 */
import { Request, Response } from "express";
import { ConvertForumToAraDiscussion, filterDiscussionsByTag, getDiscussions, getDiscussionsByUrl } from "../models/forum";
import { DiscussionData } from "@ara-foundation/flarum-js-client/dist/types"

export type IdeasByUrl = {
    url: string;
}

/**
 * GET /logos/ideas returns all ideas on the main page
 * @param req 
 * @param res 
 */
export const onIdeas = async (req: Request, res: Response) => {
    const discussions = await getDiscussions();
    if (typeof(discussions) === 'string') {
        return res.status(400).json({message: discussions});
    }

    const ideaDiscussions: DiscussionData[] = filterDiscussionsByTag(discussions.data, process.env.ARA_LOGOS_TAG_ID!);

    const araDiscussions = ConvertForumToAraDiscussion(ideaDiscussions, discussions.included);
    
    res.json({
        link: discussions.links,
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
    const discussions = await getDiscussions({userName});
    if (typeof(discussions) === 'string') {
        return res.status(400).json({message: discussions});
    }

    const ideaDiscussions: DiscussionData[] = filterDiscussionsByTag(discussions.data, process.env.ARA_LOGOS_TAG_ID!);

    const araDiscussions = ConvertForumToAraDiscussion(ideaDiscussions, discussions.included);
    
    res.json({
        link: discussions.links,
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

    const ideaDiscussions: DiscussionData[] = filterDiscussionsByTag(discussions.data, process.env.ARA_LOGOS_TAG_ID!);

    const araDiscussions = ConvertForumToAraDiscussion(ideaDiscussions, discussions.included);
    
    res.json({
        link: discussions.links,
        data: araDiscussions,
    })
}