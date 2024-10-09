import { gql, Client, cacheExchange, fetchExchange } from '@urql/core'
import { Cron } from 'croner'
import {
    Treasury_CollateralInit_Data,
    Treasury_CollateralAction_Data,
    Project_NewProject_Data,
    Project_SetSangha_Data,
    Treasury_Mint_Data,
    Act_NewTask_Data,
    Act_CompleteTask_Data,
    Act_CancelTask_Data,
    Cashier_Redeem_Data,
  networkIdFromId,
  Project_SetInitialLeader_Data,
  Treasury_SetProject_Data,
} from './indexer_types'
import { getIndexes, LastIndexes, updateIndexTimestamps } from './indexer/index'
import { createCollateral, getCollateral, updateCollateral } from './indexer/collateral'
import { ActModel, CollateralModel, IndexedEventType, LinkedWalletModel, ProjectV1Model, TaskV1Model, UserScenarioModel } from './models'
import { getTaskTime, isSupportedNetworkId, symbolOf } from './blockchain'
import { createProjectV1, getProjectV1ByCheck, getProjectV1ByNetwork, updateProjectV1 } from './models/projects'
import { getLinkWalletByWalletAddress } from './models/users'
import { AraDiscussion, LinkedWallet, LungtaLinks } from './types'
import { ObjectId, WithId } from 'mongodb'
import { createPlan } from './models/maydone'
import { createAct, createActPost } from './models/act'
import { createTaskV1, getTaskV1, updateTaskV1 } from './models/tasks'

// **** Setup **** //

const graphqlClient = new Client({
  url: process.env.INDEXER_URL!,
  exchanges: [cacheExchange, fetchExchange],
})

// Memory Cache, the Events in the same log as NewProject comes first.
// However they will be active only if NewProject is called.
var inMemoryTreasurySetProjects: {[key: string]: Treasury_SetProject_Data} = {};
var inMemoryProjectSetInitialLeader: {[key: string]: Project_SetInitialLeader_Data} = {};
var inMemoryProjectSetSangha: {[key: string]: Project_SetSangha_Data} = {};
var inMemoryTreasuryMint: {[key: string]: Treasury_Mint_Data} = {};

type Events = {
  // Ara Sangha operations: such as adding collateral support in treasury
  TreasuryV1_CollateralVotingInit?: Treasury_CollateralInit_Data[]
  TreasuryV1_CollateralVotingAction?:  Treasury_CollateralAction_Data[],

  // All following events are executed when a maintainer starts a new project.
  TreasuryV1_SetProject?: Treasury_SetProject_Data[],
  ProjectV1_NewProject?: Project_NewProject_Data[],
  ProjectV1_SetSangha?: Project_SetSangha_Data[],
  ProjectV1_SetInitialLeader?: Project_SetInitialLeader_Data[],

  // Investor function
  TreasuryV1_Mint?: Treasury_Mint_Data[],

  // Development functions between maintainer and contributor
  ActV1_NewTask?: Act_NewTask_Data[],
  ActV1_CompleteTask?: Act_CompleteTask_Data[],
  ActV1_CancelTask?: Act_CancelTask_Data[],

  // Contributor's function
  CashierV1_Redeem?: Cashier_Redeem_Data[],
}

let lastIndexes: LastIndexes = {};

