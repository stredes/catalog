import { describe, expect, it } from 'vitest';
import { validateRut, clientSchema } from '../application/dtos/ClientDtos';

describe('validateRut', () => {
  describe('valid RUTs', () => {
    it('accepts formatted RUT with dots: 12.345.678-5', () => {
      expect(validateRut('12.345.678-5')).toBe(true);
    });

    it('accepts short formatted RUT with K verifier: 8.888.888-K', () => {
      expect(validateRut('8.888.888-K')).toBe(true);
    });

    it('accepts RUT without dots: 99999999-9', () => {
      expect(validateRut('99999999-9')).toBe(true);
    });

    it('accepts lowercase k as verifier', () => {
      expect(validateRut('8.888.888-k')).toBe(true);
    });

    it('accepts RUT with leading whitespace', () => {
      expect(validateRut('  12.345.678-5')).toBe(true);
    });

    it('accepts RUT with trailing whitespace', () => {
      expect(validateRut('12.345.678-5  ')).toBe(true);
    });

    it('accepts 7-digit body: 2.222.222-8', () => {
      expect(validateRut('2.222.222-8')).toBe(true);
    });
  });

  describe('invalid RUTs', () => {
    it('rejects RUT with wrong check digit', () => {
      expect(validateRut('12.345.678-9')).toBe(false);
    });

    it('rejects RUT with wrong check digit on short body', () => {
      expect(validateRut('1.111.111-1')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(validateRut('')).toBe(false);
    });

    it('rejects string without dash', () => {
      expect(validateRut('123456789')).toBe(false);
    });

    it('rejects string with letters in body', () => {
      expect(validateRut('abc.def.gh-i')).toBe(false);
    });

    it('rejects string too short', () => {
      expect(validateRut('12-3')).toBe(false);
    });

    it('rejects string too long (9 digit body)', () => {
      expect(validateRut('123456789-1')).toBe(false);
    });

    it('rejects body with only dots', () => {
      expect(validateRut('.......-K')).toBe(false);
    });

    it('rejects RUT with special characters', () => {
      expect(validateRut('12.345.678-@')).toBe(false);
    });

    it('rejects random string', () => {
      expect(validateRut('hello world')).toBe(false);
    });
  });
});

describe('clientSchema', () => {
  it('validates a complete valid client', () => {
    const result = clientSchema.safeParse({
      name: 'Juan Perez',
      rut: '12.345.678-5',
      email: 'juan@test.com',
      phone: '+56912345678',
      address: 'Santiago',
    });
    expect(result.success).toBe(true);
  });

  it('rejects client with invalid RUT', () => {
    const result = clientSchema.safeParse({
      name: 'Juan Perez',
      rut: '12.345.678-9',
    });
    expect(result.success).toBe(false);
  });

  it('accepts client without RUT (optional)', () => {
    const result = clientSchema.safeParse({
      name: 'Juan Perez',
    });
    expect(result.success).toBe(true);
  });

  it('rejects client with empty name', () => {
    const result = clientSchema.safeParse({
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects client with short name', () => {
    const result = clientSchema.safeParse({
      name: 'J',
    });
    expect(result.success).toBe(false);
  });

  it('rejects client with invalid email', () => {
    const result = clientSchema.safeParse({
      name: 'Juan Perez',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});
