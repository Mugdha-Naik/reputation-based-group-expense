import mongoose from "mongoose";

interface IMember {
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const memberSchema = new mongoose.Schema<IMember>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },
  },
  { timestamps: true }
);

const Member =
  mongoose.models.Member || mongoose.model<IMember>("Member", memberSchema);

export type { IMember };
export default Member;
