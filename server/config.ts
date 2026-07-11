export function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET deve essere configurato con almeno 32 caratteri");
  }
  return secret;
}
