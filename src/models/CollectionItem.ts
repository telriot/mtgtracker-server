import mongoose, { Document, Schema } from "mongoose";
import { LangVariant } from "types";
import { IMTGCard } from "models/MTGCard";
import { IMTGCollection } from "models/MTGCollection";
import { IUser } from "models/User";

export interface ICollectionItem extends Document {
    id: string;
    name: string;
    buyPrice: number;
    targetPrice: number;
    quantity: number;
    language: LangVariant;
    foil: boolean;
    item: IMTGCard;
    owner: IUser;
    cardCollection: IMTGCollection;
}

const CollectionItemSchema: Schema = new Schema({
    id: String,
    buyPrice: Number,
    name: String,
    targetPrice: Number,
    quantity: Number,
    language: String,
    foil: Boolean,
    owner: { type: Schema.Types.ObjectId, ref: "User" },
    cardCollection: { type: Schema.Types.ObjectId, ref: "MTGCollection" },
    item: { type: Schema.Types.ObjectId, ref: "MTGCard" },
    date: {
        type: Date,
        default: Date.now,
    },
});

export const CollectionItem = mongoose.model<ICollectionItem>(
    "CollectionItem",
    CollectionItemSchema
);
