const AUTH_ERROR_KEYS = {
  "Invalid email or password": "auth.errors.invalidCredentials",
  "Too many failed attempts. Try again later.": "auth.errors.tooManyAttempts",
  "Current password is incorrect": "auth.errors.currentPasswordIncorrect",
  "Your current plan does not include this feature": "auth.errors.planFeature",
  "Authentication required": "auth.errors.authenticationRequired",
  "Administrator access required": "auth.errors.adminRequired",
  "Enter a valid email address": "auth.errors.invalidEmail",
  "An account with this email already exists": "auth.errors.duplicateEmail",
  "At least one active administrator is required": "auth.errors.lastAdmin",
  "Use the password-change endpoint for your own account":
    "auth.errors.ownPassword",
  "Request origin is not allowed": "auth.errors.originNotAllowed",
  "Authentication service is temporarily unavailable":
    "auth.errors.serviceUnavailable",
  "Not Found": "auth.errors.apiUnavailable",
  "User not found": "auth.errors.userNotFound",
};

export function translateAuthError(message, t) {
  if (typeof message !== "string" || !message) return t("auth.errors.generic");
  const key = AUTH_ERROR_KEYS[message];
  return t(key || "auth.errors.generic");
}
