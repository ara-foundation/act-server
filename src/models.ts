import {ObjectId} from "mongodb";
import { Link, Lungta, ProjectContracts, CheckProjectParams, TaskStatus, Token, UserScenario, ProjectV1, ForumParams, LinkedWallet, Plan, Act, TaskV1 } from "./types";

export class TaskModel {
    constructor(
        public maintainer: ObjectId,
        public projectId: ObjectId,
        public checkProjectId: string,
        public title: string,
        public content: string,
        public categories: string[],
        public tags: string[],
        public created: number,        // Unix timestamp when this task was created
        public estHours: number,       // Estimated hours to complete this task
        public prize: number,          // Amount of check tokens to give
        public prizeType: Token,
        public status: TaskStatus,
        public sourceId: string,
        public images?: Link[],
    ) {}
}


export type LinkedWalletModel = LinkedWallet & {
  nonce: number,
}

export type ProjectV1Model = ProjectV1 & {
  _id?: ObjectId,
};

export type PlanModel = Plan & {
  _id?: ObjectId,
};
  
export type ActModel = Act & {
  _id?: ObjectId,
}

// Identical to the Deposited
export class ProjectModel {
    constructor(
        public name: string,
        public description: string,
        public leader: ObjectId,
        public show: {
            test?: Link
            production?: Link
        },
        public checkPerUsd: number,
        public smartcontracts: ProjectContracts,
        public checkProjectParams: CheckProjectParams[],
        public id?: ObjectId,
        public video?: string,
        public image?: string,
        public lungta?: Lungta,
        public sourceCodes?: Array<Link>,
    ){}
}

export type UserScenarioModel = UserScenario & {
  _id?: ObjectId,
  forum_discussion_id: number;
  forum_username: string;
  forum_user_id: number;
  forum_created_at: string;
  logos_id: number;
}

export type CollateralModel = {
    _id?: ObjectId,
    decimals: number,
    feedDecimals: number,
    feed: string, // chain link "0xEca2605f0BCF2BA5966372C99837b1F182d3D620",
    initializer: string, // author "0x80Cbc1f7fd60B7026C0088e5eD58Fc6Ce1180141",
    token: string, // token "0xE1EA187d652A4496285A971d40bfc346BDf9b854",
    symbol: string, // USDT
    networkId: number,
    approved: boolean,
    araTreasuryBalance: string,
}

export const EventTypes = [
  'TreasuryV1_CollateralVotingInit',
  'TreasuryV1_CollateralVotingAction',
  'TreasuryV1_Mint',
  'TreasuryV1_SetProject',
  'ProjectV1_NewProject',
  'ProjectV1_SetSangha',
  'ProjectV1_SetInitialLeader',
  'ActV1_NewTask',
  'ActV1_CompleteTask',
  'ActV1_CancelTask',
  'CashierV1_Redeem',
] as const;

export type IndexedEventType = typeof EventTypes[number];

export type LastIndexTimestampModel = {
  db_timestamp: string
  event_type: IndexedEventType
}

export type TaskV1Model = TaskV1 & {
  _id?: ObjectId
}