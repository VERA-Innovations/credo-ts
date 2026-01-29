import type { DrizzleRecord } from '../../DrizzleRecord'
import { DrizzleDidcommMediaSharingRecordAdapter } from './DrizzleDidcommMediaSharingRecordAdapter'
import * as postgres from './postgres'
import * as sqlite from './sqlite'

export const didcommMediaSharingDrizzleRecord = {
  adapter: DrizzleDidcommMediaSharingRecordAdapter,
  postgres,
  sqlite,
} satisfies DrizzleRecord
