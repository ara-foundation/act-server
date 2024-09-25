import dotenv from "dotenv";
dotenv.config();
import { FlarumApi, FlarumDiscussions, Discussions, DiscussionData, IncludedUser, IncludedPost, DiscussionFilter, Discussion } from "@ara-foundation/flarum-js-client";
import { AraDiscussion, LungtaType } from "../types";

const api = new FlarumApi(process.env.ARA_FORUM_API_ENDPOINT!, !process.env.NODE_ENV || process.env.NODE_END !== 'production');
console.log(`Api is loaded at ${api.endpoint}`)

/**
 * Initialize the Flarum Client with the Admin Key.
 */
export const init = async(): Promise<void> => {
    const status = await api.authorize(parseInt(process.env.ARA_DEV_USER_ID!), process.env.ARA_DEV_API_KEY!);
    
    if (status) {
        throw status;
    }
    console.log(`Api is succeed at ${api.endpoint}`)

}

/**
 * Return list of discussions
 * @returns list of discussions
 */
export const getDiscussions = async(discussionFilter?: DiscussionFilter): Promise<string|Discussions> => {
    const result = await FlarumDiscussions.getAll(api, discussionFilter);
    return result;
}

/**
 * Returns list of dicussions by the given url. Usually its used to work with the links.
 * To follow Previous or Next slice of the items.
 * @param url Url of dicussions
 * @returns 
 */
export const getDiscussionsByUrl = async(url: string): Promise<string|Discussions> => {
    return await FlarumDiscussions.getAllByUrl(url);
}


/**
 * Convert the Tag ID into the Lungta Type
 * @param tagId 
 */
export const ConvertForumTagToLungtaType = (tagId: number | string): LungtaType => {
    if (tagId == process.env.ARA_LOGOS_TAG_ID!) {
        return LungtaType.Logos
    } else if (tagId == process.env.ARA_STORY_TAG_ID!) {
        return LungtaType.Aurora;
    } else if (tagId == process.env.ARA_MAYDONE_TAG_ID!) {
        return LungtaType.Maydone
    } else if (tagId == process.env.ARA_ACT_TAG_ID!) {
        return LungtaType.ACT;
    } else {
        return LungtaType.Sangha;
    }
}

/**
 * Returns a tag id for the lungta
 * @param lungtaType
 * @returns 
 */
export const convertLungtaTypeToForumTag = (lungtaType: LungtaType): string => {
    if (lungtaType == LungtaType.Logos) {
        return process.env.ARA_LOGOS_TAG_ID!
    } else if (lungtaType == LungtaType.Aurora) {
        return process.env.ARA_STORY_TAG_ID!;
    } else if (lungtaType == LungtaType.Maydone) {
        return process.env.ARA_MAYDONE_TAG_ID!
    } else if (lungtaType == LungtaType.ACT) {
        return process.env.ARA_ACT_TAG_ID!
    } else {
        return process.env.ARA_SANGHA_TAG_ID!;
    }
}


export const FindIncludedUserById = (included: Discussions["included"], id: number | string): IncludedUser|undefined => {
    for (let element of included) {
        if (element.type !== "users") {
            continue;
        }
        if (element.id == id) {
            return element as IncludedUser;
        }
    }
    return;
}

export const FindIncludedPostById = (included: Discussions["included"], id: number | string): IncludedPost|undefined => {
    for (let element of included) {
        if (element.type !== "posts") {
            continue;
        }
        if (element.id == id) {
            return element as IncludedPost;
        }
    }
    return;
}

/**
 * Forum data structure is converted into a compact Ara style
 * @param discussions 
 * @param links 
 */
export const convertForumDiscussionsToAraDiscussions = (discussions: DiscussionData[], included: Discussions["included"]): AraDiscussion[] => {
    const araDiscussions: AraDiscussion[] = [];

    for (let discussion of discussions) {
        const araDiscussion = convertForumDiscussionToAraDiscussion(discussion, included);
        araDiscussions.push(araDiscussion);
    }

    return araDiscussions;
}

export const convertForumDiscussionToAraDiscussion = (discussion: DiscussionData, included: Discussions["included"]): AraDiscussion => {
    const araDiscussion: AraDiscussion = {
        type: ConvertForumTagToLungtaType(discussion.relationships?.tags?.data[0].id!),
        id: discussion.id!,
        attributes: {
            title: discussion.attributes.title,
            slug: discussion.attributes.slug,
            commentCount: discussion.attributes.commentCount,
            participantCount: discussion.attributes.participantCount,
            createdAt: discussion.attributes.createdAt,
            lastPostedAt: discussion.attributes.lastPostedAt,
            lastPostNumber: discussion.attributes.lastPostNumber
        },
        relationships: {
            user: FindIncludedUserById(included, discussion.relationships.user?.data.id!),
            firstPost: FindIncludedPostById(included, discussion.relationships.firstPost?.data.id!),
        }
    }
    return araDiscussion;
}

/**
 * for title using `Sometimes, you let everything go...${new Date()}` will fail 
 * since slug generation is impossible 
 * @param token 
 * @param title 
 * @param content 
 * @param tagId 
 * @returns 
 */
export const createDiscussion = async (token: string, title: string, content: string, tagId: string): Promise<AraDiscussion|string> => {
    const discussion: Discussion = {
        data: {
            type: "discussions",
            attributes: {
                title,
                content,
            },
            relationships: {
                tags: {
                    data: [
                        {
                            type: "tags",
                            id: tagId
                        }
                    ]
                }
            }
        },
    }
    const tempApi = api.cloneWithToken(token);
    const createdDiscussion = await FlarumDiscussions.create(tempApi, discussion)
    if (typeof(createdDiscussion) === 'string') {
        return createdDiscussion;
    }
    
    const araDiscussion = convertForumDiscussionToAraDiscussion(createdDiscussion.data, createdDiscussion.included!);
    return araDiscussion;
}