import { AgentContext, DidRecord, JsonTransformer, type TagsBase } from '@credo-ts/core'
import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'
console.log('Base Class Check:', BaseDrizzleRecordAdapter);

import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type';
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig';

type DrizzleDidAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['did']>
export class DrizzleDidRecordAdapter extends BaseDrizzleRecordAdapter<
  DidRecord,
  typeof postgres.did,
  typeof postgres,
  typeof sqlite.did,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(database, { postgres: postgres.did, sqlite: sqlite.did }, DidRecord, [], config)
  }

  public async getValues(record: DidRecord, agentContext?: AgentContext) {
    const {
      // Default Tags
      recipientKeyFingerprints,
      method,
      methodSpecificIdentifier,
      alternativeDids,
      // biome-ignore lint/correctness/noUnusedVariables: no explanation
      did,
      // biome-ignore lint/correctness/noUnusedVariables: no explanation
      legacyUnqualifiedDid,

      role,
      ...customTags
    } = record.getTags()

    const rawValues = {
      did: record.did,
      role: role,
      didDocument: record.didDocument,
      keys: record.keys,

      // Tags
      recipientKeyFingerprints,
      method,
      methodSpecificIdentifier,
      alternativeDids,
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as DrizzleDidAdapterValues
  }

  public async toRecord(values: DrizzleDidAdapterValues, agentContext?: AgentContext): Promise<DidRecord> {
    const {
      // Default Tags
      recipientKeyFingerprints,
      method,
      methodSpecificIdentifier,
      alternativeDids,
      customTags,
      ...remainingValues
    } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, DidRecord)
    record.setTags({
      recipientKeyFingerprints: recipientKeyFingerprints ?? undefined,
      method,
      methodSpecificIdentifier,
      alternativeDids: alternativeDids ?? undefined,
      ...customTags as TagsBase,
    })

    return record
  }
}
