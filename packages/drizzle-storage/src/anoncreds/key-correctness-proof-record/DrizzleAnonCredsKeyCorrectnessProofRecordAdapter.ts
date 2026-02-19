import { AnonCredsKeyCorrectnessProofRecord } from '@credo-ts/anoncreds'
import { JsonTransformer, type TagsBase } from '@credo-ts/core'
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

  public getValues(record: AnonCredsKeyCorrectnessProofRecord) {
    const { credentialDefinitionId, ...customTags } = record.getTags()

    return {
      credentialDefinitionId,
      value: record.value,
      customTags,
    }
  }

  public toRecord(values: DrizzleAnonCredsKeyCorrectnessProofAdapterValues): AnonCredsKeyCorrectnessProofRecord {
    const { customTags, credentialDefinitionId, ...remainingValues } = values

    const record = JsonTransformer.fromJSON(remainingValues, AnonCredsKeyCorrectnessProofRecord)
    record.setTags({ ...customTags, credentialDefinitionId } as TagsBase)

    return record
  }
}
