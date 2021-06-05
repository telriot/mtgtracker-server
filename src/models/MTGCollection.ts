 
import mongoose, { Document, Schema } from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2'
import { ICollectionItem } from "models/CollectionItem";

export interface IMTGCollection extends Document {
	id: string;
    name:string;
    cards: [ICollectionItem]
}

const MTGCollectionSchema: Schema = new Schema({
	id: String,
    name:String,
    cards: [{type:Schema.Types.ObjectId, ref:'CollectionItem'}],
	date: {
		type: Date,
		default: Date.now,
	},
});

MTGCollectionSchema.plugin(mongoosePaginate);

export const MTGCollection = mongoose.model<IMTGCollection>("MTGCollection", MTGCollectionSchema);