import type { DrizzleRecordBundle } from '../DrizzleRecord'
import { bundleMigrationDefinition } from '../util'
import { userProfileDrizzleRecord } from './user-profile-record'

export const userProfileBundle = {
  name: 'user-profile',
  records: [userProfileDrizzleRecord],
  migrations: bundleMigrationDefinition('user-profile'),
} as const satisfies DrizzleRecordBundle
