import { JsonTransformer, W3cV2CredentialRecord, type AgentContext, type TagsBase } from '@credo-ts/core'

import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'

import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleW3cV2CredentialAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['w3cV2Credential']>

export class DrizzleW3cV2CredentialRecordAdapter extends BaseDrizzleRecordAdapter<
  W3cV2CredentialRecord,
  typeof postgres.w3cV2Credential,
  typeof postgres,
  typeof sqlite.w3cV2Credential,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(database, { postgres: postgres.w3cV2Credential, sqlite: sqlite.w3cV2Credential }, W3cV2CredentialRecord, [], config)
  }

  public async getValues(record: W3cV2CredentialRecord, agentContext?: AgentContext) {
    const {
      // Default Tags
      issuerId,
      subjectIds,
      schemaIds,
      contexts,
      types,
      givenId,
      claimFormat,
      cryptosuites,
      algs,
      multiInstanceState: _,
      ...customTags
    } = record.getTags()

    const rawValues = {
      // JWT vc is string, JSON-LD vc is object
      credentialInstances: record.credentialInstances,
      multiInstanceState: record.multiInstanceState,

      // Tags
      issuerId,
      subjectIds,
      schemaIds,
      contexts,
      types,
      givenId,
      claimFormat,
      cryptosuites,
      algs,
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as any
  }

  public async toRecord(
    values: DrizzleW3cV2CredentialAdapterValues,
    agentContext?: AgentContext
  ): Promise<W3cV2CredentialRecord> {
    const {
      // Tags
      issuerId,
      subjectIds,
      schemaIds,
      contexts,
      types,
      givenId,
      claimFormat,
      algs,
      customTags,
      ...remainingValues
    } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, W3cV2CredentialRecord)
    record.setTags({
      issuerId,
      subjectIds,
      schemaIds,
      contexts,
      types,
      givenId: givenId ?? undefined,
      claimFormat,
      algs: algs ?? undefined,
      ...(customTags as TagsBase),
    })

    return record
  }
}
