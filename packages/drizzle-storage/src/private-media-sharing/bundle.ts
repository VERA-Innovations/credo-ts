import type { DrizzleRecordBundle } from '../DrizzleRecord'
import { bundleMigrationDefinition } from '../util'
import { didcommPrivateMediaSharingDrizzleRecord } from './private-media-sharing-record'

export const privateMediaSharingBundle = {
  name: 'private-media-sharing',
  records: [didcommPrivateMediaSharingDrizzleRecord],
  migrations: bundleMigrationDefinition('private-media-sharing'),
} as const satisfies DrizzleRecordBundle
