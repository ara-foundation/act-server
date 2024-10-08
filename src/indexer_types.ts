type DeliveryInfo = {
  current_retry: number //5,
  max_retries: number //5
}

export type Treasury_CollateralInit_Data = {
    decimals: number,
    feedDecimals: number,
    feed: string, // chain link "0xEca2605f0BCF2BA5966372C99837b1F182d3D620",
    id: string, // "97_44530473_119",
    initializer: string, // author "0x80Cbc1f7fd60B7026C0088e5eD58Fc6Ce1180141",
    token: string, // token "0xE1EA187d652A4496285A971d40bfc346BDf9b854",
    db_write_timestamp: string, //"2024-10-08T02:23:05.832759"
}

export type Treasury_CollateralAction_Data = {
    agree: boolean,
    id: string, // "97_44530473_119",
    token: string, // token "0xE1EA187d652A4496285A971d40bfc346BDf9b854",
    db_write_timestamp: string, //"2024-10-08T02:23:05.832759"
}

export type Project_NewProject_Data = {
    project_0: boolean // Project.active
    project_5: string // Project.costUsd in Wei Format
    project_6: number // Project.duration in seconds
    project_9: number // Project.startTime in unix timestamp format
    projectId: number
    project_1: string // Project.name
    project_2: string // Project.logos  // AraDiscussion data type
    project_3: string // Project.aurora // UserScenario data type
    project_4: string // tech stack
    project_7: string // source code url
    project_8: string // test url
  
    id: string //"97_44544773_1",
    db_write_timestamp: string //"2024-09-05T12:04:42.132337",
}
  
export type Project_SetSangha_Data = {
    projectId: number
    id: string // "97_44544773_3",
    db_write_timestamp: string // "2024-10-08T02:37:14.153687"
    project_0: string // ownership "0xe08882F118F40cA5E687887d71b69f180cd3735B",
    project_1: string // maintainer "0x238c7E2f1E3B0CBb83BeE43BcEdae385E9e6fe63",
    project_2: string // check "0xc68B793B9FD1889cAEF883111C2b10c736FaE10f",
}

export type Project_SetInitialLeader_Data = {
  projectId: number
  id: string // "97_44544773_3",
  db_write_timestamp: string // "2024-10-08T02:37:14.153687"
  initialLeader: string // ownership "0xe08882F118F40cA5E687887d71b69f180cd3735B",
}

export type Treasury_Mint_Data = {
    collateralAmount: string,   // amount of collateral that investor added into treasury
    ownershipAmount: string, // "100000000000000000000",
    projectId_: number,
    usdAmount: string, // "10000000000000000000",
    collateral: string, // "0x0000000000000000000000000000000000000000",
    id: string, // "97_44530169_19",
    ownershipToken: string // "0x2708fD3df1f9e3DC6996f26813589c30733A2dE8",
    to: string, // "0xD6dffF953AF507C7934F431d7b020d7C253377c3",
    db_write_timestamp: string //"2024-10-08T02:23:05.832759"
}

export type Treasury_SetProject_Data = {
  projectId: number, // "100000000000000000000",
  tokenAmount: string,
  usdAmount: string, // "10000000000000000000",
  id: string, // "97_44530169_19",
  db_write_timestamp: string //"2024-10-08T02:23:05.832759"
}

export type Act_NewTask_Data = {
    checkAmount_: string,
    projectId: number,
    taskId: number,
    id: string, // "97_44530627_7",
    payload: string, // "Testing the game",
    db_write_timestamp: string, // "2024-10-08T02:23:05.832759"
}

export type Act_CompleteTask_Data = {
    projectId: number,
    taskId: number,
    contributor: string, // "0x80Cbc1f7fd60B7026C0088e5eD58Fc6Ce1180141",
    id: string, // "97_44530635_24",
    payload: string,
    db_write_timestamp: string, // "2024-10-08T02:23:05.832759"
}

export type Act_CancelTask_Data = {
    projectId: number,
    taskId: number,
    id: string, // "97_44530635_24",
    payload: string,
    db_write_timestamp: string, // "2024-10-08T02:23:05.832759"
}

