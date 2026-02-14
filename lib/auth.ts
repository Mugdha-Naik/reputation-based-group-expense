import { NextAuthOptions } from "next-auth"
import  CredentialsProvider  from "next-auth/providers/credentials"
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
                }
            }
        })

    ],
    callbacks:{

        // now put details of user in token
        async jwt({token, user}){
            if(user){
                token.id = user.id
                token.name = user.name
                token.email = user.email
                token.image = user.image
                token.reputationScore = user.reputationScore;
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
