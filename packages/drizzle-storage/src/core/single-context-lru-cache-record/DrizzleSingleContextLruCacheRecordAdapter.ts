import { JsonTransformer, SingleContextLruCacheRecord, type TagsBase } from '@credo-ts/core'

import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'

import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleSingleContextLruCacheAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['singleContextLruCache']>
export class DrizzleSingleContextLruCacheRecordAdapter extends BaseDrizzleRecordAdapter<
  SingleContextLruCacheRecord,
  typeof postgres.singleContextLruCache,
  typeof postgres,
  typeof sqlite.singleContextLruCache,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(
      database,
      { postgres: postgres.singleContextLruCache, sqlite: sqlite.singleContextLruCache },
      SingleContextLruCacheRecord,
      [],
      config
    )
  }

  public getValues(record: SingleContextLruCacheRecord) {
    return {
      entries: Object.fromEntries(record.entries.entries()),
      customTags: record.getTags(),
    }
  }

  public toRecord(values: DrizzleSingleContextLruCacheAdapterValues): SingleContextLruCacheRecord {
    const { entries, customTags, ...remainingValues } = values

    const record = JsonTransformer.fromJSON(
      { entries: Object.entries(entries), ...remainingValues },
      SingleContextLruCacheRecord
    )
    record.setTags(customTags as TagsBase)

    return record
  }
}
