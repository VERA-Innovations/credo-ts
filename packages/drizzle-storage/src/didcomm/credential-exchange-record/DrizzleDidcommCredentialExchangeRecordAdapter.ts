import { type JsonObject, JsonTransformer, type TagsBase } from '@credo-ts/core'
import { DidCommCredentialExchangeRecord } from '@credo-ts/didcomm'
import {
  BaseDrizzleRecordAdapter
} from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues, DrizzleAdapterValues } from '../../adapter'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleDidcommCredentialExchangeAdapterValues = DrizzleAdapterRecordValues<
  (typeof sqlite)['didcommCredentialExchange']
>
export class DrizzleDidcommCredentialExchangeRecordAdapter extends BaseDrizzleRecordAdapter<
  DidCommCredentialExchangeRecord,
  typeof postgres.didcommCredentialExchange,
  typeof postgres,
  typeof sqlite.didcommCredentialExchange,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(
      database,
      { postgres: postgres.didcommCredentialExchange, sqlite: sqlite.didcommCredentialExchange },
      DidCommCredentialExchangeRecord,
      [],
      config
    )
  }

  public getValues(
    record: DidCommCredentialExchangeRecord
  ): DrizzleAdapterValues<(typeof sqlite)['didcommCredentialExchange']> {
    const { connectionId, threadId, parentThreadId, state, role, credentialIds, ...customTags } = record.getTags()

    return {
      connectionId,
      threadId,
      parentThreadId,
      state,
      role,
      autoAcceptCredential: record.autoAcceptCredential,
      revocationNotification: JsonTransformer.toJSON(record.revocationNotification),
      errorMessage: record.errorMessage,
      protocolVersion: record.protocolVersion,
      credentials: record.credentials,
      credentialIds,
      credentialAttributes: JsonTransformer.toJSON(record.credentialAttributes) as JsonObject[],

      customTags,
    }
  }

  public toRecord(values: DrizzleDidcommCredentialExchangeAdapterValues): DidCommCredentialExchangeRecord {
    // biome-ignore lint/correctness/noUnusedVariables: no explanation
    const { customTags, credentialIds, ...remainingValues } = values

    const record = JsonTransformer.fromJSON(remainingValues, DidCommCredentialExchangeRecord)
    record.setTags(customTags as TagsBase)

    return record
  }
}
