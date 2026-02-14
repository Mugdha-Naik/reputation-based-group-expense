import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      reputationScore: number;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    reputationScore: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    reputationScore: number;
  }
}

export {};
