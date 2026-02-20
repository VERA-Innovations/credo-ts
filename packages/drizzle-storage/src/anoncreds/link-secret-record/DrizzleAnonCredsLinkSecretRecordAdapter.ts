import { AnonCredsLinkSecretRecord } from '@credo-ts/anoncreds'
import { AgentContext, JsonTransformer, type TagsBase } from '@credo-ts/core'
import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import type { DrizzleAdapterRecordValues } from '../../adapter/type'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleAnonCredsLinkSecretAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['anonCredsLinkSecret']>

export class DrizzleAnonCredsLinkSecretRecordAdapter extends BaseDrizzleRecordAdapter<
  AnonCredsLinkSecretRecord,
  typeof postgres.anonCredsLinkSecret,
  typeof postgres,
  typeof sqlite.anonCredsLinkSecret,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(
      database,
      { postgres: postgres.anonCredsLinkSecret, sqlite: sqlite.anonCredsLinkSecret },
      AnonCredsLinkSecretRecord,
      [],
      config
    )
  }

  public async getValues(record: AnonCredsLinkSecretRecord, agentContext?: AgentContext) {
    const { linkSecretId, isDefault, ...customTags } = record.getTags()

    const rawValues = {
      linkSecretId,
      isDefault,
      value: record.value,
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as DrizzleAnonCredsLinkSecretAdapterValues
  }

  public async toRecord(
    values: DrizzleAnonCredsLinkSecretAdapterValues,
    agentContext?: AgentContext
  ): Promise<AnonCredsLinkSecretRecord> {
    const { customTags, isDefault, ...remainingValues } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(remainingValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, AnonCredsLinkSecretRecord)

    record.setTags({
      ...customTags as TagsBase,
      isDefault: isDefault ?? undefined
    })

    return record
  }
}
