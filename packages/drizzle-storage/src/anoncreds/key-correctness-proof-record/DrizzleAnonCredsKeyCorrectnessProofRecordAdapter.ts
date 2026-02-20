import { AnonCredsKeyCorrectnessProofRecord } from '@credo-ts/anoncreds'
import { AgentContext, JsonTransformer, type TagsBase } from '@credo-ts/core'
import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleAnonCredsKeyCorrectnessProofAdapterValues = DrizzleAdapterRecordValues<
  (typeof sqlite)['anonCredsKeyCorrectnessProof']
>
export class DrizzleAnonCredsKeyCorrectnessProofRecordAdapter extends BaseDrizzleRecordAdapter<
  AnonCredsKeyCorrectnessProofRecord,
  typeof postgres.anonCredsKeyCorrectnessProof,
  typeof postgres,
  typeof sqlite.anonCredsKeyCorrectnessProof,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(
      database,
      { postgres: postgres.anonCredsKeyCorrectnessProof, sqlite: sqlite.anonCredsKeyCorrectnessProof },
      AnonCredsKeyCorrectnessProofRecord, [], config
    )
  }

  public async getValues(record: AnonCredsKeyCorrectnessProofRecord, agentContext?: AgentContext) {
    const { credentialDefinitionId, ...customTags } = record.getTags()

    const rawValues = {
      credentialDefinitionId,
      value: record.value,
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as DrizzleAnonCredsKeyCorrectnessProofAdapterValues
  }

  public async toRecord(
    values: DrizzleAnonCredsKeyCorrectnessProofAdapterValues,
    agentContext?: AgentContext
  ): Promise<AnonCredsKeyCorrectnessProofRecord> {
    const { customTags, credentialDefinitionId, ...remainingValues } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, AnonCredsKeyCorrectnessProofRecord)
    record.setTags({ ...customTags, credentialDefinitionId } as TagsBase)

    return record
  }
}
