import { JsonTransformer, type TagsBase, type AgentContext } from '@credo-ts/core'

import { OpenId4VcVerificationSessionRecord } from '@credo-ts/openid4vc'
import {
  BaseDrizzleRecordAdapter
} from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleOpenId4VcVerificationSessionAdapterValues = DrizzleAdapterRecordValues<
  (typeof sqlite)['openId4VcVerificationSession']
>

export class DrizzleOpenId4VcVerificationSessionRecordAdapter extends BaseDrizzleRecordAdapter<
  OpenId4VcVerificationSessionRecord,
  typeof postgres.openId4VcVerificationSession,
  typeof postgres,
  typeof sqlite.openId4VcVerificationSession,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(
      database,
      { postgres: postgres.openId4VcVerificationSession, sqlite: sqlite.openId4VcVerificationSession },
      OpenId4VcVerificationSessionRecord,
      [],
      config
    )
  }

  public async getValues(
    record: OpenId4VcVerificationSessionRecord,
    agentContext?: AgentContext
  ) {
    const { authorizationRequestId, authorizationRequestUri, nonce, payloadState, state, verifierId, ...customTags } =
      record.getTags()

    const rawValues = {
      authorizationRequestJwt: record.authorizationRequestJwt,
      authorizationRequestPayload: record.authorizationRequestPayload,
      authorizationResponsePayload: record.authorizationResponsePayload,
      authorizationResponseRedirectUri: record.authorizationResponseRedirectUri,
      errorMessage: record.errorMessage,
      expiresAt: record.expiresAt,
      presentationDuringIssuanceSession: record.presentationDuringIssuanceSession,
      authorizationRequestId,
      authorizationRequestUri,
      nonce,
      payloadState,
      state,
      verifierId,
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as any
  }

  public async toRecord(
    values: DrizzleOpenId4VcVerificationSessionAdapterValues,
    agentContext?: AgentContext
  ): Promise<OpenId4VcVerificationSessionRecord> {
    // biome-ignore lint/correctness/noUnusedVariables: no explanation
    const { customTags, nonce, payloadState, ...remainingValues } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, OpenId4VcVerificationSessionRecord)
    if (customTags) record.setTags(customTags as TagsBase)

    return record
  }
}
