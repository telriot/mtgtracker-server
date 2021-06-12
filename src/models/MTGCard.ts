import mongoose, { Document, Schema } from "mongoose";
import {MKMPrices, ScryfallPrices} from 'types'
export interface IMTGCard extends Document {
    id: string;
    scryfallId: string;
    cardmarketId: string;
    tcgplayerId: string;
    oracleId: string;
    mkmPrices: MKMPrices;
    cardName: string;
    expansion: string;
    image: string;
    scryfallPrices:ScryfallPrices
    lastUpdated: Date,
}

const MTGCardSchema: Schema = new Schema({
    id: String,
    cardmarketId: String,
    scryfallId: String,
    tcgplayerId: String,
    oracleId: String,
    mkmPrices: Object,
    scryfallPrices: Object,
    cardName: String,
    expansion: String,
    image: String,
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

export const MTGCard = mongoose.model<IMTGCard>("MTGCard", MTGCardSchema);