const job = Cron(
  /* The pattern */
  '*/5 * * * * *',
  /* Function (optional) */
  async () => {
    job.pause()
    let events = await fetchFromGraphql()
    if (events === undefined) {
      job.resume()
      console.error(`Fetching from graphql failed trying again later`)
      return
    }

    for (const eventTypeRaw in events) {
      let eventType: IndexedEventType = eventTypeRaw as IndexedEventType
      if (events[eventType] === undefined || events[eventType].length === 0) {
        continue;
      }
      console.log(`There are ${events[eventType].length} ${eventTypeRaw} events...`)

      let lastIndex: string = '';

      for (let event of events[eventType]!) {
        const networkId = networkIdFromId(event.id);
        if (!isSupportedNetworkId(networkId)) {
          continue;
        }

        if (eventTypeRaw === 'TreasuryV1_CollateralVotingInit') {
          const processed = await processCollateralInit(event as Treasury_CollateralInit_Data)
          if (typeof processed === 'string') {
            console.warn(`Collateral was not parsed parse it yourself:`)
            console.log(event)
          } else if (processed === undefined) {
            console.warn(`Collateral was already added, skipping`)
          }
        } else if (eventTypeRaw === 'TreasuryV1_CollateralVotingAction') {
          const processed = await processCollateralAction(event as Treasury_CollateralAction_Data)
              if (typeof processed === 'string') {
                console.warn(`Collateral was not parsed parse it yourself:`)
                console.log(event)
              } else if (processed === undefined) {
                console.warn(`Collateral was updated, skipping`)
              }
        } else if (eventTypeRaw === 'ProjectV1_NewProject') {
          await processNewProject(event as Project_NewProject_Data)
        } else if (eventTypeRaw === 'TreasuryV1_SetProject') {
          await processSetProjectInTreasury(event as Treasury_SetProject_Data)
        } else if (eventTypeRaw === 'ProjectV1_SetInitialLeader') {
          await processSetProjectLeader(event as Project_SetInitialLeader_Data)
        } else if (eventTypeRaw === 'ProjectV1_SetSangha') {
          await processSetProjectSangha(event as Project_SetSangha_Data)          
        } else if (eventTypeRaw === 'TreasuryV1_Mint') {
          const processed = await processMintOwnership(event as Treasury_Mint_Data)
          if (!processed) {
            console.warn(`TreasuryV1_Mint was not parsed parse it yourself:`)
            console.log(event)
            continue;
          }
        } else if (eventTypeRaw === 'CashierV1_Redeem') {
          const processed = await processCashierRedeem(event as Cashier_Redeem_Data)
          if (!processed) {
            console.warn(`CashierV1_Redeem was not parsed parse it yourself:`)
            console.log(event)
            continue;
          }
        } else if (eventTypeRaw === 'ActV1_NewTask') {
          const processed = await processNewTask(event as Act_NewTask_Data)
          if (!processed) {
            console.warn(`ActV1_NewTask was not parsed parse it yourself:`)
            console.log(event)
          }
        } else if (eventTypeRaw === 'ActV1_CompleteTask') {
          const processed = await processCompleteTask(event as Act_CompleteTask_Data)
          if (!processed) {
            console.warn(`ActV1_CompleteTask was not parsed parse it yourself:`)
            console.log(event)
          }
        } else if (eventTypeRaw === 'ActV1_CancelTask') {
          const processed = await processCancelTask(event as Act_CancelTask_Data)
          if (!processed) {
            console.warn(`ActV1_CancelTask was not parsed parse it yourself:`)
            console.log(event)
          }
        } else {
          continue;
        }
        
        lastIndex = event.db_write_timestamp
      }

      if (lastIndex.length > 0 && lastIndex !== lastIndexes[eventType]?.db_timestamp) {
        lastIndexes[eventType]!.db_timestamp = lastIndex;
        const updated = await updateIndexTimestamps(lastIndexes[eventType]!)
        if (!updated) {
          console.error(`Failed to update timestamp ${eventType}`)
        }
      }
    }

    job.resume()
  },
  { paused: true }
)

export const startTracking = async () => {
  console.log(`[Scheduler] Starting an indexer of smartcontract events`)
  let lastIndexesFromDb = await getIndexes();
  if (typeof lastIndexesFromDb === 'string') {
    throw `Failed to get last indexes: ${lastIndexesFromDb}`
  }
  lastIndexes = lastIndexesFromDb;

  job.resume()
}

