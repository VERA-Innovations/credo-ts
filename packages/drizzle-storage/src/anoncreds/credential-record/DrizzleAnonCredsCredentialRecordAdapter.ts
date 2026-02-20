import { AnonCredsCredentialRecord } from '@credo-ts/anoncreds'
import { AgentContext, JsonTransformer, type TagsBase } from '@credo-ts/core'
import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleAnonCredsCredentialAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['anonCredsCredential']>

export class DrizzleAnonCredsCredentialRecordAdapter extends BaseDrizzleRecordAdapter<
  AnonCredsCredentialRecord,
  typeof postgres.anonCredsCredential,
  typeof postgres,
  typeof sqlite.anonCredsCredential,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(
      database,
      { postgres: postgres.anonCredsCredential, sqlite: sqlite.anonCredsCredential },
      AnonCredsCredentialRecord,
      [],
      config
    )
  }

  public async getValues(record: AnonCredsCredentialRecord, agentContext?: AgentContext) {
    const {
      credentialId,
      linkSecretId,
      credentialDefinitionId,
      credentialRevocationId,
      revocationRegistryId,
      schemaId,
      methodName,
      schemaName,
      schemaVersion,
      schemaIssuerId,
      issuerId,
      ...customTags
    } = record.getTags()

    // biome-ignore lint/correctness/noUnusedVariables: no explanation
    const { schema_id, cred_def_id, rev_reg_id, ...credentialRest } = record.credential

    const rawValues = {
      credentialId,
      credentialRevocationId,
      linkSecretId,
      methodName,

      credential: credentialRest,
      credentialDefinitionId,
      revocationRegistryId,
      schemaId,

      schemaName,
      schemaVersion,
      schemaIssuerId,
      issuerId,
    }

    // Process for encryption/stringification
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags: customTags as any,
    } as any
  }

  public async toRecord(values: DrizzleAnonCredsCredentialAdapterValues, agentContext?: AgentContext): Promise<AnonCredsCredentialRecord> {
    const {
      customTags,
      schemaId,
      revocationRegistryId,
      credentialDefinitionId,
      schemaName,
      schemaVersion,
      schemaIssuerId,
      issuerId,
      ...remainingValues
    } = values

    // Decrypt and parse values from DB
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(
      {
        ...decryptedValues,
        credential: {
          ...decryptedValues.credential,
          schema_id: schemaId,
          cred_def_id: credentialDefinitionId,
          rev_reg_id: revocationRegistryId,
        },
      },
      AnonCredsCredentialRecord
    )

    record.setTags({
      ...customTags,
      schemaName,
      schemaVersion,
      schemaIssuerId,
      issuerId
    } as TagsBase)

    return record
  }
}