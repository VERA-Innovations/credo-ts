import { JsonTransformer, utils, type TagsBase, type AgentContext } from '@credo-ts/core'
import { type DrizzleAdapterRecordValues } from '../../adapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { PrivateMediaItem } from '../PrivateMediaTypes'
import { PrivateMediaRecord } from '../PrivateMediaTypes'
import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleDidcommPrivateMediaSharingAdapterValues =
  DrizzleAdapterRecordValues<(typeof sqlite)['didcommPrivateMediaSharing']>

export class DrizzleDidcommPrivateMediaSharingRecordAdapter extends BaseDrizzleRecordAdapter<
  PrivateMediaRecord,
  typeof postgres.didcommPrivateMediaSharing,
  typeof postgres,
  typeof sqlite.didcommPrivateMediaSharing,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(
      database,
      { postgres: postgres.didcommPrivateMediaSharing, sqlite: sqlite.didcommPrivateMediaSharing },
      PrivateMediaRecord, [], config
    )
  }

  public async getValues(record: PrivateMediaRecord, agentContext?: AgentContext) {
    const {
      userId,
      mediaType,
      isPublic,
      sharedWith,
      ...customTags
    } = record.getTags()

    const rawValues = {
      /** BaseRecord fields handled by BaseDrizzleRecordAdapter */
      userId,
      mediaType,
      isPublic,
      sharedWith,
      threadId: record.threadId ?? utils.uuid(),
      parentThreadId: record.parentThreadId ?? null,
      description: record.description ?? null,
      items: record.items
        ? (JsonTransformer.toJSON(record.items) as PrivateMediaItem[])
        : null,
      version: String(record.version ?? 1),
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as any
  }

  public async toRecord(
    values: DrizzleDidcommPrivateMediaSharingAdapterValues,
    agentContext?: AgentContext
  ): Promise<PrivateMediaRecord> {
    const { customTags, ...recordValues } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(recordValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, PrivateMediaRecord)

    if (customTags) {
      record.setTags(customTags as TagsBase)
    }

    return record
  }
}
