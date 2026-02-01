import { JsonTransformer, type TagsBase } from '@credo-ts/core'
import { BaseDrizzleRecordAdapter, type DrizzleAdapterRecordValues } from '../../adapter'
import type { DrizzleDatabase } from '../../DrizzleDatabase'
import { UserProfileRecord } from '@2060.io/credo-ts-didcomm-user-profile'
import * as postgres from './postgres'
import * as sqlite from './sqlite'

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
  public constructor(database: DrizzleDatabase<typeof postgres, typeof sqlite>) {
    super(
      database,
      { postgres: postgres.userProfile, sqlite: sqlite.userProfile },
      UserProfileRecord
    )
  }

  public getValues(record: UserProfileRecord) {
    const {
      displayName,
      preferredLanguage,
      ...customTags
    } = record.getTags()

    return {
      displayName: typeof displayName === 'string' ? displayName : undefined,
      description: record.description ?? null,
      preferredLanguage: typeof preferredLanguage === 'string' ? preferredLanguage : undefined,

      displayPicture: record.displayPicture
        ? JsonTransformer.toJSON(record.displayPicture)
        : null,

      displayIcon: record.displayIcon
        ? JsonTransformer.toJSON(record.displayIcon)
        : null,

      metadata: record.metadata
        ? JsonTransformer.toJSON(record.metadata)
        : null,

      customTags,
    }
  }

  public toRecord(values: DrizzleUserProfileAdapterValues): UserProfileRecord {
    const { customTags, ...recordValues } = values

    const record = JsonTransformer.fromJSON(recordValues, UserProfileRecord)

    if (customTags) {
      record.setTags(customTags as TagsBase)
    }

    return record
  }
}
