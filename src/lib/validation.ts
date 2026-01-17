import { AuthApi } from './api';
import { debounce } from './helpers';
import * as m from '$lib/paraglide/messages';

/**
 * Check if length is in bounds
 * @param {string} value - string
 * @returns {string?} - error message or null
 */
export function lengthGetError(
  value: string,
  bounds: { min?: number; max?: number }
): string | null {
  if (!bounds.min && !bounds.max) {
    throw Error('should pass at least one of bounds');
  }
  if (bounds.min && bounds.min < 0) {
    throw Error('min should be >= 0');
  }
  if (bounds.min && bounds.max && bounds.min > bounds.max) {
    throw Error('min should be <= max');
  }
  const min = bounds.min || 0;
  const max = bounds.max || Infinity;
  const isValid = value.length >= min && value.length <= max;
  if (isValid) {
    return null;
  }
  if (bounds.min && bounds.max) return m.between_min_and_max_symbols({ min, max });
  if (bounds.min) return m.at_least_min_symbols({ min });
  return m.no_more_than_max_symbols({ max });
}

const checkUsernameDebounced = debounce(AuthApi.checkUsername, 1000);

/**
 * Check username in signup
 * @param {string} value - username string
 * @returns {Promise<string?>} - error message or null
 */
export async function signupUsernameGetError(value: string): Promise<string | null> {
  const lengthError = lengthGetError(value, { min: 3, max: 32 });
  if (lengthError) {
    return lengthError;
  }
  if (!/^[a-zA-Z0-9]+$/.test(value)) {
    return m.only_letters_and_digits();
  }
  const checkUsernamePromise = checkUsernameDebounced({ username: value });
  if (!checkUsernamePromise) return null;
  const response = await checkUsernamePromise;
  if (response.is_exist) return m.username_already_taken();
  return null;
}

/**
 * Check nickname
 * @param {string} value - nickname string
 * @returns {string?} - error message or null
 */
export function nicknameGetError(value: string): string | null {
  return lengthGetError(value, { min: 3, max: 32 });
}

const checkEmailDebounced = debounce(AuthApi.checkEmail, 1000);

/**
 * Check email in signup
 * @param {string} value - email string
 * @returns {Promise<string?>} - error message or null
 */
export async function signupEmailGetError(value: string): Promise<string | null> {
  const emailRegexp = /^[^@]+@[^@]+\.[^@]+$/;
  const isValid = emailRegexp.test(value);
  if (!isValid) {
    return m.invalid_email();
  }
  const checkUsernamePromise = checkEmailDebounced({ email: value });
  if (!checkUsernamePromise) return null;
  const response = await checkUsernamePromise;
  if (response.is_exist) return m.email_already_taken();
  return null;
}

/**
 * Check email
 * @param {string} value - email string
 * @returns {string?} - error message or null
 */
export function emailGetError(value: string): string | null {
  const emailRegexp = /^[^@]+@[^@]+\.[^@]+$/;
  const isValid = emailRegexp.test(value);
  if (isValid) {
    return null;
  }
  return m.invalid_email();
}

/**
 * Check password in signup
 * @param {string} value - password string
 * @returns {string?} - error message or null
 */
export function signupPasswordGetError(value: string): string | null {
  const lengthError = lengthGetError(value, { min: 8 });
  if (lengthError) {
    return lengthError;
  }
  const isValid = /[a-z]+/.test(value) && /[A-Z]+/.test(value) && /[0-9]+/.test(value);
  if (isValid) {
    return null;
  }
  return m.capital_and_lowercase_letters_and_digits();
}

/**
 * Check password in signin
 * @param {string} value - password string
 * @returns {string?} - error message or null
 */
export function signinPasswordGetError(value: string): string | null {
  const isValid = value.length >= 8;
  if (isValid) {
    return null;
  }
  return m.incorrect_password();
}

/**
 * Get function checking repeated password
 * @param {string} passwordValue - repeated password string
 * @returns {(value: string) => string?} - function for repeated password
 */
export function getPasswordRepeatGetError(passwordValue: string): (value: string) => string | null {
  return (value: string) => {
    const isValid = passwordValue === value;
    if (!passwordValue || isValid) {
      return null;
    }
    return m.passwords_do_not_match();
  };
}

/**
 * Check thread title
 * @param {string} value - thread title string
 * @returns {string?} - error message or null
 */
export function threadTitleGetError(value: string): string | null {
  return lengthGetError(value, { min: 3, max: 32 });
}

/**
 * Check spool name
 * @param {string} value - spool name string
 * @returns {string?} - error message or null
 */
export function spoolNameGetError(value: string): string | null {
  return lengthGetError(value, { min: 3, max: 32 });
}

/**
 * Check invite usernames
 * @param {string} value - username list string
 * @returns {string?} - error message or null
 */
export function inviteUsernamesGetError(value: string): string | null {
  if (!value) {
    return m.input_usernames();
  }
  const limit = 100;
  if (value.split(' ').length > limit) {
    return m.no_more_than_limit_usernames({ limit });
  }
  return null;
}
