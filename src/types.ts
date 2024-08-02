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