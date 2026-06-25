import bcrypt from 'bcryptjs'

// Hachage des mots de passe (bcrypt, pur JS — portable Windows/Linux).
// Le plan mentionne argon2/bcrypt : bcryptjs évite la compilation native.
const ROUNDS = 12

export function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS)
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash)
}
