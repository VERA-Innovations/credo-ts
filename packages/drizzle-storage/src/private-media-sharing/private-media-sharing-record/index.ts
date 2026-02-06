import type { DrizzleRecord } from '../../DrizzleRecord'
import { DrizzleDidcommPrivateMediaSharingRecordAdapter } from './DrizzleDidcommPrivateMediaSharingRecordAdapter'
import * as postgres from './postgres'
import * as sqlite from './sqlite'

export const didcommPrivateMediaSharingDrizzleRecord = {
  adapter: DrizzleDidcommPrivateMediaSharingRecordAdapter,
  postgres,
  sqlite,
} satisfies DrizzleRecord
