import assert from 'node:assert/strict';
import test from 'node:test';
import { extractSignUpFields, validateSignUp } from '../src/utils/auth-validation.js';

test('accepts and normalizes a normal full name', () => {
  const result = validateSignUp({
    name: '  Michael   Cee  ',
    email: ' USER@example.com ',
    password: 'password123',
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.cleanName, 'Michael Cee');
  assert.equal(result.cleanEmail, 'user@example.com');
});

test('counts Unicode code points instead of UTF-16 code units', () => {
  const result = validateSignUp({
    name: '李明',
    email: 'li@example.com',
    password: 'password123',
  });

  assert.deepEqual(result.errors, []);
});

test('handles multipart duplicate fields safely', () => {
  const result = validateSignUp({
    name: ['Alex Morgan', 'ignored'],
    email: ['alex@example.com'],
    password: ['password123'],
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.cleanName, 'Alex Morgan');
});

test('removes invisible autofill characters from names', () => {
  const result = validateSignUp({
    name: '\u200BMichael\uFEFF Cee',
    email: 'michael@example.com',
    password: 'password123',
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.cleanName, 'Michael Cee');
});

test('accepts legacy fullName field during rolling updates', () => {
  const fields = extractSignUpFields({
    fullName: 'Alex Morgan',
    emailAddress: 'alex@example.com',
    password: 'password123',
  });
  const result = validateSignUp(fields);

  assert.deepEqual(result.errors, []);
  assert.equal(result.cleanName, 'Alex Morgan');
});

test('prefers a non-empty alias when canonical name is blank', () => {
  const fields = extractSignUpFields({
    name: '   ',
    full_name: 'Alex Morgan',
    email: 'alex@example.com',
    password: 'password123',
  });

  assert.equal(fields.name, 'Alex Morgan');
});

test('rejects a truly empty name', () => {
  const result = validateSignUp({
    name: '   ',
    email: 'user@example.com',
    password: 'password123',
  });

  assert.equal(result.errors[0], 'Name must contain between 2 and 100 characters.');
});

test('accepts signup fields wrapped by an older client', () => {
  const fields = extractSignUpFields({
    credentials: {
      name: 'Michael Cee',
      email: 'michael@example.com',
      password: 'password123',
    },
  });
  const result = validateSignUp(fields);

  assert.deepEqual(result.errors, []);
  assert.equal(result.cleanName, 'Michael Cee');
});

test('removes control characters accidentally inserted by autofill', () => {
  const result = validateSignUp({
    name: '\u0000Michael\u0007 Cee',
    email: 'michael@example.com',
    password: 'password123',
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.cleanName, 'Michael Cee');
});
