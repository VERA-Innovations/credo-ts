import { JsonTransformer, type TagsBase, type AgentContext } from '@credo-ts/core'
import { DidCommConnectionRecord } from '@credo-ts/didcomm'
import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'

type DrizzleDidcommConnectionAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['didcommConnection']>

export class DrizzleDidcommConnectionRecordAdapter extends BaseDrizzleRecordAdapter<
  DidCommConnectionRecord,
  typeof postgres.didcommConnection,
  typeof postgres,
  typeof sqlite.didcommConnection,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>) {
    super(database, { postgres: postgres.didcommConnection, sqlite: sqlite.didcommConnection }, DidCommConnectionRecord)
  }

  public getValues(record: DidCommConnectionRecord, agentContext?: AgentContext) {
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
    }

    // We'll let the base class handle dynamic encryption and object-to-string conversion
    const processedValues = this.prepareValuesForDb(rawValues, agentContext)
    // Triage: do we need t transform the processed values afterwards?
    // Answer: No need, coz initially also we return the mapped values directly

    return {
      ...processedValues,
      customTags: customTags as any,
    } as any
  }

  public toRecord(values: DrizzleDidcommConnectionAdapterValues, agentContext?: AgentContext): DidCommConnectionRecord {
    const { customTags, ...remainingValues } = values

    // 1. Let the base class handle dynamic decryption and string-to-object parsing
    const decryptedValues = this.prepareRecordFromDb(remainingValues, agentContext)

    // 2. Instantiate the record with processed values
    const record = JsonTransformer.fromJSON(decryptedValues, DidCommConnectionRecord)
    record.setTags(customTags as TagsBase)

    return record
  }
}