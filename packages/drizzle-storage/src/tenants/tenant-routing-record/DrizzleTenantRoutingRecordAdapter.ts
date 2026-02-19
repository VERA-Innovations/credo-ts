import { JsonTransformer, type TagsBase } from '@credo-ts/core'
import { TenantRoutingRecord } from '@credo-ts/tenants'
import {
  BaseDrizzleRecordAdapter
} from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues, DrizzleAdapterValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleTenantRoutingAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['tenantRouting']>
export class DrizzleTenantRoutingRecordAdapter extends BaseDrizzleRecordAdapter<
  TenantRoutingRecord,
  typeof postgres.tenantRouting,
  typeof postgres,
  typeof sqlite.tenantRouting,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(database, { postgres: postgres.tenantRouting, sqlite: sqlite.tenantRouting }, TenantRoutingRecord, [], config)
  }

  public getValues(record: TenantRoutingRecord): DrizzleAdapterValues<(typeof sqlite)['tenantRouting']> {
    const { recipientKeyFingerprint, tenantId, ...customTags } = record.getTags()

    return {
      recipientKeyFingerprint,
      tenantId,
      customTags,
    }
  }

  public toRecord(values: DrizzleTenantRoutingAdapterValues): TenantRoutingRecord {
    const { customTags, ...remainingValues } = values

    const record = JsonTransformer.fromJSON(remainingValues, TenantRoutingRecord)
    if (customTags) record.setTags(customTags as TagsBase)

    return record
  }
}
