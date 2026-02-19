import { JsonTransformer, type TagsBase } from '@credo-ts/core'
import { DidCommProofExchangeRecord } from '@credo-ts/didcomm'
import {
  BaseDrizzleRecordAdapter
} from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues, DrizzleAdapterValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleDidcommProofExchangeAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['didcommProofExchange']>
export class DrizzleDidcommProofExchangeRecordAdapter extends BaseDrizzleRecordAdapter<
  DidCommProofExchangeRecord,
  typeof postgres.didcommProofExchange,
  typeof postgres,
  typeof sqlite.didcommProofExchange,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(
      database,
      { postgres: postgres.didcommProofExchange, sqlite: sqlite.didcommProofExchange },
      DidCommProofExchangeRecord,
      [],
      config
    )
  }

  public getValues(record: DidCommProofExchangeRecord): DrizzleAdapterValues<(typeof sqlite)['didcommProofExchange']> {
    const { role, connectionId, parentThreadId, threadId, state, ...customTags } = record.getTags()

    return {
      connectionId,
      threadId,
      protocolVersion: record.protocolVersion,
      parentThreadId,
      isVerified: record.isVerified,
      state,
      role,
      autoAcceptProof: record.autoAcceptProof,
      errorMessage: record.errorMessage,
      customTags,
    }
  }

  public toRecord(values: DrizzleDidcommProofExchangeAdapterValues): DidCommProofExchangeRecord {
    const { customTags, ...remainingValues } = values

    const record = JsonTransformer.fromJSON(remainingValues, DidCommProofExchangeRecord)
    record.setTags(customTags as TagsBase)

    return record
  }
}