export type Cashier_Redeem_Data = {
    collateralAmount: string, // "9000700",
    usdAmount: string, // "8999959660000000000",
    check: string, // "0x02b3C036098b4e4d8c9900ac9d15E159329473D7",
    collateral: string, // "0xE1EA187d652A4496285A971d40bfc346BDf9b854",
    id: string, // "97_44530822_8",
    to: string, // "0x80Cbc1f7fd60B7026C0088e5eD58Fc6Ce1180141",
    db_write_timestamp: string, // "2024-10-08T02:23:05.832759"
}

//////////////////////////////////////////
//
// Events
//
/////////////////////////////////////////

export type Treasury_CollateralInit_Event = {
  data: {
    new: Treasury_CollateralInit_Data | null
    old: Treasury_CollateralInit_Data | null
  }
  op: string // "INSERT",
  session_variables?: any
  trace_context?: any
}

export type Treasury_CollateralAction_Event = {
    data: {
      new: Treasury_CollateralAction_Data | null
      old: Treasury_CollateralAction_Data | null
    }
    op: string // "INSERT",
    session_variables?: any
    trace_context?: any
}

export type Project_NewProject_Event = {
    data: {
      new: Project_NewProject_Data | null
      old: Project_NewProject_Data | null
    }
    op: string // "INSERT",
    session_variables?: any
    trace_context?: any
}

export type Project_SetSangha_Event = {
    data: {
      new: Project_SetSangha_Data | null
      old: Project_SetSangha_Data | null
    }
    op: string // "INSERT",
    session_variables?: any
    trace_context?: any
}

export type Project_SetInitialLeader_Event = {
  data: {
    new: Project_SetInitialLeader_Data | null
    old: Project_SetInitialLeader_Data | null
  }
  op: string // "INSERT",
  session_variables?: any
  trace_context?: any
}

export type Treasury_Mint_Event = {
  data: {
    new: Treasury_Mint_Data | null
    old: Treasury_Mint_Data | null
  }
  op: string // "INSERT",
  session_variables?: any
  trace_context?: any
}

export type Treasury_SetProject_Event = {
  data: {
    new: Treasury_SetProject_Data | null
    old: Treasury_SetProject_Data | null
  }
  op: string // "INSERT",
  session_variables?: any
  trace_context?: any
}

export type Act_NewTask_Event = {
  data: {
    new: Act_NewTask_Data | null
    old: Act_NewTask_Data | null
  }
  op: string // "INSERT",
  session_variables?: any
  trace_context?: any
}

export type Act_CompleteTask_Event = {
    data: {
      new: Act_CompleteTask_Data | null
      old: Act_CompleteTask_Data | null
    }
    op: string // "INSERT",
    session_variables?: any
    trace_context?: any
}

export type Act_CancelTask_Event = {
    data: {
      new: Act_CancelTask_Data | null
      old: Act_CancelTask_Data | null
    }
    op: string // "INSERT",
    session_variables?: any
    trace_context?: any
}

export type Cashier_Redeem_Event = {
    data: {
      new: Cashier_Redeem_Data | null
      old: Cashier_Redeem_Data | null
    }
    op: string // "INSERT",
    session_variables?: any
    trace_context?: any
}

type IndexerTable = {
  name: string
  schema: string
}

type IndexerTrigger = {
  name: string
}

///////////////////////////////////////////////
//
// Indexer data
//
///////////////////////////////////////////////
export type Treasury_CollateralInit_Payload = {
  created_at: string // "2024-09-05T12:04:42.132337Z",
  delivery_info: DeliveryInfo
  event: Treasury_CollateralInit_Event
  id: string // "c72706f7-602b-41b5-aa3c-ad1998f06d75",
  table: IndexerTable
  trigger: IndexerTrigger
}

export type Treasury_CollateralAction_Payload = {
    created_at: string // "2024-09-05T12:04:42.132337Z",
    delivery_info: DeliveryInfo
    event: Treasury_CollateralAction_Event
    id: string // "c72706f7-602b-41b5-aa3c-ad1998f06d75",
    table: IndexerTable
    trigger: IndexerTrigger
}

