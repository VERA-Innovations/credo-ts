import { AnonCredsLinkSecretRecord } from '@credo-ts/anoncreds'
import { JsonTransformer, type TagsBase } from '@credo-ts/core'
import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleAnonCredsLinkSecretAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['anonCredsLinkSecret']>
export class DrizzleAnonCredsLinkSecretRecordAdapter extends BaseDrizzleRecordAdapter<
  AnonCredsLinkSecretRecord,
  typeof postgres.anonCredsLinkSecret,
  typeof postgres,
  typeof sqlite.anonCredsLinkSecret,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(
      database,
      { postgres: postgres.anonCredsLinkSecret, sqlite: sqlite.anonCredsLinkSecret },
      AnonCredsLinkSecretRecord, [], config
    )
  }

  public getValues(record: AnonCredsLinkSecretRecord) {
    const { linkSecretId, isDefault, ...customTags } = record.getTags()

    return {
      linkSecretId,
      isDefault,
      value: record.value,
      customTags,
    }
  }

  public toRecord(values: DrizzleAnonCredsLinkSecretAdapterValues): AnonCredsLinkSecretRecord {
    const { customTags, isDefault, ...remainingValues } = values

    const record = JsonTransformer.fromJSON(remainingValues, AnonCredsLinkSecretRecord)
    record.setTags({ ...customTags, isDefault: isDefault ?? undefined } as TagsBase)

    return record
  }
}
