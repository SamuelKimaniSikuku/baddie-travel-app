import { describe, expect, it } from "vitest";
import { authFormIssues, authErrorMessage } from "./auth-form";

describe("authentication form validation", () => {
  it("accepts valid signup details with surrounding email whitespace", () => {
    expect(authFormIssues({ mode: "signup", name: "Sam", email: " sam@example.com ", password: "a-long-password" })).toEqual({});
  });
  it("requires signup fields and applies the existing name and inbox moderation", () => {
    expect(Object.keys(authFormIssues({ mode: "signup" }))).toEqual(["name", "email", "password"]);
    expect(authFormIssues({ mode: "signup", name: "Sam", email: "sam@mailinator.com", password: "a-long-password" }).email).toMatch(/Temporary/);
    expect(authFormIssues({ mode: "signup", name: "Adolf Hitler", email: "sam@example.com", password: "a-long-password" }).name).toBeTruthy();
  });
  it("does not apply new-account restrictions to existing logins or recovery", () => {
    expect(authFormIssues({ mode: "login", email: "sam@mailinator.com", password: "old123" })).toEqual({});
    expect(authFormIssues({ mode: "reset", email: "sam@mailinator.com" })).toEqual({});
    expect(authFormIssues({ mode: "signup", name: "Sam", email: "sam@example.com", password: "old123" }).password).toMatch(/8 characters/);
  });
  it("requires a usable email in all modes", () => {
    for (const mode of ["login", "signup", "reset"]) {
      expect(authFormIssues({ mode, email: "not-an-address" }).email).toMatch(/valid email/);
    }
  });
});

describe("authentication error feedback", () => {
  it("explains credential, confirmation and rate-limit errors", () => {
    expect(authErrorMessage({ code: "invalid_credentials" })).toMatch(/reset your password/);
    expect(authErrorMessage({ code: "email_not_confirmed" })).toMatch(/Confirm your email/);
    expect(authErrorMessage({ status: 429 })).toMatch(/wait/);
  });
  it("offers a retry after network failure", () => {
    expect(authErrorMessage(new TypeError("Failed to fetch"))).toMatch(/internet connection/);
  });
});
