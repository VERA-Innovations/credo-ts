import { JsonTransformer, type TagsBase, type AgentContext } from '@credo-ts/core'
import { DidCommConnectionRecord } from '@credo-ts/didcomm'
import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleDidcommConnectionAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['didcommConnection']>

export class DrizzleDidcommConnectionRecordAdapter extends BaseDrizzleRecordAdapter<
  DidCommConnectionRecord,
  typeof postgres.didcommConnection,
  typeof postgres,
  typeof sqlite.didcommConnection,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(database, { postgres: postgres.didcommConnection, sqlite: sqlite.didcommConnection }, DidCommConnectionRecord, [], config)
  }

  public async getValues(record: DidCommConnectionRecord, agentContext?: AgentContext) {
    const {
      state,
      role,
      threadId,
      mediatorId,
      did,
      theirDid,
      outOfBandId,
      invitationDid,
      connectionTypes,
      previousDids,
      previousTheirDids,
      ...customTags
    } = record.getTags()

    // Map the record properties to a plain object
    const rawValues = {
      state,
      role,
      threadId,
      mediatorId,
      did,
      theirDid,
      outOfBandId,
      invitationDid,
      connectionTypes,
      previousDids,
      previousTheirDids,
      alias: record.alias,
      autoAcceptConnection: record.autoAcceptConnection,
      errorMessage: record.errorMessage,
      imageUrl: record.imageUrl,
      theirLabel: record.theirLabel,
      protocol: record.protocol,
      metadata: record.metadata.data,
    }

    // Await the asynchronous encryption and stringification
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags: customTags as any,
    } as any
  }

  public async toRecord(
    values: DrizzleDidcommConnectionAdapterValues,
    agentContext?: AgentContext
  ): Promise<DidCommConnectionRecord> {
    const { customTags, ...remainingValues } = values

    // Await the asynchronous decryption and parsing
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    // Instantiate the record with processed values
    const record = JsonTransformer.fromJSON(decryptedValues, DidCommConnectionRecord)
    record.setTags(customTags as TagsBase)

    return record
  }
}
