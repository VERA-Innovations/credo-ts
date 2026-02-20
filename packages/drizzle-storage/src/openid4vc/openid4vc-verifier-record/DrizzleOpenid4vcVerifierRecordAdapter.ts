import { JsonTransformer, type TagsBase, type AgentContext } from '@credo-ts/core'

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

  public async getValues(record: OpenId4VcVerifierRecord, agentContext?: AgentContext) {
    const { verifierId, ...customTags } = record.getTags()

    const rawValues = {
      verifierId,
      clientMetadata: record.clientMetadata,
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as any
  }

  public async toRecord(
    values: DrizzleOpenid4vcVerifierAdapterValues,
    agentContext?: AgentContext
  ): Promise<OpenId4VcVerifierRecord> {
    const { customTags, ...remainingValues } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, OpenId4VcVerifierRecord)
    if (customTags) record.setTags(customTags as TagsBase)

    return record
  }
}
