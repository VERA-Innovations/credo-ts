import { JsonTransformer, type TagsBase, type AgentContext } from '@credo-ts/core'
import { DidCommMessageRecord } from '@credo-ts/didcomm'
import {
  BaseDrizzleRecordAdapter
} from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleDidcommMessageAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['didcommMessage']>

export class DrizzleDidcommMessageRecordAdapter extends BaseDrizzleRecordAdapter<
  DidCommMessageRecord,
  typeof postgres.didcommMessage,
  typeof postgres,
  typeof sqlite.didcommMessage,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(database, { postgres: postgres.didcommMessage, sqlite: sqlite.didcommMessage }, DidCommMessageRecord, [], config)
  }

  public tagKeyMapping = {
    messageType: ['message', '@type'],
    messageId: ['message', '@id'],
  } as const

  public async getValues(record: DidCommMessageRecord, agentContext?: AgentContext) {
    const {
      role,
      associatedRecordId,
      // biome-ignore lint/correctness/noUnusedVariables: no explanation
      messageId,
      messageName,
      // biome-ignore lint/correctness/noUnusedVariables: no explanation
      messageType,
      protocolMajorVersion,
      protocolMinorVersion,
      protocolName,
      threadId,
      ...customTags
    } = record.getTags()

    const rawValues = {
      message: record.message,
      role,
      associatedRecordId,

      // These are accessed on message['@type'] and message['@id']
      // messageType,
      // messageId,

      threadId,
      protocolName,
      messageName,
      protocolMajorVersion,
      protocolMinorVersion,
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as any
  }

  public async toRecord(
    values: DrizzleDidcommMessageAdapterValues,
    agentContext?: AgentContext
  ): Promise<DidCommMessageRecord> {
    // biome-ignore lint/correctness/noUnusedVariables:no explanation
    const { customTags, messageName, protocolMajorVersion, protocolMinorVersion, protocolName, ...remainingValues } =
      values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, DidCommMessageRecord)
    record.setTags(customTags as TagsBase)

    return record
  }
}
