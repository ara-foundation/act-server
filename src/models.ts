import {ObjectId} from "mongodb";
import { Link, Lungta, ProjectContracts, CheckProjectParams, TaskStatus, Token, UserScenario } from "./types";

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
export class UserModel {
    constructor(
        public walletAddress: string,
        public username: string,
        public email: string,
        public firstname: string,
        public lastname: string,
        public nonce: number,
        public id?: ObjectId,
    ) {}
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
    forum_discussion_id: number;
    forum_username: string;
}