const fetchFromGraphql = async (): Promise<Events | undefined> => {
    /*
    CashierV1_Redeem: Cashier_Redeem_Data[],
    */

  const QUERY = gql`{
    TreasuryV1_CollateralVotingInit(where: {db_write_timestamp: {_gt: "${lastIndexes.TreasuryV1_CollateralVotingInit!.db_timestamp}"}}, order_by: {db_write_timestamp: asc}, limit: 59) {
        decimals
        feedDecimals
        feed
        id
        initializer
        token
        db_write_timestamp
    }

    TreasuryV1_CollateralVotingAction(where: {db_write_timestamp: {_gt: "${lastIndexes.TreasuryV1_CollateralVotingAction!.db_timestamp}"}}, order_by: {db_write_timestamp: asc}, limit: 59) {
        agree
        id
        token
        db_write_timestamp
    }

    ProjectV1_NewProject(
        where: { db_write_timestamp: { _gt: "${lastIndexes.ProjectV1_NewProject!.db_timestamp}" } }
        limit: 50
        order_by: { db_write_timestamp: asc }
      ) {
        project_0
        project_1
        project_2
        project_3
        project_4
        project_5
        project_6
        project_7
        project_8
        project_9
        projectId
        id
        db_write_timestamp
    }

    ProjectV1_SetSangha(
        where: { db_write_timestamp: { _gt: "${lastIndexes.ProjectV1_SetSangha!.db_timestamp}" } }
        limit: 50
        order_by: { db_write_timestamp: asc }
      ) {
        projectId
        id
        db_write_timestamp
        project_0
        project_1
        project_2
    }

    ProjectV1_SetInitialLeader(
        where: { db_write_timestamp: { _gt: "${lastIndexes.ProjectV1_SetInitialLeader!.db_timestamp}" } }
        limit: 50
        order_by: { db_write_timestamp: asc }
      ) {
        projectId
        id
        db_write_timestamp
        initialLeader
    }

    TreasuryV1_SetProject(
        where: { db_write_timestamp: { _gt: "${lastIndexes.TreasuryV1_SetProject!.db_timestamp}" }}
        limit: 50
        order_by: { db_write_timestamp: asc }
      ) {
        tokenAmount
        usdAmount
        projectId
        id
        db_write_timestamp
    }

    TreasuryV1_Mint(
        where: { db_write_timestamp: { _gt: "${lastIndexes.TreasuryV1_Mint!.db_timestamp}" }}
        limit: 50
        order_by: { db_write_timestamp: asc }
      ) {
        collateralAmount
        ownershipAmount
        projectId_
        usdAmount
        collateral
        id
        ownershipToken
        to
        db_write_timestamp
    }
  
    ActV1_NewTask(
        where: { db_write_timestamp: { _gt: "${lastIndexes.ActV1_NewTask!.db_timestamp}" } }
        limit: 50
        order_by: { db_write_timestamp: asc }
      ) {
        checkAmount_
        projectId
        taskId
        id
        payload
        db_write_timestamp
    }

    ActV1_CompleteTask(
        where: { db_write_timestamp: { _gt: "${lastIndexes.ActV1_CompleteTask!.db_timestamp}" } }
        limit: 50
        order_by: { db_write_timestamp: asc }
      ) {
        projectId
        taskId
        contributor
        id
        payload
        db_write_timestamp
    }

    ActV1_CancelTask(
        where: { db_write_timestamp: { _gt: "${lastIndexes.ActV1_CancelTask!.db_timestamp}" } }
        limit: 50
        order_by: { db_write_timestamp: asc }
      ) {
        projectId
        taskId
        id
        payload
        db_write_timestamp
    }

    CashierV1_Redeem(
        where: { db_write_timestamp: { _gt: "${lastIndexes.CashierV1_Redeem!.db_timestamp}" } }
        limit: 50
        order_by: { db_write_timestamp: asc }
      ) {
        collateralAmount
        usdAmount
        check
        collateral
        id
        to
        db_write_timestamp
    }
}
`
  const result = await graphqlClient.query(QUERY, {}, { requestPolicy: 'network-only' }).toPromise()
  if (result.error) {
    console.error(result.error)
    return
  }
  const events: Events = {}
  events['TreasuryV1_CollateralVotingInit'] = result.data['TreasuryV1_CollateralVotingInit'] as Treasury_CollateralInit_Data[]
  events['TreasuryV1_CollateralVotingAction'] = result.data['TreasuryV1_CollateralVotingAction'] as Treasury_CollateralAction_Data[]
  events['TreasuryV1_Mint'] = result.data['TreasuryV1_Mint'] as Treasury_Mint_Data[]
  events['TreasuryV1_SetProject'] = result.data['TreasuryV1_SetProject'] as Treasury_SetProject_Data[]
  events['ProjectV1_NewProject'] = result.data['ProjectV1_NewProject'] as Project_NewProject_Data[]
  events['ProjectV1_SetSangha'] = result.data['ProjectV1_SetSangha'] as Project_SetSangha_Data[]
  events['ProjectV1_SetInitialLeader'] = result.data['ProjectV1_SetInitialLeader'] as Project_SetInitialLeader_Data[]
  events['ActV1_NewTask'] = result.data['ActV1_NewTask'] as Act_NewTask_Data[]
  events['ActV1_CompleteTask'] = result.data['ActV1_CompleteTask'] as Act_CompleteTask_Data[]
  events['ActV1_CancelTask'] = result.data['ActV1_CancelTask'] as Act_CancelTask_Data[]
  events['CashierV1_Redeem'] = result.data['CashierV1_Redeem'] as Cashier_Redeem_Data[]

  return events
}

