/** Server errors are written for people (see API contract), so show them as-is. */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      if (/network request failed|failed to fetch/i.test(message)) {
        return 'No connection. Check your internet and try again.';
      }
      return message;
    }
  }
  return fallback;
}

const SIGNUP_REJECTED = "We couldn't create your account. You must be 18 or older and accept the Terms.";

/**
 * Supabase Auth hides the profile trigger's exception behind a generic message, so map
 * it (and the trigger's own wording, if it ever comes through) to an actionable one.
 */
export function signUpErrorMessage(error: unknown): string {
  const message = errorMessage(error);
  if (/database error saving new user|must be 18|terms/i.test(message)) return SIGNUP_REJECTED;
  return message;
}
