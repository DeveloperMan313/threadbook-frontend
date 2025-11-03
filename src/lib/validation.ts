/**
 * Check if length is in bounds
 * @param {string} value - string
 * @returns {string?} - error message or null
 */
export function lengthGetError(value: string, bounds: { min?: number, max?: number }): string | null {
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
  if (min && max) return `Between ${min} and ${max} symbols`;
  if (min) return `At least ${min} symbols`;
  return `No more than ${max} symbols`;
}

/**
 * Check username
 * @param {string} value - username string
 * @returns {string?} - error message or null
 */
export function usernameGetError(value: string): string | null {
  return lengthGetError(value, { min: 3, max: 16 });
}

/**
 * Check nickname
 * @param {string} value - nickname string
 * @returns {string?} - error message or null
 */
export function nicknameGetError(value: string): string | null {
  return lengthGetError(value, { min: 3, max: 16 });
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
  return 'Invalid email';
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
  const isValid =
    /[a-z]+/.test(value) &&
    /[A-Z]+/.test(value) &&
    /[0-9]+/.test(value);
  if (isValid) {
    return null;
  }
  return `Capital and lowercase letters and digits`;
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
  return `Incorrect password`;
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
    return 'Passwords do not match';
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
 * Check spool name
 * @param {string} value - spool name string
 * @returns {string?} - error message or null
 */
export function spoolNameGetError(value: string): string | null {
  const minLength = 4;
  const isValid = value.length >= minLength;
  if (isValid) {
    return null;
  }
  return `At least ${minLength} symbols`;
}
