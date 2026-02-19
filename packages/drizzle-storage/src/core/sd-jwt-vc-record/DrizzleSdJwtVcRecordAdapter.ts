import { JsonTransformer, SdJwtVcRecord } from '@credo-ts/core'

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

  public getValues(record: SdJwtVcRecord) {
    const { alg, sdAlg, vct, multiInstanceState: _, ...customTags } = record.getTags()

    return {
      alg,
      sdAlg,
      vct,
      credentialInstances: record.credentialInstances,
      multiInstanceState: record.multiInstanceState,
      customTags,
    }
  }

  public toRecord(values: DrizzleSdJwtVcAdapterValues): SdJwtVcRecord {
    const { sdAlg, alg, vct, customTags, ...remainingValues } = values

    const record = JsonTransformer.fromJSON(remainingValues, SdJwtVcRecord)
    record.setTags({
      alg,
      vct,
      sdAlg,
      ...customTags,
    })

    return record
  }
}
