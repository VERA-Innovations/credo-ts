import { JsonTransformer, W3cCredentialRecord, type AgentContext, type TagsBase } from '@credo-ts/core'

import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'

import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleW3cCredentialAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['w3cCredential']>

export class DrizzleW3cCredentialRecordAdapter extends BaseDrizzleRecordAdapter<
  W3cCredentialRecord,
  typeof postgres.w3cCredential,
  typeof postgres,
  typeof sqlite.w3cCredential,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(database, { postgres: postgres.w3cCredential, sqlite: sqlite.w3cCredential }, W3cCredentialRecord, [], config)
  }

  public async getValues(record: W3cCredentialRecord, agentContext?: AgentContext) {
    const {
      // Default Tags
      issuerId,
      subjectIds,
      schemaIds,
      contexts,
      types,
      givenId,
      claimFormat,
      proofTypes,
      cryptosuites,
      algs,

      // Custom Tags
      expandedTypes,
      multiInstanceState: _,
      ...customTags
    } = record.getTags()

    const rawValues = {
      // JWT vc is string, JSON-LD vc is object
      credentialInstances: record.credentialInstances,
      multiInstanceState: record.multiInstanceState,
      expandedTypes,

      // Tags
      issuerId,
      subjectIds,
      schemaIds,
      contexts,
      types,
      givenId,
      claimFormat,
      proofTypes,
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
    values: DrizzleW3cCredentialAdapterValues,
    agentContext?: AgentContext
  ): Promise<W3cCredentialRecord> {
    const {
      // Tags
      issuerId,
      subjectIds,
      schemaIds,
      contexts,
      types,
      givenId,
      claimFormat,
      proofTypes,
      cryptosuites,
      algs,
      expandedTypes,
      customTags,
      ...remainingValues
    } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, W3cCredentialRecord)
    record.setTags({
      issuerId,
      subjectIds,
      schemaIds,
      contexts,
      types,
      givenId: givenId ?? undefined,
      claimFormat,
      proofTypes: proofTypes ?? undefined,
      cryptosuites: cryptosuites ?? undefined,
      algs: algs ?? undefined,
      expandedTypes: expandedTypes ?? undefined,
      ...(customTags as TagsBase),
    })

    return record
  }
}
