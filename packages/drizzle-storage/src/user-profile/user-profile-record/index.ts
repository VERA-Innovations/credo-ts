import type { DrizzleRecord } from '../../DrizzleRecord'
import { DrizzleUserProfileRecordAdapter } from './DrizzleUserProfileRecordAdapter'
import * as postgres from './postgres'
import * as sqlite from './sqlite'

export const userProfileDrizzleRecord = {
  adapter: DrizzleUserProfileRecordAdapter,
  postgres,
  sqlite,
} satisfies DrizzleRecord
