import { JsonTransformer, MdocRecord, type AgentContext, type TagsBase } from '@credo-ts/core'

import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'

import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'

type DrizzleMdocAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['mdoc']>

export class DrizzleMdocRecordAdapter extends BaseDrizzleRecordAdapter<
  MdocRecord,
  typeof postgres.mdoc,
  typeof postgres,
  typeof sqlite.mdoc,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(database, { postgres: postgres.mdoc, sqlite: sqlite.mdoc }, MdocRecord, [], config)
  }

  public async getValues(record: MdocRecord, agentContext?: AgentContext) {
    const { alg, docType, multiInstanceState: _, ...customTags } = record.getTags()

    const rawValues = {
      alg,
      docType,
      credentialInstances: record.credentialInstances,
      multiInstanceState: record.multiInstanceState,
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as any
  }

  public async toRecord(values: DrizzleMdocAdapterValues, agentContext?: AgentContext): Promise<MdocRecord> {
    const { alg, docType, customTags, ...remainingValues } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, MdocRecord)
    record.setTags({
      alg,
      docType,
      ...(customTags as TagsBase),
    })

    return record
  }
}
