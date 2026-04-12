import { Account, NextAuthOptions, Profile, Session, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";
import connectDB from "../lib/db";
import User from "../models/user.model";

/// <reference types="node" />

interface Credentials {
  email: string;
  password: string;
}

type SessionUser = Session["user"] & {
  id?: string;
  reputationScore?: number;
  upiId?: string;
};

type AuthUser = NextAuthUser & {
  id?: string;
  reputationScore?: number;
  upiId?: string;
};

const MAX_SESSION_IMAGE_LENGTH = 2048;

function normalizeSessionImage(image: unknown): string | undefined {
  if (typeof image !== "string") return undefined;

  const trimmed = image.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith("data:") || trimmed.length > MAX_SESSION_IMAGE_LENGTH) {
    return undefined;
  }

  return trimmed;
}

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || "";

export const isGoogleAuthConfigured =
  googleClientId.length > 0 && googleClientSecret.length > 0;

export const authOptions: NextAuthOptions = {
  providers: [
    ...(isGoogleAuthConfigured
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Credentials | undefined) {
        if (!credentials) throw new Error("No credentials provided");

        const { email, password } = credentials;
        if (!email || !password) {
          throw new Error("Email or password is not found");
        }

        await connectDB();

        const user = await User.findOne({ email }).select("+password");
        if (!user) {
          throw new Error("User not found, Please signin...");
        }

        if (typeof user.password !== "string" || user.password.length === 0) {
          throw new Error("Account has no password set. Please register again.");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: normalizeSessionImage(user.image),
          reputationScore: user.reputationScore,
          upiId: user.upiId,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({
      user,
      account,
      profile,
    }: {
      user: AuthUser;
      account: Account | null;
      profile?: Profile;
    }) {
      if (account?.provider !== "google") return true;

      if (!isGoogleAuthConfigured) {
        throw new Error("Google sign-in is not configured yet.");
      }

      const googleEmail =
        typeof user.email === "string" ? user.email.trim().toLowerCase() : "";

      if (!googleEmail.endsWith("@gmail.com")) return false;

      await connectDB();

      const existingUser = await User.findOne({ email: googleEmail });

      if (existingUser) {
        user.id = existingUser._id.toString();
        user.name = existingUser.name;
        user.email = existingUser.email;
        user.image =
          normalizeSessionImage(existingUser.image) ||
          normalizeSessionImage(user.image);
        user.reputationScore = existingUser.reputationScore ?? 100;
        user.upiId = existingUser.upiId;
        return true;
      }

      const createdUser = await User.create({
        name: user.name || profile?.name || "Google User",
        email: googleEmail,
        image: user.image,
      });

      user.id = createdUser._id.toString();
      user.name = createdUser.name;
      user.email = createdUser.email;
      user.image = normalizeSessionImage(createdUser.image);
      user.reputationScore = createdUser.reputationScore ?? 100;
      user.upiId = createdUser.upiId;

      return true;
    },

    async jwt({
      token,
      user,
      trigger,
      session,
    }: {
      token: JWT;
      user?: AuthUser;
      trigger?: "signIn" | "signUp" | "update";
      session?: Session;
    }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = normalizeSessionImage(user.image);
        token.reputationScore = user.reputationScore;
        token.upiId = user.upiId;
      }

      if (trigger === "update" && session?.user) {
        const sessionUser = session.user as SessionUser;

        token.name = sessionUser.name ?? token.name;
        token.email = sessionUser.email ?? token.email;
        token.image =
          normalizeSessionImage(sessionUser.image) ?? token.image;
        token.upiId = sessionUser.upiId ?? token.upiId;
      }

      return token;
    },

    session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = normalizeSessionImage(token.image);
        session.user.reputationScore = token.reputationScore as number;
        session.user.upiId = token.upiId as string | undefined;
      }

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};