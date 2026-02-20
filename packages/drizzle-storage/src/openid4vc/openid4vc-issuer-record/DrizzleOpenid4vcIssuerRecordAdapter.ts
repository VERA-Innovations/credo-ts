import { JsonTransformer, type TagsBase, type AgentContext } from '@credo-ts/core'

import { OpenId4VcIssuerRecord } from '@credo-ts/openid4vc'
import {
  BaseDrizzleRecordAdapter
} from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleOpenid4vcIssuerAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['openid4vcIssuer']>

export class DrizzleOpenid4vcIssuerRecordAdapter extends BaseDrizzleRecordAdapter<
  OpenId4VcIssuerRecord,
  typeof postgres.openid4vcIssuer,
  typeof postgres,
  typeof sqlite.openid4vcIssuer,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(database, { postgres: postgres.openid4vcIssuer, sqlite: sqlite.openid4vcIssuer }, OpenId4VcIssuerRecord, [], config)
  }

  public async getValues(record: OpenId4VcIssuerRecord, agentContext?: AgentContext) {
    const { issuerId, ...customTags } = record.getTags()

    const rawValues = {
      issuerId,
      accessTokenPublicJwk: record.accessTokenPublicJwk,
      accessTokenPublicKeyFingerprint: record.accessTokenPublicKeyFingerprint,
      credentialConfigurationsSupported: record.credentialConfigurationsSupported,
      dpopSigningAlgValuesSupported: record.dpopSigningAlgValuesSupported,
      signedMetadata: record.signedMetadata,
      display: record.display,
      authorizationServerConfigs: record.authorizationServerConfigs,
      batchCredentialIssuance: record.batchCredentialIssuance,
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as any
  }

  public async toRecord(
    values: DrizzleOpenid4vcIssuerAdapterValues,
    agentContext?: AgentContext
  ): Promise<OpenId4VcIssuerRecord> {
    const { customTags, ...remainingValues } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, OpenId4VcIssuerRecord)
    if (customTags) record.setTags(customTags as TagsBase)

    return record
  }
}
