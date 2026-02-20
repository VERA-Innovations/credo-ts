import { JsonTransformer, type TagsBase, type AgentContext } from '@credo-ts/core'
import { DidCommOutOfBandRecord } from '@credo-ts/didcomm'
import {
  BaseDrizzleRecordAdapter
} from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleDidcommOutOfBandAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['didcommOutOfBand']>

export class DrizzleDidcommOutOfBandRecordAdapter extends BaseDrizzleRecordAdapter<
  DidCommOutOfBandRecord,
  typeof postgres.didcommOutOfBand,
  typeof postgres,
  typeof sqlite.didcommOutOfBand,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(database, { postgres: postgres.didcommOutOfBand, sqlite: sqlite.didcommOutOfBand }, DidCommOutOfBandRecord, [], config)
  }

  public tagKeyMapping = {
    invitationId: ['outOfBandInvitation', '@id'],
  } as const

  public async getValues(record: DidCommOutOfBandRecord, agentContext?: AgentContext): Promise<DrizzleDidcommOutOfBandAdapterValues> {
    const {
      invitationRequestsThreadIds,
      recipientKeyFingerprints,
      role,
      state,
      threadId,
      recipientRoutingKeyFingerprint,

      // Queried based on `outOfBandInvitation.@id`
      // biome-ignore lint/correctness/noUnusedVariables: no explanation
      invitationId,

      ...customTags
    } = record.getTags()

    const rawValues = {
      invitationRequestsThreadIds,
      role,
      state,
      threadId,

      recipientKeyFingerprints,
      recipientRoutingKeyFingerprint,

      outOfBandInvitation: record.outOfBandInvitation.toJSON(),
      reusable: record.reusable,
      alias: record.alias,
      autoAcceptConnection: record.autoAcceptConnection,
      invitationInlineServiceKeys: record.invitationInlineServiceKeys,
      mediatorId: record.mediatorId,
      reuseConnectionId: record.reuseConnectionId,
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as any
  }

  public async toRecord(
    values: DrizzleDidcommOutOfBandAdapterValues,
    agentContext?: AgentContext
  ): Promise<DidCommOutOfBandRecord> {
    const {
      customTags,
      recipientKeyFingerprints,
      recipientRoutingKeyFingerprint,
      // biome-ignore lint/correctness/noUnusedVariables: no explanation
      threadId,
      // biome-ignore lint/correctness/noUnusedVariables: no explanation
      invitationRequestsThreadIds,
      ...remainingValues
    } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, DidCommOutOfBandRecord)
    record.setTags({
      ...(customTags as TagsBase),
      recipientKeyFingerprints: recipientKeyFingerprints ?? undefined,
      recipientRoutingKeyFingerprint: recipientRoutingKeyFingerprint ?? undefined,
    })

    return record
  }
}