const processCollateralInit = async (
  data: Treasury_CollateralInit_Data
): Promise<string | undefined | CollateralModel> => {
    const networkId = networkIdFromId(data.id)

    let cachedMinting = await getCollateral(data.token, networkId)
    if (cachedMinting !== undefined) {
        console.log(`The collateral ${data.token} on ${networkId} network is processed`)
        return;
    }

    const symbol = await symbolOf(data.token, networkId);

    let dataToAdd: CollateralModel = {
        decimals: data.decimals,
        feedDecimals: data.feedDecimals,
        feed: data.feed, // chain link "0xEca2605f0BCF2BA5966372C99837b1F182d3D620",
        initializer: data.initializer, // author "0x80Cbc1f7fd60B7026C0088e5eD58Fc6Ce1180141",
        token: data.token, // token "0xE1EA187d652A4496285A971d40bfc346BDf9b854",
        symbol: symbol, // USDT
        networkId: networkId,
        approved: false,
        araTreasuryBalance: "0"
    }
    let result = await createCollateral(dataToAdd)
    if (typeof result === 'string') {
        console.error(`Failed to add collateral to database`)
        console.error(dataToAdd)
        console.error(result)
        return result
    }
    return result
}

const processCollateralAction = async (
    data: Treasury_CollateralAction_Data
  ): Promise<string | undefined> => {
    const networkId = networkIdFromId(data.id)
  
    let cached = await getCollateral(data.token, networkId)
    if (typeof cached === 'string') {
      return `getCollateral: ${cached}`;
    }
    
    if (cached === undefined) {
        return `The collateral not found ${data.token} on ${networkId} network is processed`;
    }
  
    // Already updated its status, so let's skip it
    if (cached.approved === data.agree) {
        return undefined;
    }

    cached.approved = data.agree;
    let result = await updateCollateral(cached)
    if (typeof result === 'string') {
        console.error(`Failed to add collateral to database`)
        console.error(cached)
        console.error(result)
        return result
    }
    if (!result) {
        return `Failed to update the collateral ${cached.token} on ${cached.networkId} network status to ${data.agree}`;
    }
}

/**
 * This event updates the project's ownership token max supply.
 * Requires ProjectV1_NewProject event call first
 * @param data 
 * @returns 
 */
