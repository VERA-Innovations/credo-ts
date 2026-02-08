import crypto from 'crypto'
import { AgentContext } from '@credo-ts/core'
import { EncryptionKeyProvider } from '../../encryption/EncryptionKeyProvider'
import { DrizzleStorageModuleConfig } from '../../DrizzleStorageModuleConfig'
import sodium from 'libsodium-wrappers'
import type { SQL } from 'drizzle-orm'
import { sql, customType } from 'drizzle-orm'

const ALGORITHM = 'aes-256-gcm'

// ============================================================================
// Old encryption approach - commented for reference
// ============================================================================
// move this to config/env later
// biome-ignore lint/style/noRestrictedGlobals: <just testing, maybe we can remove this lated>
// const BASIC_MESSAGE_SECRET_KEY = Buffer.from(
//     '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
//     'hex'
// )

// export async function encryptBasicMessageContent(agentContext: AgentContext, record: string): Promise<string> {

//   const content = record
//   if(!content) return record

//   await sodium.ready

//   const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
//   const cipher = sodium.crypto_secretbox_easy(
//         sodium.from_string(content as string)   ,
//         nonce,
//         BASIC_MESSAGE_SECRET_KEY
//     )

//   return `${sodium.to_base64(nonce)}:${sodium.to_base64(cipher)}`
// }

// export async function decryptBasicMessageContent(
//     agentContext: AgentContext,
//     record: string
// ): Promise<string> {

//   const encrypted = record
//   if(!encrypted || !encrypted.includes(':')) return record

// await sodium.ready

// const [nonceB64, cipherB64] = encrypted.split(':')

// const plain = sodium.crypto_secretbox_open_easy(
//     sodium.from_base64(cipherB64),
//     sodium.from_base64(nonceB64),
//     BASIC_MESSAGE_SECRET_KEY
// )

// return sodium.to_string(plain)
// }

// ============================================================================
// NEW: AES-256-GCM Encryption approach with AgentConfig key
// ============================================================================

/**
 * Derives encryption key from the raw key string using SHA-256
 * @param key - Raw encryption key string
 * @returns Derived 256-bit encryption key
 */
function deriveEncryptionKey(key: string): Buffer {
  return crypto.createHash('sha256').update(key).digest()
}

/**
 * Encrypts plaintext using AES-256-GCM
 * @param plaintext - The data to encrypt
 * @param encryptionKey - The encryption key string (will be derived)
 * @returns Base64 encoded encrypted data with IV and auth tag
 */
