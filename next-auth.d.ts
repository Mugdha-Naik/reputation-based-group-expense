import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      reputationScore: number;
      upiId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    reputationScore: number;
    upiId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    reputationScore: number;
    upiId?: string;
  }
}

export {};
