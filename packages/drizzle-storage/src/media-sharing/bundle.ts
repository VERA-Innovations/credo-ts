import type { DrizzleRecordBundle } from '../DrizzleRecord'
import { bundleMigrationDefinition } from '../util'
import { didcommMediaSharingDrizzleRecord } from './media-sharing-record'

export const mediaSharingBundle = {
  name: 'media-sharing',
  records: [didcommMediaSharingDrizzleRecord],
  migrations: bundleMigrationDefinition('media-sharing'),
} as const satisfies DrizzleRecordBundle