export type Project_NewProject_Payload = {
  created_at: string // "2024-09-05T12:04:42.132337Z",
  delivery_info: DeliveryInfo
  event: Project_NewProject_Event
  id: string // "c72706f7-602b-41b5-aa3c-ad1998f06d75",
  table: IndexerTable
  trigger: IndexerTrigger
}

export type Project_SetSangha_Payload = {
  created_at: string // "2024-09-05T12:04:42.132337Z",
  delivery_info: DeliveryInfo
  event: Project_SetSangha_Event
  id: string // "c72706f7-602b-41b5-aa3c-ad1998f06d75",
  table: IndexerTable
  trigger: IndexerTrigger
}

export type Project_SetInitialLeader_Payload = {
  created_at: string // "2024-09-05T12:04:42.132337Z",
  delivery_info: DeliveryInfo
  event: Project_SetInitialLeader_Event
  id: string // "c72706f7-602b-41b5-aa3c-ad1998f06d75",
  table: IndexerTable
  trigger: IndexerTrigger
}

export type Treasury_Mint_Payload = {
    created_at: string // "2024-09-05T12:04:42.132337Z",
    delivery_info: DeliveryInfo
    event: Treasury_Mint_Event
    id: string // "c72706f7-602b-41b5-aa3c-ad1998f06d75",
    table: IndexerTable
    trigger: IndexerTrigger
}  

export type Treasury_SetProject_Payload = {
  created_at: string // "2024-09-05T12:04:42.132337Z",
  delivery_info: DeliveryInfo
  event: Treasury_SetProject_Event
  id: string // "c72706f7-602b-41b5-aa3c-ad1998f06d75",
  table: IndexerTable
  trigger: IndexerTrigger
}  

export type Act_NewTask_Payload = {
    created_at: string // "2024-09-05T12:04:42.132337Z",
    delivery_info: DeliveryInfo
    event: Act_NewTask_Event
    id: string // "c72706f7-602b-41b5-aa3c-ad1998f06d75",
    table: IndexerTable
    trigger: IndexerTrigger
}  

export type Act_CompleteTask_Payload = {
    created_at: string // "2024-09-05T12:04:42.132337Z",
    delivery_info: DeliveryInfo
    event: Act_CompleteTask_Event
    id: string // "c72706f7-602b-41b5-aa3c-ad1998f06d75",
    table: IndexerTable
    trigger: IndexerTrigger
}  

export type Act_CancelTask_Payload = {
    created_at: string // "2024-09-05T12:04:42.132337Z",
    delivery_info: DeliveryInfo
    event: Act_CancelTask_Event
    id: string // "c72706f7-602b-41b5-aa3c-ad1998f06d75",
    table: IndexerTable
    trigger: IndexerTrigger
}  

export type Cashier_Redeem_Payload = {
    created_at: string // "2024-09-05T12:04:42.132337Z",
    delivery_info: DeliveryInfo
    event: Cashier_Redeem_Event
    id: string // "c72706f7-602b-41b5-aa3c-ad1998f06d75",
    table: IndexerTable
    trigger: IndexerTrigger
}  

export const networkIdFromId = (id: string): number => {
  return parseInt(id.split('_')[0])
}

// export const isNftMint = (nftTransfer: NftTransferEventData): boolean => {
//   return nftTransfer.from === '0x0000000000000000000000000000000000000000'
// }

/*export const nftModelFromTransfer = (transfer: NftTransferEventData): NftType => {
  const networkId = networkIdFromId(transfer.id)
  let timestamp = 0
  if (isNftMint(transfer)) {
    timestamp = Math.floor(new Date(transfer.db_write_timestamp).getTime() / 1000)
  }

  const nft: NftType = {
    owner: transfer.to,
    networkId: networkId,
    tokenId: parseInt(transfer.tokenId),
    timestamp: timestamp,
    stableCoinAmount: BigInt(0),
    ustcPlusAmount: BigInt(0),
    initialStableCoinAmount: BigInt(0),
    initialUstcPlusAmount: BigInt(0),
  }

  return nft
}
*/