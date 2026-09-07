import { nameIssue, emailIssue } from "./moderation";

// Signup checks must not reject passwords that already belong to older accounts.
export function authFormIssues({ mode, name = "", email = "", password = "" }) {
  const issues = {};
  if (mode === "signup") {
    if (!name.trim()) issues.name = "Enter the name you'd like your travel companions to see.";
    else if (nameIssue(name)) issues.name = nameIssue(name);
  }
  if (!email.trim()) issues.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) issues.email = "Enter a valid email address, like you@example.com.";
  else if (mode === "signup" && emailIssue(email)) issues.email = emailIssue(email);
  if (mode !== "reset") {
    if (!password) issues.password = "Enter your password.";
    else if (mode === "signup" && password.length < 8) issues.password = "Choose a password with at least 8 characters.";
  }
  return issues;
}

export function authErrorMessage(error) {
  if (error?.code === "invalid_credentials") return "That email and password don't match. Try again, or reset your password.";
  if (error?.code === "email_not_confirmed") return "Confirm your email before signing in. Check your inbox for the confirmation link.";
  if (error?.status === 429 || ["over_email_send_rate_limit", "over_request_rate_limit"].includes(error?.code)) return "Please wait a little before trying again. Too many requests were sent.";
  if (error?.name === "AuthRetryableFetchError" || error instanceof TypeError) return "We couldn't connect. Check your internet connection and try again.";
  return error?.message || "Something went wrong. Please try again.";
}
