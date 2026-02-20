import { AnonCredsRevocationRegistryDefinitionRecord } from '@credo-ts/anoncreds'
import { AgentContext, JsonTransformer, type TagsBase } from '@credo-ts/core'
import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleAnonCredsRevocationRegistryDefinitionAdapterValues = DrizzleAdapterRecordValues<
  (typeof sqlite)['anonCredsRevocationRegistryDefinition']
>

export class DrizzleAnonCredsRevocationRegistryDefinitionRecordAdapter extends BaseDrizzleRecordAdapter<
  AnonCredsRevocationRegistryDefinitionRecord,
  typeof postgres.anonCredsRevocationRegistryDefinition,
  typeof postgres,
  typeof sqlite.anonCredsRevocationRegistryDefinition,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(
      database,
      {
        postgres: postgres.anonCredsRevocationRegistryDefinition,
        sqlite: sqlite.anonCredsRevocationRegistryDefinition,
      },
      AnonCredsRevocationRegistryDefinitionRecord,
      [],
      config
    )
  }

  public async getValues(record: AnonCredsRevocationRegistryDefinitionRecord, agentContext?: AgentContext) {
    const { revocationRegistryDefinitionId, credentialDefinitionId, ...customTags } = record.getTags()

    const rawValues = {
      revocationRegistryDefinitionId,
      credentialDefinitionId,
      revocationRegistryDefinition: record.revocationRegistryDefinition,
    }

    // Await encryption/stringification
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as DrizzleAnonCredsRevocationRegistryDefinitionAdapterValues
  }

  public async toRecord(
    values: DrizzleAnonCredsRevocationRegistryDefinitionAdapterValues,
    agentContext?: AgentContext
  ): Promise<AnonCredsRevocationRegistryDefinitionRecord> {
    const { customTags, credentialDefinitionId, ...remainingValues } = values

    // Await decryption/parsing
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, AnonCredsRevocationRegistryDefinitionRecord)
    record.setTags({ ...customTags, credentialDefinitionId } as TagsBase)

    return record
  }
}
