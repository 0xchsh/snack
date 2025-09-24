import { nanoid, customAlphabet } from 'nanoid'

// URL-safe alphabet (no confusing chars like 0/O, 1/I/l)
const urlSafeAlphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz'

// Generate short ID for lists (8 characters, URL-safe)
export const generateListId = customAlphabet(urlSafeAlphabet, 8)

// Generate standard nanoid (21 characters) for other uses
export const generateId = nanoid

// Examples of generated IDs:
// generateListId() -> "K3mN7x2P" (8 chars)
// generateId() -> "V1StGXR8_Z5jdHi6B-myT" (21 chars)

export function isValidListId(id: string): boolean {
  return /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz]{8}$/.test(id)
}