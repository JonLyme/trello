import jwt from 'jsonwebtoken';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured and contain at least 32 characters.');
  }
  return secret;
}

export function createAccessToken(user) {
  return jwt.sign(
    {
      role: user.role,
    },
    getSecret(),
    {
      subject: String(user.id),
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
      issuer: 'react-jwt-mysql-api',
      audience: 'react-jwt-mysql-client',
    },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getSecret(), {
    issuer: 'react-jwt-mysql-api',
    audience: 'react-jwt-mysql-client',
  });
}
