import { model, Schema, PaginateModel, Document } from "mongoose";
import { LangVariant, ScryfallPrices } from "types";
import { IMTGCollection } from "models/MTGCollection";
import { IUser } from "models/User";
import mongoosePaginate from "mongoose-paginate-v2";

export interface ICollectionItem extends Document {
    id: string;
    oracleId:string;
    scryfallId: string;
    name: string;
    buyPrice: number;
    targetPrice: number;
    quantity: number;
    language: LangVariant;
    expansion: string;
    scryfallPrices:ScryfallPrices;
    foil: boolean;
    image: string;
    owner: IUser;
    cardCollection: IMTGCollection;
    lastUpdated: Date;
    tcgplayerId: string;

}

const CollectionItemSchema: Schema = new Schema({
    id: String,
    oracleId: String,
    scryfallId: String,
    buyPrice: Number,
    name: String,
    targetPrice: Number,
    quantity: Number,
    language: String,
    image:String,
    expansion: String,
    scryfallPrices: Object,
    foil: Boolean,
    tcgplayerId: String,
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
    owner: { type: Schema.Types.ObjectId, ref: "User" },
    cardCollection: { type: Schema.Types.ObjectId, ref: "MTGCollection" },
    date: {
        type: Date,
        default: Date.now,
    },
});

CollectionItemSchema.plugin(mongoosePaginate);

export const CollectionItem: PaginateModel<ICollectionItem> =
    model<ICollectionItem>(
        "CollectionItem",
        CollectionItemSchema
    ) as PaginateModel<ICollectionItem>;
