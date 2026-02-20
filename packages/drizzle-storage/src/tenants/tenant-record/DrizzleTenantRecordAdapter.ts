import { JsonTransformer, type TagsBase, type AgentContext } from '@credo-ts/core'
import { TenantRecord } from '@credo-ts/tenants'
import {
  BaseDrizzleRecordAdapter
} from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleTenantAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['tenant']>

export class DrizzleTenantRecordAdapter extends BaseDrizzleRecordAdapter<
  TenantRecord,
  typeof postgres.tenant,
  typeof postgres,
  typeof sqlite.tenant,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(database, { postgres: postgres.tenant, sqlite: sqlite.tenant }, TenantRecord, [], config)
  }

  public async getValues(record: TenantRecord, agentContext?: AgentContext): Promise<DrizzleTenantAdapterValues> {
    const { label, storageVersion, ...customTags } = record.getTags()

    const rawValues = {
      label,
      storageVersion,
      config: record.config,
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as any
  }

  public async toRecord(
    values: DrizzleTenantAdapterValues,
    agentContext?: AgentContext
  ): Promise<TenantRecord> {
    const { customTags, ...remainingValues } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, TenantRecord)
    if (customTags) record.setTags(customTags as TagsBase)

    return record
  }
}
