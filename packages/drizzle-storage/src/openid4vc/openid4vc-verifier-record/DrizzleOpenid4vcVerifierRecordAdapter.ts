import { JsonTransformer, type TagsBase } from '@credo-ts/core'

import { OpenId4VcVerifierRecord } from '@credo-ts/openid4vc'
import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleOpenid4vcVerifierAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['openid4vcVerifier']>
export class DrizzleOpenid4vcVerifierRecordAdapter extends BaseDrizzleRecordAdapter<
  OpenId4VcVerifierRecord,
  typeof postgres.openid4vcVerifier,
  typeof postgres,
  typeof sqlite.openid4vcVerifier,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(database, { postgres: postgres.openid4vcVerifier, sqlite: sqlite.openid4vcVerifier }, OpenId4VcVerifierRecord, [], config)
  }

  public getValues(record: OpenId4VcVerifierRecord) {
    const { verifierId, ...customTags } = record.getTags()

    return {
      verifierId,
      clientMetadata: record.clientMetadata,
      customTags,
    }
  }

  public toRecord(values: DrizzleOpenid4vcVerifierAdapterValues): OpenId4VcVerifierRecord {
    const { customTags, ...remainingValues } = values

    const record = JsonTransformer.fromJSON(remainingValues, OpenId4VcVerifierRecord)
    if (customTags) record.setTags(customTags as TagsBase)

    return record
  }
}
