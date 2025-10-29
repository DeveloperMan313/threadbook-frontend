/**
 * Check username
 * @param {string} value - username string
 * @returns {string?} - error message or null
 */
export function usernameGetError(value: string): string | null {
  const minLength = 4;
  const isValid = value.length >= minLength;
  if (isValid) {
    return null;
  }
  return `At least ${minLength} symbols`;
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

const passMinLength = 8;

/**
 * Check password in signup
 * @param {string} value - password string
 * @returns {string?} - error message or null
 */
export function signupPasswordGetError(value: string): string | null {
  const isValid =
    value.length >= passMinLength &&
    /[a-z]+/.test(value) &&
    /[A-Z]+/.test(value) &&
    /[0-9]+/.test(value);
  if (isValid) {
    return null;
  }
  return `At least ${passMinLength} symbols, capital and lowercase letters and digits`;
}

/**
 * Check password in signin
 * @param {string} value - password string
 * @returns {string?} - error message or null
 */
export function signinPasswordGetError(value: string): string | null {
  const isValid = value.length >= passMinLength;
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
  const minLength = 4;
  const isValid = value.length >= minLength;
  if (isValid) {
    return null;
  }
  return `At least ${minLength} symbols`;
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
