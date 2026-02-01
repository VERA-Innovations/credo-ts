import { userProfileDrizzleRecord } from './user-profile-record'
import { bundleMigrationDefinition } from '../util'
import type { DrizzleRecordBundle } from '../DrizzleRecord'

export const userProfileBundle = {
  name: 'user-profile',
  records: [userProfileDrizzleRecord],
  migrations: bundleMigrationDefinition('user-profile'),
} as const satisfies DrizzleRecordBundle
