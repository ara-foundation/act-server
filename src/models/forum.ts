import dotenv from "dotenv";
dotenv.config();
import { FlarumApi, FlarumDiscussions, FlarumUsers } from "@ara-foundation/flarum-js-client";
import { Discussions, DiscussionData, IncludedUser, IncludedPost, DiscussionFilter } from "@ara-foundation/flarum-js-client/dist/types"
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
    console.log(`Api at ${api.endpoint}`)
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
    console.log(`[Models/forum/getDiscussionsByUrl] Todo: push the v0.0.6 of FlarumJsClient. Then use FlarumDiscussions.getAllByUrl.`);
    const response = await fetch(url, {
        headers: {
            'Content-Type': `application/json`
        },
        method: "GET",
    })

    if (!response.ok) {
        return `Response Status ${response.status}: ${response.statusText}`;
    }

    try {
        const json = await response.json();
        const reply = json as Discussions;
        if (reply === undefined) {
            throw `Failed to get Discussion`;
        }

        return reply;
    } catch (e) {
        return JSON.stringify(e);
    }
}


/**
 * Filters discussions by the given tag
 * @param discussions list of unfiltiered discussions
 * @param tagId the tag id
 */
export const filterDiscussionsByTag = (discussions: DiscussionData[], tagId: string): DiscussionData[] => {
    const filtered = discussions.filter((discussion) => {
        return discussion.relationships.tags && discussion.relationships.tags?.data?.length > 0 && discussion.relationships.tags.data[0].id == tagId 
    })

    return filtered;
}

/**
 * Convert the Tag ID into the Lungta Type
 * @param tagId 
 */
export const ConvertForumTagToLungtaType = (tagId: number | string): LungtaType => {
    if (tagId == process.env.ARA_LOGOS_TAG_ID!) {
        return "logos"
    } else if (tagId == process.env.ARA_STORY_TAG_ID!) {
        return "story";
    } else if (tagId == process.env.ARA_MAYDONE_TAG_ID!) {
        return "maydone"
    } else if (tagId == process.env.ARA_ACT_TAG_ID!) {
        return "act";
    } else {
        return "sangha";
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
export const ConvertForumToAraDiscussion = (discussions: DiscussionData[], included: Discussions["included"]): AraDiscussion[] => {
    const araDiscussions: AraDiscussion[] = [];

    for (let discussion of discussions) {
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

        araDiscussions.push(araDiscussion);
    }

    return araDiscussions;
}
