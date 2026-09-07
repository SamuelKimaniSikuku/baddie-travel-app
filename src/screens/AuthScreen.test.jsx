import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, create } from "react-test-renderer";
import { authService } from "../services/auth";
import { supabase } from "../lib/supabase";
import AuthScreen from "./AuthScreen";

// Exercise the real form and service; replace only Supabase's network boundary.
vi.mock("../lib/supabase", () => ({
  isDemo: false,
  supabase: { auth: {
    signInWithPassword: vi.fn(), signUp: vi.fn(), resend: vi.fn(), resetPasswordForEmail: vi.fn()
  } }
}));

const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
let view, onLogin;
const input = (id, value) => act(() => view.root.findByProps({ id }).props.onChange({ target: { value } }));
const button = label => view.root.findAllByType("button").find(node => node.children.join("") === label);
const submit = () => view.root.findByType("form").props.onSubmit({ preventDefault() {} });
const rendered = () => JSON.stringify(view.toJSON());

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.stubGlobal("window", { location: { origin: "https://www.baddies.travel" } });
  onLogin = vi.fn();
  act(() => { view = create(<AuthScreen onLogin={onLogin} />); });
});

afterEach(() => {
  act(() => view.unmount());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("sign-in and recovery flows", () => {
  it("opens directly on sign-in and supports password visibility", () => {
    expect(view.root.findByType("form")).toBeTruthy();
    expect(view.root.findByProps({ id: "auth-password" }).props.autoComplete).toBe("current-password");
    input("auth-password", "keep-this-password");
    act(() => button("Show").props.onClick());
    expect(view.root.findByProps({ id: "auth-password" }).props.type).toBe("text");
    act(() => button("Hide").props.onClick());
    expect(view.root.findByProps({ id: "auth-password" }).props.value).toBe("keep-this-password");
  });

  it("blocks duplicate submits and releases the form after a failed request", async () => {
    const request = deferred();
    supabase.auth.signInWithPassword.mockReturnValueOnce(request.promise);
    input("auth-email", " sam@example.com ");
    input("auth-password", "old123");
    let first;
    act(() => { first = submit(); submit(); });
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(1);
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: "sam@example.com", password: "old123" });
    await act(async () => { request.reject(new TypeError("Failed to fetch")); await first; });
    expect(rendered()).toMatch(/internet connection/);
    expect(view.root.findByProps({ type: "submit" }).props.disabled).toBe(false);
    supabase.auth.signInWithPassword.mockResolvedValueOnce({ data: { user: { id: "test-user" }, session: {} }, error: null });
    await act(async () => { await submit(); });
    expect(onLogin).toHaveBeenCalledWith({ id: "test-user" });
  });

  it("resends signup confirmation through resend, with a cooldown and no second signup", async () => {
    supabase.auth.signUp.mockResolvedValue({ data: { user: { id: "new-user" }, session: null }, error: null });
    supabase.auth.resend.mockResolvedValue({ error: null });
    act(() => button("Create an account").props.onClick());
    input("auth-name", " Sam ");
    input("auth-email", " sam@example.com ");
    input("auth-password", "my-new-password");
    await act(async () => { await submit(); });
    expect(onLogin).not.toHaveBeenCalled();
    expect(rendered()).toMatch(/Check your inbox/);
    expect(button("Resend email in 60s").props.disabled).toBe(true);
    act(() => vi.advanceTimersByTime(60000));
    await act(async () => { await button("Resend confirmation email").props.onClick(); });
    expect(supabase.auth.signUp).toHaveBeenCalledTimes(1);
    expect(supabase.auth.resend).toHaveBeenCalledWith({ type: "signup", email: "sam@example.com", options: { emailRedirectTo: "https://www.baddies.travel" } });
    expect(button("Resend email in 60s").props.disabled).toBe(true);
    expect(rendered()).not.toContain("my-new-password");
  });

  it("recovers from reset errors and requests a reset without requiring a password", async () => {
    act(() => button("Forgot password?").props.onClick());
    expect(view.root.findAllByProps({ id: "auth-password" })).toHaveLength(0);
    input("auth-email", " sam@example.com ");
    supabase.auth.resetPasswordForEmail.mockRejectedValueOnce(new TypeError("Network offline"));
    await act(async () => { await submit(); });
    expect(view.root.findByProps({ type: "submit" }).props.disabled).toBe(false);
    supabase.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: null });
    await act(async () => { await submit(); });
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenLastCalledWith("sam@example.com", { redirectTo: "https://www.baddies.travel/reset-password" });
    expect(rendered()).toMatch(/If there's an account/);
  });
});
