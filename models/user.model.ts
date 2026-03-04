import mongoose from "mongoose"

interface Iuser { 
    _id?: mongoose.Types.ObjectId,
    name: string,
    image?: string,
    email: string,
    upiId?: string,
    password: string,
    createdAt?: Date,
    updatedAt?: Date,
    reputationScore?: number
}

const userSchema = new mongoose.Schema<Iuser>({
    name: {
        type: String,
        required: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // 🔒 VERY IMPORTANT
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    upiId: {
        type: String,
        trim: true,
    },
    image: {
        type: String   
    },
    reputationScore: {
    type: Number,
    default: 100
}

}, 
{
    timestamps: true
})

const User =
  mongoose.models.User || mongoose.model<Iuser>("User", userSchema);

export default User
