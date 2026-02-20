import { JsonTransformer, type TagsBase, type AgentContext } from '@credo-ts/core'
import { DidCommBasicMessageRecord } from '@credo-ts/didcomm'
import {
  BaseDrizzleRecordAdapter,
} from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleDidcommBasicMessageAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['didcommBasicMessage']>

export class DrizzleDidcommBasicMessageRecordAdapter extends BaseDrizzleRecordAdapter<
  DidCommBasicMessageRecord,
  typeof postgres.didcommBasicMessage,
  typeof postgres,
  typeof sqlite.didcommBasicMessage,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(
      database,
      { postgres: postgres.didcommBasicMessage, sqlite: sqlite.didcommBasicMessage },
      DidCommBasicMessageRecord,
      [],
      config
    )
  }

  public async getValues(record: DidCommBasicMessageRecord, agentContext?: AgentContext) {
    const { role, connectionId, parentThreadId, threadId, ...customTags } = record.getTags()

    const rawValues = {
      content: record.content,
      sentTime: record.sentTime,

      connectionId,
      role,
      threadId,
      parentThreadId,
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as any
  }

  public async toRecord(
    values: DrizzleDidcommBasicMessageAdapterValues,
    agentContext?: AgentContext
  ): Promise<DidCommBasicMessageRecord> {
    const { customTags, ...remainingValues } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, DidCommBasicMessageRecord)
    record.setTags(customTags as TagsBase)

    return record
  }
}
