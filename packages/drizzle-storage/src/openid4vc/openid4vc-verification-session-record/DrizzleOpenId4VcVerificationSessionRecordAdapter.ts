import { JsonTransformer, type TagsBase } from '@credo-ts/core'

import { OpenId4VcVerificationSessionRecord } from '@credo-ts/openid4vc'
import {
  BaseDrizzleRecordAdapter
} from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues, DrizzleAdapterValues } from '../../adapter/type'
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

  public getValues(
    record: OpenId4VcVerificationSessionRecord
  ): DrizzleAdapterValues<(typeof sqlite)['openId4VcVerificationSession']> {
    const { authorizationRequestId, authorizationRequestUri, nonce, payloadState, state, verifierId, ...customTags } =
      record.getTags()

    return {
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
      customTags,
    }
  }

  public toRecord(values: DrizzleOpenId4VcVerificationSessionAdapterValues): OpenId4VcVerificationSessionRecord {
    // biome-ignore lint/correctness/noUnusedVariables: no explanation
    const { customTags, nonce, payloadState, ...remainingValues } = values

    const record = JsonTransformer.fromJSON(remainingValues, OpenId4VcVerificationSessionRecord)
    if (customTags) record.setTags(customTags as TagsBase)

    return record
  }
}
