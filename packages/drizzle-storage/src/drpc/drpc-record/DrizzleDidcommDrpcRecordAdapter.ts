import { JsonTransformer, type TagsBase, type AgentContext } from '@credo-ts/core'
import { DrpcRecord } from '@credo-ts/drpc'
import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleDidcommDrpcAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['didcommDrpc']>

export class DrizzleDidcommDrpcRecordAdapter extends BaseDrizzleRecordAdapter<
  DrpcRecord,
  typeof postgres.didcommDrpc,
  typeof postgres,
  typeof sqlite.didcommDrpc,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(database, { postgres: postgres.didcommDrpc, sqlite: sqlite.didcommDrpc }, DrpcRecord, [], config)
  }

  public async getValues(record: DrpcRecord, agentContext?: AgentContext) {
    const { connectionId, threadId, ...customTags } = record.getTags()

    const rawValues = {
      threadId,
      connectionId,
      state: record.state,
      role: record.role,
      request: record.request,
      response: record.response,
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as any
  }

  public async toRecord(
    values: DrizzleDidcommDrpcAdapterValues,
    agentContext?: AgentContext
  ): Promise<DrpcRecord> {
    const { customTags, ...remainingValues } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, DrpcRecord)
    if (customTags) record.setTags(customTags as TagsBase)

    return record
  }
}