export function encryptDataWithKey(plaintext: string, encryptionKey: string): string {
  if (!plaintext) return plaintext

  try {
    const key = deriveEncryptionKey(encryptionKey)
    const iv = crypto.randomBytes(12) // 96-bit IV for GCM
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    let ciphertext = cipher.update(plaintext, 'utf8', 'base64')
    ciphertext += cipher.final('base64')
    const authTag = cipher.getAuthTag()
    const combined = Buffer.concat([iv, authTag, Buffer.from(ciphertext, 'base64')])

    return combined.toString('base64')
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Decrypts AES-256-GCM encrypted data
 * @param encryptedData - Base64 encoded encrypted data with IV and auth tag
 * @param encryptionKey - The encryption key string (will be derived)
 * @returns Decrypted plaintext
 */
export function decryptDataWithKey(encryptedData: string, encryptionKey: string): string {
  if (!encryptedData) return encryptedData

  try {
    const key = deriveEncryptionKey(encryptionKey)
    const combined = Buffer.from(encryptedData, 'base64')

    const iv = combined.subarray(0, 12)
    const authTag = combined.subarray(12, 28)
    const ciphertext = combined.subarray(28)
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    let plaintext = decipher.update(ciphertext, undefined, 'utf8')
    plaintext += decipher.final('utf8')

    return plaintext
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Gets encryption key from AgentContext config
 * @param agentContext - The agent context
 * @returns Encryption key string from config
 */
export function getEncryptionKeyFromAgentContext(agentContext: AgentContext): string {
  const cfg = (agentContext.config as any) || {}

  // 1. Prefer explicit agent config value
  if (cfg.encryptionKey) return cfg.encryptionKey

  // 2. Try to resolve EncryptionKeyProvider (registered by DrizzleStorageModule)
  try {
    const provider = agentContext.resolve(EncryptionKeyProvider)
    const key = provider.getEncryptionKey()
    if (key) return key
  } catch (err) {
    // TODO : Nothing - provider may not be registered OR Handle better
  }

  // 3. Fallback: if the drizzle module registered a config with an encryptionKey, use that
  try {
    const moduleCfg = agentContext.resolve(DrizzleStorageModuleConfig)
    if (moduleCfg && (moduleCfg as any).encryptionKey) return (moduleCfg as any).encryptionKey
  } catch (err) {
    // TODO : Nothing  - module config may not be registered in this context OR Handle better
  }

  throw new Error(
    'Encryption key not found. Set `encryptionKey` in AgentConfig or provide it via DrizzleStorageModule config.'
  )
}

// ============================================================================
// Drizzle Custom Types for Encrypted Columns
// ============================================================================

export type EncryptableColumnType = 'integer' | 'number' | 'boolean' | 'text' | 'varchar' | 'json' | 'date'

type ColumnTypeMap = {
  integer: number
  number: number
  boolean: boolean
  text: string
  varchar: string
  json: unknown
  date: Date
}

/**
 * Converts data to string for encryption
 */
function dataToString<T extends EncryptableColumnType>(data: ColumnTypeMap[T], columnType: T): string {
  switch (columnType) {
    case 'integer':
    case 'number':
      return (data as number).toString()
    case 'boolean':
      return (data as boolean).toString()
    case 'text':
    case 'varchar':
      return data as string
    case 'json':
      return JSON.stringify(data)
    case 'date':
      return (data as Date).toISOString()
    default:
      return String(data)
  }
}

/**
 * Converts decrypted string back to original type
 */
function stringToData<T extends EncryptableColumnType>(str: string, columnType: T): ColumnTypeMap[T] {
  switch (columnType) {
    case 'integer':
      return parseInt(str, 10) as ColumnTypeMap[T];
    case 'number':
      return parseFloat(str) as ColumnTypeMap[T];
    case 'boolean':
      return (str === 'true') as ColumnTypeMap[T];
    case 'text':
    case 'varchar':
      return str as ColumnTypeMap[T];
    case 'json':
      return JSON.parse(str) as ColumnTypeMap[T];
    case 'date':
      return new Date(str) as ColumnTypeMap[T];
    default:
      return str as ColumnTypeMap[T];
  }
}

/**
 * Creates an encrypted column with automatic encryption/decryption
 * This custom type stores encrypted data as TEXT in the database
 * @param columnName - The database column name
 * @param columnType - The original data type before encryption
 * @param encryptionKey - The encryption key (from AgentConfig)
 * @returns A Drizzle custom column type
 */
export function encryptedColumn<T extends EncryptableColumnType>(
  columnName: string,
  columnType: T,
  encryptionKey: string
) {
  return customType<{ data: ColumnTypeMap[T]; driverData: string }>({
    dataType() {
      return 'text'
    },

    fromDriver(encryptedValue: string): ColumnTypeMap[T] {
      try {
        if (!encryptedValue) {
          return (null as unknown) as ColumnTypeMap[T]
        }
        const decryptedString = decryptDataWithKey(encryptedValue, encryptionKey)
        return stringToData(decryptedString, columnType)
      } catch (error) {
        throw new Error(
          `Failed to decrypt column '${columnName}': ${error instanceof Error ? error.message : String(error)}`
        )
      }
    },

    toDriver(data: ColumnTypeMap[T]): SQL<unknown> {
      try {
        if (data === null || data === undefined) {
          return sql`NULL`
        }
        const stringData = dataToString(data, columnType)
        const encryptedValue = encryptDataWithKey(stringData, encryptionKey)
        return sql`${encryptedValue}`
      } catch (error) {
        throw new Error(
          `Failed to encrypt column '${columnName}': ${error instanceof Error ? error.message : String(error)}`
        )
      }
    },
  })(columnName)
}

// ============================================================================
// Async wrapper functions for use in StorageService
// ============================================================================

/**
 * Encrypts content using key from AgentContext
 * @param agentContext - The agent context
 * @param record - The data to encrypt
 * @returns Encrypted data as base64 string
 */
export async function encryptBasicMessageContent(agentContext: AgentContext, record: string): Promise<string> {
  const content = record
  if (!content) return record

  const encryptionKey = getEncryptionKeyFromAgentContext(agentContext)
  return encryptDataWithKey(content, encryptionKey)
}

/**
 * Decrypts content using key from AgentContext
 * @param agentContext - The agent context
 * @param record - The encrypted data
 * @returns Decrypted plaintext
 */
export async function decryptBasicMessageContent(agentContext: AgentContext, record: string): Promise<string> {
  const encrypted = record
  if (!encrypted) return record

  const encryptionKey = getEncryptionKeyFromAgentContext(agentContext)
  return decryptDataWithKey(encrypted, encryptionKey)
}