const processSetProjectInTreasury = async (data: Treasury_SetProject_Data): Promise<undefined> => {
  const networkId = networkIdFromId(data.id)
  const projectId = parseInt(data.projectId)

  let cashed = await getProjectV1ByNetwork(projectId, networkId)
  if (cashed === undefined) {
    console.error(`processSetProjectInTreasury: Project ${projectId} on ${networkId} network not found, skipping max supply`)
    inMemoryTreasurySetProjects[`${networkId}_${projectId}`] = data;
    return undefined
  }
  if (typeof (cashed) === 'string') {
    console.error(`processSetProjectInTreasury: Project ${projectId} on ${networkId} fetch failed: ${cashed}`);
    return;
  }
  let projectV1 = cashed as WithId<ProjectV1Model>;
  projectV1.sangha!.ownership_max_supply = data.tokenAmount!;

  // We will skip the sangha post
  const updated = await updateProjectV1(projectV1);
  if (typeof(updated) === 'string') {
    console.error(`Failed to update project ${JSON.stringify(projectV1)}: ${updated}`);
  }

  return undefined;
}

/**
 * This event sets the main maintainer of the project.
 * Requires ProjectV1_NewProject event call first
 * Requires call of POST ara-server.com/users/wallet/:username first
 * @param data 
 * @returns 
 */
const processSetProjectLeader = async (data: Project_SetInitialLeader_Data): Promise<undefined> => {
  const networkId = networkIdFromId(data.id)
  const projectId = parseInt(data.projectId)

  let cashed = await getProjectV1ByNetwork(projectId, networkId)
  if (cashed === undefined) {
    console.log(`processSetProjectLeader: Project ${projectId} on ${networkId} network not found`)
    inMemoryProjectSetInitialLeader[`${networkId}_${projectId}`] = data;
    return undefined
  }
  if (typeof (cashed) === 'string') {
    console.log(`processSetProjectLeader: Project ${projectId} on ${networkId} fetch failed: ${cashed}`);
    return;
  }
  let projectV1 = cashed as WithId<ProjectV1Model>;

  const linkedWallet = await getLinkWalletByWalletAddress(data.initialLeader);
  if (typeof (linkedWallet) === 'string') {
    console.error(`Failed to get linked wallet address for ${data.initialLeader}: ${linkedWallet}`);
    return;
  }
  if ((linkedWallet as LinkedWalletModel).userId === 0) {
    console.error(`wallet not linked`);
    return;
  }

  projectV1.leader = linkedWallet as LinkedWallet;

  // We will skip the sangha post
  const updated = await updateProjectV1(projectV1);
  if (typeof(updated) === 'string') {
    console.error(`Failed to update project ${JSON.stringify(projectV1)}: ${updated}`);
  }

  return undefined;
}

/**
 * This event updates the project's sangha tokens.
 * Requires ProjectV1_NewProject event call first.
 * @param data 
 * @returns 
 */
const processSetProjectSangha = async (data: Project_SetSangha_Data): Promise<undefined> => {
  const networkId = networkIdFromId(data.id)
  const projectId = parseInt(data.projectId)

  let cashed = await getProjectV1ByNetwork(projectId, networkId)
  if (cashed === undefined) {
    console.log(`processSetProjectSangha: Project ${projectId} on ${networkId} network not found skip it`)
    inMemoryProjectSetSangha[`${networkId}_${projectId}`] = data;
    return undefined
  }
  if (typeof (cashed) === 'string') {
    console.log(`processSetProjectSangha: Project ${projectId} on ${networkId} fetch failed: ${cashed}`);
    return;
  }
  let projectV1 = cashed as WithId<ProjectV1Model>;
  projectV1.sangha!.ownership = data.project_0;
  projectV1.sangha!.maintainer = data.project_1;
  projectV1.sangha!.check = data.project_2;

  projectV1.sangha!.ownershipSymbol = await symbolOf(projectV1.sangha!.ownership!, networkId);
  projectV1.sangha!.maintainerSymbol = `${projectV1.sangha!.ownershipSymbol}m`;
  projectV1.sangha!.checkSymbol = `${projectV1.sangha!.ownershipSymbol}c`;

  // We will skip the sangha post
  const updated = await updateProjectV1(projectV1);
  if (typeof(updated) === 'string') {
    console.error(`Failed to update project ${JSON.stringify(projectV1)}: ${updated}`);
  }

  return undefined;
}

