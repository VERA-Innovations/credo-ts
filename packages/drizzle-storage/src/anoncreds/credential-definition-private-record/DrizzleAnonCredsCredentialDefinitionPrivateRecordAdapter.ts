import { AnonCredsCredentialDefinitionPrivateRecord } from '@credo-ts/anoncreds'
import { AgentContext, JsonTransformer, type TagsBase } from '@credo-ts/core'
import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleAnonCredsCredentialDefinitionPrivateAdapterValues = DrizzleAdapterRecordValues<
  (typeof sqlite)['anonCredsCredentialDefinitionPrivate']
>
export class DrizzleAnonCredsCredentialDefinitionPrivateRecordAdapter extends BaseDrizzleRecordAdapter<
  AnonCredsCredentialDefinitionPrivateRecord,
  typeof postgres.anonCredsCredentialDefinitionPrivate,
  typeof postgres,
  typeof sqlite.anonCredsCredentialDefinitionPrivate,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(
      database,
      { postgres: postgres.anonCredsCredentialDefinitionPrivate, sqlite: sqlite.anonCredsCredentialDefinitionPrivate },
      AnonCredsCredentialDefinitionPrivateRecord, [], config
    )
  }

  public async getValues(record: AnonCredsCredentialDefinitionPrivateRecord, agentContext?: AgentContext) {
    const { credentialDefinitionId, ...customTags } = record.getTags()
  
      // Map the record properties to a plain object
      const rawValues = {
        credentialDefinitionId,
        value: record.value
      }
  
      // We'll let the base class handle dynamic encryption and object-to-string conversion
      const processedValues = await this.prepareValuesForDb(rawValues, agentContext)
      return {
        ...processedValues,
        customTags: customTags,
      } as DrizzleAnonCredsCredentialDefinitionPrivateAdapterValues
    }

  public async toRecord(
    values: DrizzleAnonCredsCredentialDefinitionPrivateAdapterValues, agentContext: AgentContext
  ): Promise<AnonCredsCredentialDefinitionPrivateRecord> {
    // TODO: If we want to encrypt the 'credentialDefinitionId'. We would need to add that in remainingValues as well
    const { customTags, credentialDefinitionId, ...remainingValues } = values

    // 1. Let the base class handle dynamic decryption and string-to-object parsing
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, AnonCredsCredentialDefinitionPrivateRecord)
    record.setTags({ ...customTags, credentialDefinitionId } as TagsBase)

    return record
  }
}
