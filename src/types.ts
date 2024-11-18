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
  title: string,
  context: UserScenarioContext,
  goals: string[],
  problems: UserScenarioProblem[],
  user_motivations: string[],
  personal_traits: string[],
  relevant_habits_hobbies_beliefs: string[],
  user_scenario_flow: FlowStep[]
}

export type ForumParams = {
  forum_username?: string;
  forum_user_id?: number;
  forum_discussion_id?: number;
  forum_created_at?: string;
}

export type Plan = ForumParams & {
  project_id: ObjectId;
  cost_usd: string;
  used_budget?: string;   // total amount of budget allocated to parts.
  sangha_welcome?: string; // the two sentences to interact other people
}

export type Act = ForumParams & {
  _id?: string;
  project_id: ObjectId;
  tech_stack: string;
  source_code_url: string;
  test_url?: string;
  start_time: number;
  duration: number;
  parts_amount?: number;
}

export type ActWithProjectAndPlan = Act & {
  project_v1: ProjectV1[],
  plan: Plan[],
}

export type Sangha = {
  ownership?: string,
  maintainer?: string,
  check?: string,

  ownershipSymbol?: string,
  maintainerSymbol?: string,
  checkSymbol?: string,

  ownership_max_supply?: string;
  ownership_minted?: string;
}

// For now, logos, aurora and maydone are retreived from the client.
// the client must be the leader.
export type LungtaLinks = {
  logos_id?: number;
  aurora_id?: ObjectId;
  maydone_id?: ObjectId;
  act_id?: ObjectId;
  sangha_id?: ObjectId;
}

export type LinkedWallet = {
  walletAddress: string,
  username: string,
  userId: number,
}

export type TaskV1 = {
  projectId: ObjectId,
  taskId: number;
  checkAmount: string,
  startTime: number,
  endTime: number,
  payload: string,
  completed: boolean,
  canceled: boolean,
}

// By default its todo, which means its in idle.
// Doing is if a freelancer started to work on it.
// Test is when a freelancer completed the job.
// Completed if maintainer approved the tested task.
export type TaskStatusV2 = "todo" | "doing" | "test" | "completed";

export type TaskV2 = {
  title: string;
  description: string;
  deadline: string;
  price_usd: number;
  est_hours: number;
  developmentId: string;
  level: number;
  parentObjId?: string;
  status: TaskStatusV2;
}

export type ProjectV1 = {
  projectId: number,
  networkId: number,
  project_name: string; // how the project is named

  sangha?: Sangha,
  lungta?: LungtaLinks,
  leader?: LinkedWallet,
}

export type DIOSTransfer = ProjectV1 &
{
    version_update_time?: string;
    inputs: string[];        // Equivalent of DIOSData.Type enum
    outputs: string[];
}

export type Scene = {
  sceneId: string,
  lines?: {[key: string]: string[]},
  data?: any,
}

export type ACTPart = {
  //
  // Meta params
  //
  objId: string,          // on scene
  developmentId: string,  // project it belongs too
  level: number,        // level at which it resides
  childObjsId: string[],
  parentObjId: string,

  // 
  // The part params
  //
  projectName: string;
  techStack: string;
  deadline: number;
  maintainer: string;
  budget: number;
  usedBudget?: number;
}