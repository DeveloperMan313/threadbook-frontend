/**
 * Base API response
 */
export interface ApiResponse {
  error: string;
}

/**
 * Auth credentials
 */
export interface Credentials {
  username: string;
  email: string;
  password: string;
}
