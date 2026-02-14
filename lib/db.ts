import { connect } from "mongoose";

let mongodburl = process.env.MONGODB_URL

// check if mongodb url is given in .env
if(!mongodburl){
    throw new Error("mongodb url not found");
}

// check if connection with db already exists
// there can be 2 possibilities
// 1. connection already there
// 2. connection in promise

let cached = global.mongoose

if(!cached){
    cached = global.mongoose = {conn: null, promise: null}
}

// 
const connectDB = async () => {

    // if cached has the connection simply return it
    if(cached.conn){
        console.log("cached db connected")
        return cached.conn
    }

    if(!cached.promise){
        cached.promise = connect(mongodburl)
        .then((c) => c.connection);
    }

    // if the connection is in pending/promise
    try{
        cached.conn = await cached.promise;
        console.log("db connected")
    }catch(error){
        throw error
    }
    return cached.conn
}
export default connectDB