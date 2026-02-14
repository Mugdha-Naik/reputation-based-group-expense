import mongoose from "mongoose"
import { TurborepoAccessTraceResult } from "next/dist/build/turborepo-access-trace"

interface IGroup{
    name: string,
    createdBy: mongoose.Types.ObjectId
    members:mongoose.Types.ObjectId[]
    createdAt?: Date
    updatedAt?: Date
}

const groupSchema = new mongoose.Schema<IGroup>(
    {
        name: {
            type: String,
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {timestamps: true}
)

const Group = mongoose.models.Group || mongoose.model<IGroup>("Group", groupSchema)
export default Group;