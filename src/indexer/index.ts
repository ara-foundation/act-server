// testing the leaderboard with the fake data
import { collections } from '../db'
import { LastIndexTimestampModel, IndexedEventType, EventTypes } from '../models'

export const defaultTimestamp = '2024-09-04T13:39:30.681834'

export type LastIndexes = {
  [key in IndexedEventType]?: LastIndexTimestampModel
}

export const addIndexTimestamps = async (event_type: IndexedEventType): Promise<string | LastIndexTimestampModel> => {
  // Everything started at latest on 4th september 2024
  const lastIndexTimestamp: LastIndexTimestampModel = {
    db_timestamp: defaultTimestamp,
    event_type: event_type,
  }

  // put the data
  try {
    const dbResult = await collections.indexes?.insertOne(lastIndexTimestamp)

    if (!dbResult) {
      return 'failed to indexer'
    } else {
      return lastIndexTimestamp
    }
  } catch (error) {
    return JSON.stringify(error)
  }
}

export const getIndexes = async(): Promise<string | LastIndexes> => {
  const indexes: LastIndexes = {}
  for (const EventType of EventTypes) {
    indexes[EventType] = {
      db_timestamp: defaultTimestamp,
      event_type: EventType,
    } as LastIndexTimestampModel
  }
  
  try {
    const found = await collections.indexes?.find({}).toArray();
    // already exists
    if (found === undefined) {
      console.log(`No indexes`);

      return indexes
    }

    for (const lastIndex of found) {
      indexes[lastIndex.event_type] = lastIndex;
    }

    return indexes;
  } catch (error) {
    return `failed to get indexes: ${error}`
  }
}

export const getIndexTimestamps = async (event_type: IndexedEventType): Promise<undefined | LastIndexTimestampModel> => {
  let query = {
    event_type: event_type,
  }

  try {
    const found = await collections.indexes?.findOne(query)
    // already exists
    if (found === null || found === undefined) {
      return undefined
    } else {
      return found as LastIndexTimestampModel
    }
  } catch (error) {
    return undefined
  }
}

export const updateIndexTimestamps = async (
  lastIndex: LastIndexTimestampModel
): Promise<boolean> => {
  let query = {
    event_type: lastIndex.event_type,
  }

  try {
    const found = await collections.indexes?.replaceOne(query, lastIndex, {upsert: true})
    // already exists
    if (found === null || found === undefined) {
      console.log(`Failed to update last index`);
      return false
    } else {
      return found.acknowledged
    }
  } catch (error) {
    console.error(error)
    return false
  }
}
