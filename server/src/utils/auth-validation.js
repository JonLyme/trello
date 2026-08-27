const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVISIBLE_CHARACTERS = /[\u0000-\u001F\u007F\u200B-\u200D\u2060\uFEFF]/gu;

const textField = (value) => {
  const singleValue = Array.isArray(value) ? value[0] : value;
  return typeof singleValue === 'string' ? singleValue : '';
};

function candidateBodies(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return [{}];

  // Canonical requests put fields at the top level. Nested candidates keep the
  // endpoint compatible with older clients that wrapped signup values.
  return [body, body.values, body.credentials, body.user, body.data]
    .filter((candidate) => candidate && typeof candidate === 'object' && !Array.isArray(candidate));
}

function firstTextField(body, keys) {
  for (const candidate of candidateBodies(body)) {
    for (const key of keys) {
      const value = textField(candidate[key]);
      if (value.trim()) return value;
    }
  }
  return '';
}

export function extractSignUpFields(body = {}) {
  return {
    name: firstTextField(body, ['name', 'fullName', 'full_name', 'username', 'userName']),
    email: firstTextField(body, ['email', 'emailAddress', 'email_address']),
    password: firstTextField(body, ['password', 'pass']),
  };
}

const normalizeName = (value) => textField(value)
  .normalize('NFC')
  .replace(INVISIBLE_CHARACTERS, '')
  .trim()
  .replace(/\s+/gu, ' ');

const characterCount = (value) => Array.from(value).length;

export function validateSignUp({ name, email, password } = {}) {
  const errors = [];
  const cleanName = normalizeName(name);
  const cleanEmail = textField(email).trim().toLowerCase();
  const cleanPassword = textField(password);
  const nameLength = characterCount(cleanName);

  if (nameLength < 2 || nameLength > 100) {
    errors.push('Name must contain between 2 and 100 characters.');
  }
  if (!EMAIL_PATTERN.test(cleanEmail) || cleanEmail.length > 191) {
    errors.push('Enter a valid email address.');
  }
  if (cleanPassword.length < 8 || cleanPassword.length > 72) {
    errors.push('Password must contain between 8 and 72 characters.');
  }

  return { errors, cleanName, cleanEmail, cleanPassword };
}

export function normalizeEmail(value) {
  return textField(value).trim().toLowerCase();
}

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(value);
}