/**
 * @todo first, add test client's link wallet.
 * @todo first, link the user ahmetson to the 0x...41
 * 
 * Lastly, a leader puts the welcome page
 * @param data 
 * @returns 
 * 
 * @todo add TreasuryV1_SetProject() and update project's sangha.ownership_max_supply by SetProject.cap
 */
const processNewProject = async (data: Project_NewProject_Data): Promise<undefined> => {
  const networkId = networkIdFromId(data.id)
  const projectId = parseInt(data.projectId)

  let cashed = await getProjectV1ByNetwork(projectId, networkId)
  if (typeof(cashed) === 'string') {
    console.error(`Project ${projectId} on ${networkId} network not found`);
    return undefined;
  }

  if (cashed !== undefined) {
    console.error(`Project ${projectId} on ${networkId} network already parsed skip it`)
    return undefined;
  }

  const lungtaLinks: LungtaLinks = {};

  const logos: AraDiscussion = JSON.parse(data.project_2.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  );
  const aurora: UserScenarioModel = JSON.parse(data.project_3.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  );
  lungtaLinks.aurora_id = new ObjectId(aurora._id);
  lungtaLinks.logos_id = logos.id;

  let dataToAdd: ProjectV1Model = {
    projectId,
    networkId,
    sangha: {
        ownership_minted: "0",
    },
    lungta: lungtaLinks,
    project_name: data.project_1,

    leader: undefined,
  }
  const projectV1 = await createProjectV1(dataToAdd);
  if (typeof projectV1 === 'string') {
    console.error(`Failed to create project in database: ${JSON.stringify(dataToAdd)}: ${projectV1}`);
    return;
  }

  // lets add plan, act and sangha pages
  const plan = await createPlan({project_id: projectV1._id!, cost_usd: data.project_5})
  if (typeof plan === 'string') {
    console.error(`Failed to create plan in database: ${JSON.stringify(dataToAdd)}: ${plan}`);
    return;
  }
  projectV1.lungta!.maydone_id = plan._id!;

  // let's add act
  const actData: ActModel = {
    project_id: projectV1._id!,
    tech_stack: data.project_4,
    source_code_url: data.project_7,
    test_url: data.project_8,
    start_time: data.project_9,
    duration: data.project_6,
  }
  let act = await createActPost(projectV1, actData);
  if (typeof(act) === 'string') {
    console.log(`Failed to create a forum post ${JSON.stringify(actData)}: ${act}`);
  }
  act = await createAct(act as ActModel)
  if (typeof(act) === 'string') {
    console.error(`Failed to create act in database: ${JSON.stringify(actData)}: ${act}`);
    return
  }
  projectV1.lungta!.act_id = act._id!;

  // We will skip the sangha post
  const updated = await updateProjectV1(projectV1);
  if (typeof(updated) === 'string') {
    console.error(`Failed to update project ${JSON.stringify(projectV1)}: ${updated}`);
  }

  // If we have in memory parameters of project that came earlier, then add them.
  const key = `${networkId}_${projectId}`
  if (inMemoryProjectSetInitialLeader[key] !== undefined) {
    await processSetProjectLeader(inMemoryProjectSetInitialLeader[key])
    delete inMemoryProjectSetInitialLeader[key]
  }
  if (inMemoryProjectSetSangha[key] !== undefined) {
    await processSetProjectSangha(inMemoryProjectSetSangha[key])
    delete inMemoryProjectSetSangha[key]
  }
  if (inMemoryTreasurySetProjects[key] !== undefined) {
    await processSetProjectInTreasury(inMemoryTreasurySetProjects[key])
    delete inMemoryTreasurySetProjects[key]
  }
  if (inMemoryTreasuryMint[key] !== undefined) {
    await processMintOwnership(inMemoryTreasuryMint[key])
    delete inMemoryTreasuryMint[key]
  }

  return undefined;
}

/**
 * Mint ownership token updates the treasury balance and tracks the project's tracked tokens amount.
 * @param data 
 * @returns 
 */
