import { AnonCredsRevocationRegistryDefinitionPrivateRecord } from '@credo-ts/anoncreds'
import { JsonTransformer, type TagsBase } from '@credo-ts/core'
import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleAnonCredsRevocationRegistryDefinitionPrivateAdapterValues = DrizzleAdapterRecordValues<
  (typeof sqlite)['anonCredsRevocationRegistryDefinitionPrivate']
>
export class DrizzleAnonCredsRevocationRegistryDefinitionPrivateRecordAdapter extends BaseDrizzleRecordAdapter<
  AnonCredsRevocationRegistryDefinitionPrivateRecord,
  typeof postgres.anonCredsRevocationRegistryDefinitionPrivate,
  typeof postgres,
  typeof sqlite.anonCredsRevocationRegistryDefinitionPrivate,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig ) {
    super(
      database,
      {
        postgres: postgres.anonCredsRevocationRegistryDefinitionPrivate,
        sqlite: sqlite.anonCredsRevocationRegistryDefinitionPrivate,
      },
      AnonCredsRevocationRegistryDefinitionPrivateRecord,
      [],
      config
    )
  }

  public getValues(record: AnonCredsRevocationRegistryDefinitionPrivateRecord) {
    const { revocationRegistryDefinitionId, credentialDefinitionId, state, ...customTags } = record.getTags()

    return {
      revocationRegistryDefinitionId,
      credentialDefinitionId,
      state,
      value: record.value,
      customTags,
    }
  }

  public toRecord(
    values: DrizzleAnonCredsRevocationRegistryDefinitionPrivateAdapterValues
  ): AnonCredsRevocationRegistryDefinitionPrivateRecord {
    const { customTags, ...remainingValues } = values

    const record = JsonTransformer.fromJSON(remainingValues, AnonCredsRevocationRegistryDefinitionPrivateRecord)
    if (customTags) record.setTags(customTags as TagsBase)

    return record
  }
}
