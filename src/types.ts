import { IncludedPost, IncludedUser } from "@ara-foundation/flarum-js-client"
import { ObjectId } from "mongodb"

export type Contract = {
    address: string
    abi: string
}
  
export type Token = Contract & {
    name: string
    symbol: string
}

export type User = {
    walletAddress: string,
    username: string,
    email: string,
    firstname: string,
    lastname: string,
    nonce: number,
}

export type ProjectContracts = {
    DaoToken: {
      [key: string]: Contract
    }
    CheckToken: {
      [key: string]: Contract
    }
    MainToken: {
      [key: string]: Contract
    }
    Minter?: {
      [key: string]: Contract
    }
    Collaterals?: {
      [key: string]: Array<Token>
    }
};
  
export type Project = {
    name: string
    description: string
    video?: string
    image?: string
    lungta?: Lungta
    leader: Link
    sourceCodes?: Array<Link>
    show: {
      test?: Link
      production?: Link
    },
    checkPerUsd: number, // 1 CHECK is how many USD dollars?
    smartcontracts: ProjectContracts,
    checkProjectParams: CheckProjectParams[]
}
  
export type Link = {
    title: string
    link: string
}
  
export type Lungta = {
    logos: Link
    aurora: Link
    maydone: Link
    act: Link
    sangha: Link
}
  
export type CheckProjectParams = {
    id?: string,
    maintainer?: string
    amount?: bigint
    period?: number
    startTime?: number
    minted?: bigint
    limit?: bigint
    cancelled?: boolean
    description?: string // above params are fetched from the smartcontract
    lungta?: Lungta
    addon?: Contract,
    addonCollateral?: Token,
}

export type TaskStatus = "done" | "pending" | "created";

  
export type Task = {
    maintainer: ObjectId,
    projectId: ObjectId,
    checkProjectId: string,
    title: string,
    content: string,
    categories: string[],
    tags: string[],
    created: number,        // Unix timestamp when this task was created
    estHours: number,       // Estimated hours to complete this task
    prize: number,          // Amount of check tokens to give
    prizeType: Token,
    status: TaskStatus,
    sourceId: string,
    images?: Link[]
}

export enum LungtaType {
  Logos = "0-logos", 
  Aurora = "1-aurora", 
  Maydone = "2-maydone", 
  ACT = "3-act", 
  Sangha = "4-sangha"
}

export type AraUser = {
  id: number;
  token?: string;
  attributes: {
    username: string;
    displayName?: string;
    avatarUrl?: string;
    slug?: string;
    discussionCount?: number;
    commentCount?: number;
    lastSeenAt?: string;
    isEmailConfirmed?: boolean;
    email: string;
    points?: number;
  };
};


export type AraDiscussion = {
  type: LungtaType;
  id: number;
  attributes: {
        title: string;
        slug?: string;
        commentCount?: number;
        participantCount?: number;
        createdAt?: string;
        lastPostedAt?: string;
        lastPostNumber?: number;
    };
    relationships: {
        user?: IncludedUser;
        firstPost?: IncludedPost;
    };
}

export type FlowStep = {
  step: number;
  action: string;
  description: string;
}

export type UserScenarioProblem = {
    description: string,
    obstacles: string[]
};

export type UserScenarioContext = {
  user: string;
  background: string;
  steps: string[];
}

export type UserScenario = {
  title: string;
  context: UserScenarioContext,
  goals: string[],
  problems: UserScenarioProblem[],
  user_motivations: string[],
  personal_traits: string[],
  relevant_habits_hobbies_beliefs: string[],
  user_scenario_flow: FlowStep[]
}

export type ForumParams = {
  forum_username: string;
  forum_user_id: number;
  forum_discussion_id: number;
  forum_created_at: string;
}

export type Plan = ForumParams & {
  //
  // Generic data
  // 
  leader_username: string; // the main maintainer
  leader_user_id: number; // the main maintainer
  project_name: string; // how the project is named
  logos_id: number; // the id of the logos
  user_scenario_id: number; // the matching user scenario

  // 
  // ACT Parameters for the snagha
  // 
  tech_stack: string;
  cost_usd: number;
  duration: number; // in days
  source_code_url: string;
  test_url?: string;

  // 
  // Sangha parameter
  // 
  token_name: string;
  token_symbol: string;
  token_max_supply: string;
  sangha_welcome: string; // the two sentences to interact other people
}