const processMintOwnership = async (data: Treasury_Mint_Data): Promise<boolean> => {
  const networkId = networkIdFromId(data.id)
  const projectId = data.projectId_;

  let cashed = await getProjectV1ByNetwork(projectId, networkId)
  if (typeof(cashed) === 'string') {
    console.error(`processMintOwnership: Project ${projectId} on ${networkId} network error: ${cashed}`);
    return false;
  }

  if (cashed === undefined) {
    console.error(`processMintOwnership: Project ${projectId} on ${networkId} netwok not found. Skip it.`)
    inMemoryTreasuryMint[`${networkId}_${projectId}`] = data;
    return true
  }
  const projectV1 = cashed as WithId<ProjectV1Model>

  let collateral = await getCollateral(data.collateral, networkId)
  if (typeof collateral === 'string') {
    console.error(`processMintOwnership: getCollateral: ${collateral}`);
    return false;
  }
  
  if (collateral === undefined) {
      console.error(`The collateral ${data.collateral} on ${networkId} network is not found`);
      return false;
  }

  // Already updated its status, so let's skip it
  if (!collateral.approved) {
    console.error(`The collateral ${data.collateral} on ${networkId} network is not approved yet`);
    return false;
  }

  projectV1.sangha!.ownership_minted = (BigInt(projectV1.sangha!.ownership_minted!) + BigInt(data.ownershipAmount)).toString()
  collateral.araTreasuryBalance = (BigInt(collateral.araTreasuryBalance) + BigInt(data.collateralAmount)).toString();

  const updated = await updateProjectV1(projectV1)
  if (typeof updated === 'string') {
    console.error(`processMintOwnership failed to update project ${data.projectId_} on ${networkId}: ${updated}`);
    return false
  }

  const collateralUpdated = await updateCollateral(collateral);
  if (typeof collateralUpdated === 'string') {
    console.error(`processMintOwnership failed to update collateral ${data.collateral} on ${networkId}: ${collateralUpdated}`);
    return false;
  }

  if (!collateralUpdated) {
    console.error(`processMintOwnership updating collateral ${data.collateral} on ${networkId} returned false`);
    return false;
  }

  return true
}

/**
 * Mint ownership token updates the treasury balance and tracks the project's tracked tokens amount.
 * @param data 
 * @returns 
 */
const processCashierRedeem = async (data: Cashier_Redeem_Data): Promise<boolean> => {
  const networkId = networkIdFromId(data.id)

  const projectV1 = await getProjectV1ByCheck(data.check, networkId)
  if (typeof(projectV1) === 'string') {
    console.error(`processCashierRedeem failed to get project on ${networkId} network that has ${data.check} contributor token`);
    return false;
  }
  if (projectV1 === undefined) {
    return true;
  }

  let collateral = await getCollateral(data.collateral, networkId)
  if (typeof collateral === 'string') {
    console.error(`processMintOwnership: getCollateral: ${collateral}`);
    return false;
  }
  
  if (collateral === undefined) {
      console.error(`The collateral ${data.collateral} on ${networkId} network is not found`);
      return false;
  }

  // Already updated its status, so let's skip it
  if (!collateral.approved) {
    console.error(`The collateral ${data.collateral} on ${networkId} network is not approved yet`);
    return false;
  }
  collateral.araTreasuryBalance = (BigInt(collateral.araTreasuryBalance) - BigInt(data.collateralAmount)).toString();

  const collateralUpdated = await updateCollateral(collateral);
  if (typeof collateralUpdated === 'string') {
    console.error(`processMintOwnership failed to update collateral ${data.collateral} on ${networkId}: ${collateralUpdated}`);
    return false;
  }

  if (!collateralUpdated) {
    console.error(`processMintOwnership updating collateral ${data.collateral} on ${networkId} returned false`);
    return false;
  }

  return true
}

/**
 * Mint ownership token updates the treasury balance and tracks the project's tracked tokens amount.
 * @param data 
 * @returns 
 */
