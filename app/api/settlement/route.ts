import {NextRequest, NextResponse} from "next/server"
import mongoose from "mongoose"
import connectDB from "@/lib/db"
import Settlement from "@/models/Settlement"
import Group from "@/models/Group.model"
import User from "@/models/user.model";
import { getServerSession } from "next-auth";
import  authOptions  from "@/lib/auth";
import { buildReputationSummary } from "@/lib/reputation";

// create settlement

export async function POST(req: NextRequest){
    await connectDB();

    // 🔐 ADD SESSION CHECK HERE
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

    try{
        const {
            groupId, fromUser, toUser, amount
        } = await req.json();

        // 🔐 SECURITY CHECK HERE
    if (session.user.id !== fromUser) {
      return NextResponse.json(
        { message: "You cannot create settlement for another user" },
        { status: 403 }
      );
    }

        //Basic Validation
        if(!groupId || !fromUser || !toUser || !amount) {
            return NextResponse.json(
                {
                    message: "All fields are required"
                },
                {
                    status: 400
                }
            )
        }

        if(amount <= 0){
            return NextResponse.json(
                {
                    message: "Amount must be greater than 0"
                },
                {
                    status: 400
                }
            )
        }

        if(!mongoose.Types.ObjectId.isValid(groupId)){
            return NextResponse.json(
                {
                    message: "Invalid groupId"
                },
                {
                    status: 400
                }
            )
        }

        if(fromUser === toUser){
            return NextResponse.json(
                {
                    message: "Self-settlement is not allowed"
                },
                {
                    status: 400
                }
            )
        }

        // check is group exists
        const group = await Group.findById(groupId);

        if(!group){
            return NextResponse.json(
                {
                    message: "Group not found"
                },
                {
                    status: 400
                }
            )
        }

        // Ensure both users are group members
        const isFromMember = group.members.some(
  (member: mongoose.Types.ObjectId) => member.toString() === fromUser
);

const isToMember = group.members.some(
  (member: mongoose.Types.ObjectId) => member.toString() === toUser
);
        if(!isFromMember || !isToMember){
            return NextResponse.json(
                {
                    message: "Both users must be members of the group"
                },
                {
                    status: 403
                },
            )
        }
        const settlement = await Settlement.create({
            groupId,
            fromUser,
            toUser,
            amount,
        });

        return NextResponse.json(settlement, { status : 201});
    }catch(error: unknown){
        return NextResponse.json(
            {
                message: error instanceof Error ? error.message : "Failed to create settlement"
            },
            {
                status: 500
            }
        )
    }
}

//Mark as completed
export async function PATCH(req: NextRequest){
    await connectDB();

    const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

    try{
        const{settlementId} = await req.json();

        if(!settlementId){
            return NextResponse.json(
                {
                    message: "Settlement ID is required"
                },
                {
                    status: 400
                },
            )
        }

        if(!mongoose.Types.ObjectId.isValid(settlementId)){
            return NextResponse.json(
                {
                    message: "Invalid settlement ID"
                },
                {
                    status: 400
                },
            )
        }
        const settlement = await Settlement.findById(settlementId);

        if(!settlement){
            return NextResponse.json(
                {
                    message: "Settlement not found"
                },
                {
                    status: 404
                }
            )
        }

        // 🔐 Ensure only debtor can mark as completed
if (settlement.fromUser.toString() !== session.user.id) {
  return NextResponse.json(
    { message: "Not allowed" },
    { status: 403 }
  );
}

        if(settlement.status === "completed"){
            return NextResponse.json(
                {
                    message: "Settlement already completed"
                },
                {
                    status: 400
                },
            )
        }

        settlement.status = "completed";
        settlement.completedAt = new Date();

        await settlement.save();

        const debtorUserId = settlement.fromUser.toString();
        const [completedSettlements, pendingSettlements] = await Promise.all([
          Settlement.countDocuments({
            fromUser: debtorUserId,
            status: "completed",
          }),
          Settlement.countDocuments({
            fromUser: debtorUserId,
            status: "pending",
          }),
        ]);

        const reputationSummary = buildReputationSummary({
          completedSettlements,
          pendingSettlements,
        });

        await User.findByIdAndUpdate(debtorUserId, {
          reputationScore: reputationSummary.score,
        });

        return NextResponse.json(
          {
            settlement,
            reputation: reputationSummary,
          },
          {status: 200}
        );

    }catch(error: unknown){
        return NextResponse.json(
            {
                message: error instanceof Error ? error.message : "Failed to update settlement"
            },
            {
                status: 500
            }
        )

    }
}
