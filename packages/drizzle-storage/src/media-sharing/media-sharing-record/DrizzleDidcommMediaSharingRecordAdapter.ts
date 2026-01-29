import { JsonTransformer, type TagsBase } from '@credo-ts/core'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import { DidCommMediaSharingRecord, SharedMediaItem } from '@2060.io/credo-ts-didcomm-media-sharing'
import { type DrizzleAdapterRecordValues, BaseDrizzleRecordAdapter } from '../../adapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'

type DrizzleDidcommMediaSharingAdapterValues =
  DrizzleAdapterRecordValues<(typeof sqlite)['didcommMediaSharing']>

export class DrizzleDidcommMediaSharingRecordAdapter extends BaseDrizzleRecordAdapter<
  DidCommMediaSharingRecord | any,
  typeof postgres.didcommMediaSharing,
  typeof postgres,
  typeof sqlite.didcommMediaSharing,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>) {
    super(
      database,
      { postgres: postgres.didcommMediaSharing, sqlite: sqlite.didcommMediaSharing },
      DidCommMediaSharingRecord
    )
  }

  public getValues(record: DidCommMediaSharingRecord) {
    const {
      role,
      connectionId,
      threadId,
      parentThreadId,
      description,
      ...customTags
    } = record.getTags()

    return {

      sentTime: record.sentTime,

      connectionId,
      threadId,
      parentThreadId,
      description,

      role,
      state: record.state,

      items: record.items
        ? JsonTransformer.toJSON(record.items) as SharedMediaItem[]
        : null,

      metadata: record.metadata
        ? JsonTransformer.toJSON(record.metadata)
        : null,

      customTags,
    }
  }

  public toRecord(values: DrizzleDidcommMediaSharingAdapterValues): DidCommMediaSharingRecord {
    const { customTags, ...recordValues } = values

    const record = JsonTransformer.fromJSON(recordValues, DidCommMediaSharingRecord)

    if (customTags) {
      record.setTags(customTags as TagsBase)
    }

    return record
  }
}
