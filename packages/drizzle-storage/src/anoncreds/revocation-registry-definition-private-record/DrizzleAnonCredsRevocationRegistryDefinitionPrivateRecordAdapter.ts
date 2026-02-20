import { AnonCredsRevocationRegistryDefinitionPrivateRecord } from '@credo-ts/anoncreds'
import { AgentContext, JsonTransformer, type TagsBase } from '@credo-ts/core'
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
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
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

  public async getValues(record: AnonCredsRevocationRegistryDefinitionPrivateRecord, agentContext?: AgentContext) {
    const { revocationRegistryDefinitionId, credentialDefinitionId, state, ...customTags } = record.getTags()

    const rawValues = {
      revocationRegistryDefinitionId,
      credentialDefinitionId,
      state,
      value: record.value,
    }

    // Await encryption/stringification
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as DrizzleAnonCredsRevocationRegistryDefinitionPrivateAdapterValues
  }

  public async toRecord(
    values: DrizzleAnonCredsRevocationRegistryDefinitionPrivateAdapterValues,
    agentContext?: AgentContext
  ): Promise<AnonCredsRevocationRegistryDefinitionPrivateRecord> {
    const { customTags, ...remainingValues } = values

    // Await decryption/parsing
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, AnonCredsRevocationRegistryDefinitionPrivateRecord)
    if (customTags) record.setTags(customTags as TagsBase)

    return record
  }
}
