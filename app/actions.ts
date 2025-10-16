"use server";

import { signIn } from "./auth";

export async function authenticate(email: string, password: string, twoFactorCode?: string) {
    try {
        const result = await signIn("credentials", {
            email: email,
            password: password,
            twoFactorCode: twoFactorCode,
            redirect: false
        });
        return result;
    } catch (error: any) {
        if (error.code === "invalid_credentials") {
            return { error: "Incorrect email or password" };
        } else if (error.code === "user_locked_out") {
            return { error: "Too many failed attempts. Try again later." };
        } else if (error.code === "two_factor_required") {
            return { error: "two_factor_required" };
        } else if (error.code === "invalid_2fa_code") {
            return { error: "invalid_2fa_code" };
        } else {
            throw Error("Failed to authenticate");
        }
    }
}

// Separate function to validate credentials without signing in (for checking 2FA requirement)
export async function validateCredentials(email: string, password: string) {
    try {
        const result = await signIn("credentials", {
            email: email,
            password: password,
            redirect: false
        });
        return result;
    } catch (error: any) {
        if (error.code === "invalid_credentials") {
            return { error: "Incorrect email or password" };
        } else if (error.code === "user_locked_out") {
            return { error: "Too many failed attempts. Try again later." };
        } else if (error.code === "two_factor_required") {
            return { error: "two_factor_required" };
        } else {
            throw Error("Failed to validate credentials");
        }
    }
}
