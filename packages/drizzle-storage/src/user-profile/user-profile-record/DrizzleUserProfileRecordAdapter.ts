import { UserProfileRecord } from '@2060.io/credo-ts-didcomm-user-profile'
import { JsonTransformer, type TagsBase, type AgentContext } from '@credo-ts/core'
import { type DrizzleAdapterRecordValues } from '../../adapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import * as postgres from './postgres'
import * as sqlite from './sqlite'
import { BaseDrizzleRecordAdapter } from '../../adapter/BaseDrizzleRecordAdapter'
import type { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'

type DrizzleUserProfileAdapterValues = DrizzleAdapterRecordValues<(typeof sqlite)['userProfile']>

export class DrizzleUserProfileRecordAdapter extends BaseDrizzleRecordAdapter<
  // Hint: Even though we get a type error here, the same seems to be occurring for all the other records as well.
  // Probably can be ignored
  UserProfileRecord,
  typeof postgres.userProfile,
  typeof postgres,
  typeof sqlite.userProfile,
  typeof sqlite
> {
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>, public config: DrizzleStorageModuleConfig) {
    super(database, { postgres: postgres.userProfile, sqlite: sqlite.userProfile }, UserProfileRecord, [], config)
  }

  public async getValues(record: UserProfileRecord, agentContext?: AgentContext) {
    const { displayName, preferredLanguage, ...customTags } = record.getTags()

    const rawValues = {
      displayName: typeof displayName === 'string' ? displayName : undefined,
      description: record.description ?? null,
      preferredLanguage: typeof preferredLanguage === 'string' ? preferredLanguage : undefined,

      displayPicture: record.displayPicture ? JsonTransformer.toJSON(record.displayPicture) : null,

      displayIcon: record.displayIcon ? JsonTransformer.toJSON(record.displayIcon) : null,

      metadata: record.metadata ? JsonTransformer.toJSON(record.metadata) : null,
    }

    // Await the asynchronous encryption/stringification logic
    const processedValues = await this.prepareValuesForDb(rawValues, agentContext)

    return {
      ...processedValues,
      customTags,
    } as any
  }

  public async toRecord(
    values: DrizzleUserProfileAdapterValues,
    agentContext?: AgentContext
  ): Promise<UserProfileRecord> {
    const { customTags, ...recordValues } = values

    // Await the asynchronous decryption/parsing logic
    const decryptedValues = await this.prepareRecordFromDb(recordValues, agentContext)

    const record = JsonTransformer.fromJSON(decryptedValues, UserProfileRecord)

    if (customTags) {
      record.setTags(customTags as TagsBase)
    }

    return record
  }
}
