import { AnonCredsCredentialDefinitionRecord } from '@credo-ts/anoncreds'
import { AgentContext, JsonTransformer, type TagsBase } from '@credo-ts/core'
import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleAnonCredsCredentialDefinitionAdapterValues = DrizzleAdapterRecordValues<
  (typeof sqlite)['anonCredsCredentialDefinition']
>
export class DrizzleAnonCredsCredentialDefinitionRecordAdapter extends BaseDrizzleRecordAdapter<
  AnonCredsCredentialDefinitionRecord,
  typeof postgres.anonCredsCredentialDefinition,
  typeof postgres,
  typeof sqlite.anonCredsCredentialDefinition,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(
      database,
      { postgres: postgres.anonCredsCredentialDefinition, sqlite: sqlite.anonCredsCredentialDefinition },
      AnonCredsCredentialDefinitionRecord,
      [],
      config
    )
  }

  public async getValues(record: AnonCredsCredentialDefinitionRecord, agentContext?: AgentContext) {
    const {
      // biome-ignore lint/correctness/noUnusedVariables: no explanation
      schemaId: schemaIdTag,
      credentialDefinitionId,
      // biome-ignore lint/correctness/noUnusedVariables: no explanation
      issuerId: issuerIdTag,
      // biome-ignore lint/correctness/noUnusedVariables: no explanation
      tag: tagTag,
      methodName,
      unqualifiedCredentialDefinitionId,
      ...customTags
    } = record.getTags()

    const { issuerId, schemaId, tag, ...credentialDefinitionRest } = record.credentialDefinition

    // 1. Prepare the raw data object
    const rawValues = {
      credentialDefinitionId,
      methodName,
      unqualifiedCredentialDefinitionId,

      schemaId,
      issuerId,
      tag,
      credentialDefinition: credentialDefinitionRest,
    }

    // 2. Process for encryption/stringification via base class
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags: customTags,
    } as DrizzleAnonCredsCredentialDefinitionAdapterValues
  }

  public async toRecord(
    values: DrizzleAnonCredsCredentialDefinitionAdapterValues,
    agentContext?: AgentContext
  ): Promise<AnonCredsCredentialDefinitionRecord> {
    const { customTags, unqualifiedCredentialDefinitionId, issuerId, schemaId, tag, ...remainingValues } = values

    // 1. Decrypt and parse values from DB
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    // 2. Reconstruct the record with its nested credentialDefinition object
    const record = JsonTransformer.fromJSON(
      {
        ...decryptedValues,
        credentialDefinition: {
          ...decryptedValues.credentialDefinition,
          issuerId,
          schemaId,
          tag
        },
      },
      AnonCredsCredentialDefinitionRecord
    )

    // 3. Re-apply tags
    record.setTags({
      ...customTags,
      unqualifiedCredentialDefinitionId: unqualifiedCredentialDefinitionId ?? undefined,
    } as TagsBase)

    return record
  }
}
