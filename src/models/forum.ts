import dotenv from "dotenv";
dotenv.config();
import { CreateSessionToken, FlarumApi, FlarumDiscussions, Discussions, DiscussionData, IncludedUser, IncludedPost, DiscussionFilter, Discussion, FlarumUsers, User, UserData, Links } from "@ara-foundation/flarum-js-client";
import { AraDiscussion, AraUser, LungtaType } from "../types";

const api = new FlarumApi(process.env.ARA_FORUM_API_ENDPOINT!, process.env.NODE_ENV !== undefined && process.env.NODE_END !== 'production');

export type AccessToken = {
    type: "access-tokens",
    id: string | number,
    attributes: {
        userId: number,
        createdAt: string,
        lastActivityAt: string,
        isCurrent: boolean,
        isSessionToken: boolean,
        title?: string,
        lastIpAddress?: string,
        device?: string
      }
}

export type AccessTokens = {
    links: Links,
    data: AccessToken[],
}

export type CreateSessionTokenWithUserId = CreateSessionToken & {
    user_id: number,
};

/**
 * Initialize the Flarum Client with the Admin Key.
 */
export const init = async(): Promise<void> => {
    const status = await api.authorize(parseInt(process.env.ARA_DEV_USER_ID!), process.env.ARA_DEV_API_KEY!);
    
    if (typeof(status) === 'string') {
        throw status;
    }
}

/**
 * Return a discussion
 */
export const getDiscussion = async(discussionId: number): Promise<string|Discussion> => {
    const result = await FlarumDiscussions.get(api, discussionId);
    return result;
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
    let postId = discussion.relationships.firstPost?.data.id;
    if (!discussion.relationships.firstPost) {
        postId = discussion.relationships.posts!.data[0].id!
    }
    
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
            firstPost: FindIncludedPostById(included, postId!),
        }
    }
    return araDiscussion;
}

/**
 * Convert the Forum's user into an Ara User
 * @param user 
 * @returns 
 */
export const convertForumUserToAraUser = (user: UserData): AraUser => {
    const araUser: AraUser = {
        id: user.id!,
        attributes: {
            username: user.attributes.username,
            displayName: user.attributes.displayName,
            avatarUrl: user.attributes.avatarUrl,
            slug: user.attributes.slug,
            discussionCount: user.attributes.discussionCount,
            commentCount: user.attributes.commentCount,
            lastSeenAt: user.attributes.lastSeenAt,
            isEmailConfirmed: user.attributes.isEmailConfirmed,
            email: user.attributes.email,
            points: user.attributes.points,
        },
    }
    return araUser;
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

/**
 * Returns the user from the server
 * @param userId id in the forum
 * @returns 
 */
export const getUser = async (userId: number): Promise<string|User> => {
    const result = await FlarumUsers.get(api, userId);
    return result;
}

/**
 * create a new user with the given name, email and password
 * @param username 
 * @param password 
 * @param email 
 * @returns 
 */
export const createUser = async (username: string, password: string, email: string): Promise<string|User> => {
    const user: User = {
        data: {
            attributes: {
                username,
                password,
                email,
            }
        },
        included: []
    }
    const result = await FlarumUsers.create(api, user);
    return result;
}

/**
 * Create a session token for the user.
 * @param username 
 * @param password 
 * @returns 
 */
export const createSessionToken = async (username: string, password: string): Promise<string|CreateSessionTokenWithUserId> => {
    const tempApi = api.cloneWithToken('');
    const result = await tempApi.authorize(username, password);
    if (typeof(result) === 'string') {
        return result;
    }
    
    return {
        token: result.token,
        user_id: tempApi.getUserId(),
    }
}

/**
 * Validates the access token
 * @param token User's token
 * @returns boolean
 */
export const validToken = async(token: string): Promise<boolean> => {
    return await FlarumUsers.canAccess(api, token);
}

/**
 * Returns a user id by the given token. If no user found, then returns undefined.
 * @param token session token
 */
export const userIdByToken = async(token: string): Promise<number|undefined> => {
    var tempApi = new FlarumApi(process.env.ARA_FORUM_API_ENDPOINT!, !process.env.NODE_ENV || process.env.NODE_END !== 'production');
    var authResult = await tempApi.authorize(10, token);
    if (typeof(authResult) === 'string') {
        console.error(authResult);
        return undefined;
    }
    let url = `${tempApi.endpoint}/access-tokens`;
    
    let lastUserId: number | undefined = undefined;

    while(true) {
        const response = await tempApi.getFetch(url);

        if (typeof(response) === 'string') {
            return undefined;
        }

        var accessTokens = response as AccessTokens;
        if (!accessTokens.data || accessTokens.data.length == 0) {
            return undefined;
        }
        lastUserId = accessTokens.data[accessTokens.data.length - 1].attributes.userId as number;
        for (let accessToken of accessTokens.data) {
            if (accessToken.attributes.isCurrent) {
                return accessToken.attributes.userId;
            }
        }

        if (accessTokens.links.next) {
            url = accessTokens.links.next;
        } else {
            break;
        }
    }

    return lastUserId;
}