const processNewTask = async (data: Act_NewTask_Data): Promise<boolean> => {
  const networkId = networkIdFromId(data.id)

  const projectId = data.projectId;

  let cashed = await getProjectV1ByNetwork(projectId, networkId)
  if (typeof(cashed) === 'string') {
    console.error(`Project ${projectId} on ${networkId} network not found`);
    return false;
  }

  if (cashed === undefined) {
    return true
  }
  const projectV1 = cashed as WithId<ProjectV1Model>

  const taskV1 = await getTaskV1(projectV1._id, data.taskId);
  if (typeof taskV1 === 'string') {
    console.error(`processNewTask failed to get ${data.projectId} project task ${data.taskId}: ${taskV1}`);
    return false;
  }

  if (taskV1 !== undefined) {
    console.error(`Task already exists, skipping`);
    return true;
  }

  // now let's get the task times
  const taskTimes = await getTaskTime(data.projectId, data.taskId, networkId);
  if (typeof taskTimes === 'string') {
    console.log(`getTaskTime(${data.projectId}, ${data.taskId}, ${networkId}): ${taskTimes}`);
    return false;
  }
  const dataToAdd: TaskV1Model = {
    projectId: projectV1._id,
    taskId: data.taskId,
    checkAmount: data.checkAmount_,
    startTime: taskTimes.startTime,
    endTime: taskTimes.endTime,
    payload: data.payload,
    completed: false,
    canceled: false,
  }

  const created = await createTaskV1(dataToAdd);
  if (typeof(created) === 'string') {
    console.error(`Failed to create a task: ${created}`);
    return false;
  }

  return true
}

const processCompleteTask = async (data: Act_CompleteTask_Data): Promise<boolean> => {
  const networkId = networkIdFromId(data.id)

  const projectId = data.projectId;

  let cashed = await getProjectV1ByNetwork(projectId, networkId)
  if (typeof(cashed) === 'string') {
    console.error(`Project ${projectId} on ${networkId} network not found`);
    return false;
  }

  if (cashed === undefined) {
    return true
  }
  const projectV1 = cashed as WithId<ProjectV1Model>

  const taskV1 = await getTaskV1(projectV1._id, data.taskId);
  if (typeof taskV1 === 'string') {
    console.error(`processCompleteTask failed to get ${data.projectId} project task ${data.taskId}: ${taskV1}`);
    return false;
  }

  if (taskV1 === undefined) {
    console.error(`Task doesn't exist, cant complete it`);
    return false;
  }

  if (taskV1.completed) {
    console.warn(`Task already completed, so let's skip it`);
    return true;
  }

  taskV1.completed = true;

  const updated = await updateTaskV1(taskV1);
  if (typeof(updated) === 'string') {
    console.error(`Failed to update a task: ${updated}`);
    return false;
  }
  if (!updated) {
    console.error(`Task was not updated ${JSON.stringify(taskV1)}. Update manually`);
  }

  return true
}

const processCancelTask = async (data: Act_CancelTask_Data): Promise<boolean> => {
  const networkId = networkIdFromId(data.id)

  const projectId = data.projectId;

  let cashed = await getProjectV1ByNetwork(projectId, networkId)
  if (typeof(cashed) === 'string') {
    return false;
  }

  if (cashed === undefined) {
    return true
  }
  const projectV1 = cashed as WithId<ProjectV1Model>

  const taskV1 = await getTaskV1(projectV1._id, data.taskId);
  if (typeof taskV1 === 'string') {
    console.error(`processCancelTask failed to get ${data.projectId} project task ${data.taskId}: ${taskV1}`);
    return false;
  }

  if (taskV1 === undefined) {
    console.error(`Task doesn't exist, cant complete it`);
    return false;
  }

  if (taskV1.canceled) {
    console.warn(`Task already completed, so let's skip it`);
    return true;
  }

  taskV1.canceled = true;

  const updated = await updateTaskV1(taskV1);
  if (typeof(updated) === 'string') {
    console.error(`Failed to update a task: ${updated}`);
    return false;
  }
  if (!updated) {
    console.error(`Task was not updated ${JSON.stringify(taskV1)}. Update manually`);
  }

  return true
}

