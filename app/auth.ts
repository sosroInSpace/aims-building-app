import { JC_Utils_Dates } from "./Utils";
import { GlobalSettingsBusiness } from "./api/globalSettings/business";
import { UserBusiness } from "./api/user/business";
import { UserModel } from "./models/User";
import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin, DefaultSession, NextAuthConfig } from "next-auth";
import "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";

declare module "next-auth" {
    interface User extends UserModel {}
    interface Session {
        user: UserModel & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
    interface JWT {
        dbUser: UserModel;
    }
}

export const authOptions: NextAuthConfig = {
    secret: process.env.AUTH_SECRET,
    providers: [
        Credentials({
            // You can specify which fields should be submitted, by adding keys to the `credentials` object.
            // e.g. domain, username, password, 2FA token, etc.
            credentials: {
                email: {},
                password: {},
                twoFactorCode: {}
            },

            authorize: async credentials => {
                if (!credentials) {
                    throw new Error("No credentials supplied.");
                }
                let user: UserModel = await UserBusiness.GetByEmail((credentials.email as string).toLowerCase());
                // Check if user exists
                if (!user) {
                    throw new InvalidLoginError("User not found.");
                }
                // Check if locked out (lockout duration is 30 mins)
                else if (user.LoginLockoutDate && JC_Utils_Dates.minutesBetweenDates(user.LoginLockoutDate, new Date()) < 30) {
                    throw new UserLockedOutError("User locked out.");
                }
                // Check for correct password
                else if (!(await bcrypt.compare(credentials.password as string, user.PasswordHash))) {
                    // Increment failed attempts and lockout if required
                    let nowLockedOut = await UserBusiness.IncrementFailedAttemptsByEmail((credentials.email as string).toLowerCase());
                    if (nowLockedOut) {
                        throw new UserLockedOutError("User locked out.");
                    } else {
                        throw new InvalidLoginError("User not found.");
                    }
                } else {
                    // Password is correct, now check for 2FA
                    if (user.Enable2fa) {
                        const twoFactorCode = credentials.twoFactorCode as string;

                        if (!twoFactorCode) {
                            // 2FA is required but no code provided
                            throw new TwoFactorRequiredError("Two-factor authentication required.");
                        }

                        // Validate 2FA code
                        const isValidCode = await UserBusiness.Validate2FACode((credentials.email as string).toLowerCase(), twoFactorCode);
                        if (!isValidCode) {
                            throw new Invalid2FACodeError("Invalid or expired 2FA code.");
                        }

                        // Clear the 2FA code after successful validation
                        await UserBusiness.Clear2FACode((credentials.email as string).toLowerCase());
                    }

                    // Reset failed attempts
                    await UserBusiness.ResetFailedAttemptsByEmail((credentials.email as string).toLowerCase());
                    // Return
                    return {
                        ...user,
                        id: user.Id
                    };
                }
            }
        })

        // GoogleProvider({
        //   clientId: process.env.GOOGLE_CLIENT_ID as string,
        //   clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        // })
    ],
    // Cookie configuration for incognito mode compatibility
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production" || process.env.NEXTAUTH_URL?.startsWith("https://"),
                domain: process.env.NODE_ENV === "development" ? "localhost" : undefined
            }
        },
        callbackUrl: {
            name: `next-auth.callback-url`,
            options: {
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production" || process.env.NEXTAUTH_URL?.startsWith("https://"),
                domain: process.env.NODE_ENV === "development" ? "localhost" : undefined
            }
        },
        csrfToken: {
            name: `next-auth.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production" || process.env.NEXTAUTH_URL?.startsWith("https://"),
                domain: process.env.NODE_ENV === "development" ? "localhost" : undefined
            }
        }
    },
    // Use JWT strategy for better incognito mode compatibility
    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 59 // 30 days
    },
    // Trust host for Vercel deployment
    trustHost: true,
    // Add debug logging for incognito mode issues
    debug: process.env.NODE_ENV === "development",
    // Configure pages for better error handling
    pages: {
        signIn: "/login",
        error: "/login" // Redirect errors back to login
    },
    callbacks: {
        // async signIn({ user, account, profile }) {
        //     var test = "0 mate";
        //     return true;``
        //     // const response = await axios.post(
        //     //     process.env.NEXT_PUBLIC_API_BASE_URL + "/auth/userExists",
        //     //     { email: profile?.email }
        //     // );
        //     // if (response && response.data?.value === true) {
        //     //     return true;
        //     // } else {
        //     //     const data = {
        //     //     firstName: profile.given_name,
        //     //     lastName: profile.family_name,
        //     //     email: profile.email,
        //     //     profileUrl: profile.picture,
        //     //     };
        //     //     const response = await axios.post(
        //     //     process.env.NEXT_PUBLIC_API_BASE_URL + "/auth/signup",
        //     //     data
        //     //     );
        //     //     return true;
        //     // }
        // },
        async jwt({ token, user }) {
            try {
                // IF user exists (means user just logged in) OR force refresh user is set, get extra fields from DB and save to JWT
                const forceRefreshSetting = await GlobalSettingsBusiness.Get("ForceRefreshAuthToken");
                if (user || (forceRefreshSetting && forceRefreshSetting.Value === "1")) {
                    let dbUser: UserModel = await UserBusiness.Get(token.sub as string);
                    token.dbUser = dbUser;
                    token.PasswordHash = "";
                    if (forceRefreshSetting) {
                        await GlobalSettingsBusiness.UpdateValue("ForceRefreshAuthToken", "0");
                    }
                }
            } catch (error) {
                // If there's an error (like the setting doesn't exist), just use the user data
                if (user) {
                    token.dbUser = user as unknown as UserModel;
                    token.PasswordHash = "";
                }
            }
            return token;
        },
        async session({ session, token }) {
            try {
                // Get all User data from token, including extra DB data added in "jwt()" callback
                if (token.dbUser) {
                    session.user = {
                        ...token.dbUser,
                        id: token.sub as string,
                        email: token.dbUser.Email,
                        emailVerified: null
                    } as any;
                } else {
                    // If dbUser is not available, try to get it from the database
                    try {
                        const dbUser = await UserBusiness.Get(token.sub as string);
                        if (dbUser) {
                            session.user = {
                                ...dbUser,
                                id: token.sub as string,
                                email: dbUser.Email,
                                emailVerified: null
                            } as any;
                            // Update the token for future use
                            token.dbUser = dbUser;
                        }
                    } catch (error) {
                        console.error("Failed to fetch user data in session callback:", error);
                    }
                }
            } catch (error) {
                console.error("Error in session callback:", error);
            }
            return session;
        }
    }
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);

// - ERRORS = //

export class InvalidLoginError extends CredentialsSignin {
    code = "invalid_credentials";
}
export class UserLockedOutError extends CredentialsSignin {
    code = "user_locked_out";
}
export class TwoFactorRequiredError extends CredentialsSignin {
    code = "two_factor_required";
}
export class Invalid2FACodeError extends CredentialsSignin {
    code = "invalid_2fa_code";
}
