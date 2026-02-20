import { JsonTransformer, type TagsBase, type AgentContext } from '@credo-ts/core'
import { OpenId4VcIssuanceSessionRecord } from '@credo-ts/openid4vc'
import {
  BaseDrizzleRecordAdapter
} from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleOpenId4VcIssuanceSessionMenuAdapterValues = DrizzleAdapterRecordValues<
  (typeof sqlite)['openId4VcIssuanceSession']
>

export class DrizzleOpenId4VcIssuanceSessionRecordAdapter extends BaseDrizzleRecordAdapter<
  OpenId4VcIssuanceSessionRecord,
  typeof postgres.openId4VcIssuanceSession,
  typeof postgres,
  typeof sqlite.openId4VcIssuanceSession,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(
      database,
      { postgres: postgres.openId4VcIssuanceSession, sqlite: sqlite.openId4VcIssuanceSession },
      OpenId4VcIssuanceSessionRecord,
      [],
      config
    )
  }

  public tagKeyMapping = {
    issuerState: ['authorization', 'issuerState'],
    authorizationCode: ['authorization', 'code'],
    authorizationSubject: ['authorization', 'subject'],
    presentationAuthSession: ['presentation', 'authSession'],
    chainedIdentityRequestUriReferenceValue: ['chainedIdentity', 'requestUriReferenceValue'],
    chainedIdentityState: ['chainedIdentity', 'externalState'],
  } as const

  public async getValues(
    record: OpenId4VcIssuanceSessionRecord,
    agentContext?: AgentContext
  ) {
    const {
      // biome-ignore lint/correctness/noUnusedVariables: no explanation
      authorizationCode,
      // biome-ignore lint/correctness/noUnusedVariables: no explanation
      authorizationSubject,
      credentialOfferId,
      credentialOfferUri,
      issuerId,
      // biome-ignore lint/correctness/noUnusedVariables: no explanation
      issuerState,
      preAuthorizedCode,
      // biome-ignore lint/correctness/noUnusedVariables: no explanation
      presentationAuthSession,
      // biome-ignore lint/correctness/noUnusedVariables: no explanation
      chainedIdentityRequestUriReferenceValue,
      // biome-ignore lint/correctness/noUnusedVariables: no explanation
      chainedIdentityState,
      state,
      ...customTags
    } = record.getTags()

    const rawValues = {
      credentialOfferId,
      credentialOfferUri,
      generateRefreshTokens: record.generateRefreshTokens,
      issuerId,
      preAuthorizedCode,
      state,
      expiresAt: record.expiresAt,
      transactions: record.transactions,

      credentialOfferPayload: record.credentialOfferPayload,
      authorization: record.authorization
        ? {
          ...record.authorization,
          codeExpiresAt: record.authorization.codeExpiresAt?.toISOString(),
        }
        : undefined,
      chainedIdentity: record.chainedIdentity
        ? {
          ...record.chainedIdentity,
          requestUriExpiresAt: record.chainedIdentity.requestUriExpiresAt?.toISOString(),
        }
        : undefined,
      clientId: record.clientId,
      dpop: record.dpop,
      errorMessage: record.errorMessage,
      issuanceMetadata: record.issuanceMetadata,
      issuedCredentials: record.issuedCredentials,
      pkce: record.pkce,
      presentation: record.presentation,
      userPin: record.userPin,
      walletAttestation: record.walletAttestation,
    }

    // Await asynchronous encryption and stringification
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as any
  }

  public async toRecord(
    values: DrizzleOpenId4VcIssuanceSessionMenuAdapterValues,
    agentContext?: AgentContext
  ): Promise<OpenId4VcIssuanceSessionRecord> {
    const { customTags, ...remainingValues } = values

    // Await asynchronous decryption and parsing
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, OpenId4VcIssuanceSessionRecord)
    if (customTags) record.setTags(customTags as TagsBase)

    return record
  }
}
