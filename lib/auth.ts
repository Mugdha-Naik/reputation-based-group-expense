import { NextAuthOptions } from "next-auth"
import  CredentialsProvider  from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import connectDB from "./db"
import User from "@/models/user.model"
import bcrypt from "bcryptjs"


// sign in

// email password is entered
// email is checked to see if user exists
// check password too
// signin successfully
// user data is returned

const authOptions:NextAuthOptions = {   // credentials provider
    providers: [
        // ways to login
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: {label:'Email', type: 'text'},
                password: {label: 'Password', type: 'password'}
            },
            async authorize(credentials){
                const email = credentials?.email
                const password = credentials?.password

                if(!email || !password){
                    throw new Error("Email or password is not found");
                }

                await connectDB()

                // first we check for email
                const user = await User.findOne({email}).select("+password")
                if(!user){
                    throw new Error("User not found, Please signin...");
                }

                if (typeof user.password !== "string" || user.password.length === 0) {
                    throw new Error("Account has no password set. Please register again.");
                }

                // now after email lets check for password
                const isMatch = await bcrypt.compare(password, user.password)
                if(!isMatch){
                    throw new Error("Invalid email or password");

                }
                return{
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    reputationScore: user.reputationScore,
                    upiId: user.upiId,
                }
            }
        })

    ],
    callbacks:{

        async signIn({ user, account, profile }){
            if (account?.provider !== "google") {
                return true;
            }

            const googleEmail = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
            if (!googleEmail.endsWith("@gmail.com")) {
                return false;
            }

            await connectDB()

            const existingUser = await User.findOne({ email: googleEmail });

            if (existingUser) {
                user.id = existingUser._id.toString()
                user.name = existingUser.name
                user.email = existingUser.email
                user.image = existingUser.image || user.image
                user.reputationScore = existingUser.reputationScore ?? 100
                user.upiId = existingUser.upiId
                return true;
            }

            const createdUser = await User.create({
                name: user.name || profile?.name || "Google User",
                email: googleEmail,
                image: user.image,
            });

            user.id = createdUser._id.toString()
            user.name = createdUser.name
            user.email = createdUser.email
            user.image = createdUser.image
            user.reputationScore = createdUser.reputationScore ?? 100
            user.upiId = createdUser.upiId
            return true;
        },

        // now put details of user in token
        async jwt({token, user, trigger, session}){
            if(user){
                token.id = user.id
                token.name = user.name
                token.email = user.email
                token.image = user.image
                token.reputationScore = user.reputationScore;
                token.upiId = user.upiId;
            }

            if (trigger === "update" && session?.user) {
                token.name = session.user.name ?? token.name
                token.email = session.user.email ?? token.email
                token.image = session.user.image ?? token.image
                token.upiId = session.user.upiId ?? token.upiId
            }
            return token
        },

        // now put user details in session
        // token is stored in cookies
        // therefore, instead of using user for storing user details in session, 
        // we use tokens

        session({session, token}){
            if(session.user){
                session.user.id = token.id as string
                session.user.email = token.email
                session.user.name = token.name
                session.user.image = token.image as string
                session.user.reputationScore = token.reputationScore as number
                session.user.upiId = token.upiId as string | undefined
            }
            return session;
        }

    },
    session:{

        strategy : 'jwt',
        maxAge: 60*60*24*30

    },
    pages:{

        signIn: '/login',
        error: '/login'

    },
    secret: process.env.NEXT_AUTH_SECRET
    
}

export default authOptions

// signin
// token generated
// we have put the user details in token
// put token details of user in session
