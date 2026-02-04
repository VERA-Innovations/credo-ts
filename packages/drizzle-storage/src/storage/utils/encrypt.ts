import { AgentContext } from '@credo-ts/core'
import sodium from 'libsodium-wrappers'


// move this to config/env later
// biome-ignore lint/style/noRestrictedGlobals: <just testing, maybe we can remove this lated>
const BASIC_MESSAGE_SECRET_KEY = Buffer.from(
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    'hex'
)

export async function encryptBasicMessageContent(agentContext: AgentContext, record: string): Promise<string> {

  const content = record
  if(!content) return record

  await sodium.ready

  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
  const cipher = sodium.crypto_secretbox_easy(
        sodium.from_string(content as string)   ,
        nonce,
        BASIC_MESSAGE_SECRET_KEY
    )

  return `${sodium.to_base64(nonce)}:${sodium.to_base64(cipher)}`
}

export async function decryptBasicMessageContent(
    agentContext: AgentContext,
    record: string
): Promise<string> {

  const encrypted = record
  if(!encrypted || !encrypted.includes(':')) return record

await sodium.ready

const [nonceB64, cipherB64] = encrypted.split(':')

const plain = sodium.crypto_secretbox_open_easy(
    sodium.from_base64(cipherB64),
    sodium.from_base64(nonceB64),
    BASIC_MESSAGE_SECRET_KEY
)

return sodium.to_string(plain)
}
