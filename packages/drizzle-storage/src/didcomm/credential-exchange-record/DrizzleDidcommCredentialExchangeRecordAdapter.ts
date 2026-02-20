import { type JsonObject, JsonTransformer, type TagsBase, type AgentContext } from '@credo-ts/core'
import { DidCommCredentialExchangeRecord } from '@credo-ts/didcomm'
import {
  BaseDrizzleRecordAdapter
} from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter'
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

  public async getValues(
    record: DidCommCredentialExchangeRecord,
    agentContext?: AgentContext
  ) {
    const { connectionId, threadId, parentThreadId, state, role, credentialIds, ...customTags } = record.getTags()

    const rawValues = {
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
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as any
  }

  public async toRecord(
    values: DrizzleDidcommCredentialExchangeAdapterValues,
    agentContext?: AgentContext
  ): Promise<DidCommCredentialExchangeRecord> {
    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    const { customTags, credentialIds, ...remainingValues } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, DidCommCredentialExchangeRecord)
    record.setTags(customTags as TagsBase)

    return record
  }
}
