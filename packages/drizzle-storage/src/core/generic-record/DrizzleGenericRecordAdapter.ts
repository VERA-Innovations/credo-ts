import { type AgentContext, GenericRecord, JsonTransformer, type TagsBase } from '@credo-ts/core'

import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'

import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleGenericRecordAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['genericRecord']>

export class DrizzleGenericRecordAdapter extends BaseDrizzleRecordAdapter<
  GenericRecord,
  typeof postgres.genericRecord,
  typeof postgres,
  typeof sqlite.genericRecord,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(database, { postgres: postgres.genericRecord, sqlite: sqlite.genericRecord }, GenericRecord, [
      // Add additional fields that need to be excluded from encryption at all
    ], config)
  }

  public async getValues(record: GenericRecord, agentContext?: AgentContext) {
    // 1. Await the asynchronous encryption/stringification logic
    const dbValues = await this.prepareValuesForDb(record, agentContext);

    // 2. Add any specific mappings unique to this adapter (like tags)
    return {
      ...dbValues,
      customTags: record.getTags() as Record<string, string>,
    } as any;
  }

  public async toRecord(values: DrizzleGenericRecordAdapterValues, agentContext?: AgentContext): Promise<GenericRecord> {
    const { customTags, ...remainingValues } = values;

    // 1. prepareRecordFromDb handles all decryption and string-to-object conversion
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext);

    // 2. Instantiate and re-apply tags
    const record = JsonTransformer.fromJSON(decryptedValues, GenericRecord);
    record.setTags(customTags as TagsBase);

    return record;
  }
}
