import { JsonTransformer, type TagsBase, type AgentContext } from '@credo-ts/core'
import { DidCommProofExchangeRecord } from '@credo-ts/didcomm'
import {
  BaseDrizzleRecordAdapter
} from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleDidcommProofExchangeAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['didcommProofExchange']>

export class DrizzleDidcommProofExchangeRecordAdapter extends BaseDrizzleRecordAdapter<
  DidCommProofExchangeRecord,
  typeof postgres.didcommProofExchange,
  typeof postgres,
  typeof sqlite.didcommProofExchange,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(
      database,
      { postgres: postgres.didcommProofExchange, sqlite: sqlite.didcommProofExchange },
      DidCommProofExchangeRecord,
      [],
      config
    )
  }

  public async getValues(record: DidCommProofExchangeRecord, agentContext?: AgentContext): Promise<DrizzleDidcommProofExchangeAdapterValues> {
    const { role, connectionId, parentThreadId, threadId, state, ...customTags } = record.getTags()

    const rawValues = {
      connectionId,
      threadId,
      protocolVersion: record.protocolVersion,
      parentThreadId,
      isVerified: record.isVerified,
      state,
      role,
      autoAcceptProof: record.autoAcceptProof,
      errorMessage: record.errorMessage,
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as any
  }

  public async toRecord(
    values: DrizzleDidcommProofExchangeAdapterValues,
    agentContext?: AgentContext
  ): Promise<DidCommProofExchangeRecord> {
    const { customTags, ...remainingValues } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, DidCommProofExchangeRecord)
    record.setTags(customTags as TagsBase)

    return record
  }
}
