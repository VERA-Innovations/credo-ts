import { JsonTransformer, SdJwtVcRecord, type AgentContext, type TagsBase } from '@credo-ts/core'

import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'

import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleSdJwtVcAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['sdJwtVc']>

export class DrizzleSdJwtVcRecordAdapter extends BaseDrizzleRecordAdapter<
  SdJwtVcRecord,
  typeof postgres.sdJwtVc,
  typeof postgres,
  typeof sqlite.sdJwtVc,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(database, { postgres: postgres.sdJwtVc, sqlite: sqlite.sdJwtVc }, SdJwtVcRecord, [], config)
  }

  public async getValues(record: SdJwtVcRecord, agentContext?: AgentContext) {
    const { alg, sdAlg, vct, multiInstanceState: _, ...customTags } = record.getTags()

    const rawValues = {
      alg,
      sdAlg,
      vct,
      credentialInstances: record.credentialInstances,
      multiInstanceState: record.multiInstanceState,
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as any
  }

  public async toRecord(values: DrizzleSdJwtVcAdapterValues, agentContext?: AgentContext): Promise<SdJwtVcRecord> {
    const { sdAlg, alg, vct, customTags, ...remainingValues } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, SdJwtVcRecord)
    record.setTags({
      alg,
      vct,
      sdAlg,
      ...(customTags as TagsBase),
    })

    return record
  }
}
