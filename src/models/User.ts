import mongoose, { Document, Schema } from "mongoose";
import { IMTGCollection } from "models/MTGCollection";
export interface IUser extends Document {
    id: string;
    email:string;
    userName: string;
    cardCollections: IMTGCollection[];
}

const UserSchema: Schema = new Schema({
    id: String,
    userName: String,
    email: String,
    cardCollections:[{type:Schema.Types.ObjectId, ref:'MTGCollection'}],
    date: {
        type: Date,
        default: Date.now,
    },
});

export const User = mongoose.model<IUser>("User", UserSchema);
