import { DidCommMediaSharingRecord, SharedMediaItem } from '@2060.io/credo-ts-didcomm-media-sharing'
import { JsonTransformer, type TagsBase, utils, type AgentContext } from '@credo-ts/core'
import { type DrizzleAdapterRecordValues } from '../../adapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleDidcommMediaSharingAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['didcommMediaSharing']>

export class DrizzleDidcommMediaSharingRecordAdapter extends BaseDrizzleRecordAdapter<
  DidCommMediaSharingRecord | any,
  typeof postgres.didcommMediaSharing,
  typeof postgres,
  typeof sqlite.didcommMediaSharing,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(
      database,
      { postgres: postgres.didcommMediaSharing, sqlite: sqlite.didcommMediaSharing },
      DidCommMediaSharingRecord,
      [],
      config
    )
  }

  public async getValues(record: DidCommMediaSharingRecord, agentContext?: AgentContext) {
    const { role, connectionId, threadId, parentThreadId, description, ...customTags } = record.getTags()

    const rawValues = {
      sentTime: record.sentTime,

      connectionId,
      threadId: threadId ?? utils.uuid(),
      parentThreadId,
      description: description ?? record?.description ?? null,

      role,
      state: record.state,

      items: record.items ? (JsonTransformer.toJSON(record.items) as SharedMediaItem[]) : null,

      metadata: record.metadata ? JsonTransformer.toJSON(record.metadata) : null,
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as any
  }

  public async toRecord(
    values: DrizzleDidcommMediaSharingAdapterValues,
    agentContext?: AgentContext
  ): Promise<DidCommMediaSharingRecord> {
    const { customTags, ...recordValues } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(recordValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, DidCommMediaSharingRecord)

    if (customTags) {
      record.setTags(customTags as TagsBase)
    }

    return record
  }
}
