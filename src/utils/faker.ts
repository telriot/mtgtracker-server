import dotenv from "dotenv";
import faker from "faker";
import axios from "axios";
import fs from "fs";
import testTimeout from "utils/testTimeout";
import { LangVariant, ScryfallCard, ScryfallPrices } from "types";
import { MTGCollection } from "models/MTGCollection";
import { CollectionItem } from "models/CollectionItem";
import { User } from "models/User";
import parseScrPrice from "./cardData/parseScrPrice";
import mongoose from "mongoose";
dotenv.config();
const mongoLocal = 'mongodb://localhost:27017/mtgtracker'
//Connect to the DB
const mongoUrl =
    process.env.NODE_ENV==='test'? mongoLocal : process.env.MONGO_URI || mongoLocal;
mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
    console.log("DB Connected");
});
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
///////////////////////////////////////////

export type FakerMTGItem = {
    buyPrice: number;
    targetPrice: number;
    quantity: number;
    language: LangVariant;
    foil: boolean;
    name: string;
    scryfallPrices: ScryfallPrices;
    scryfallId: string;
    oracleId: string;
    image: string;
    expansion: string;
    tcgplayerId: string;
};

const fetchCardFromScryfall = async (): Promise<ScryfallCard | null> => {
    try {
        const { data: randomCard } = await axios.get(
            "https://api.scryfall.com/cards/random"
        );
        return randomCard;
    } catch (error) {
        console.error(
            error,
            "There was some issue randomly fetching from Scryfall"
        );
        return null;
    }
};
export const createNewRandomCard = async (): Promise<FakerMTGItem | null> => {
    try {
        const newCard = await fetchCardFromScryfall();
        if (!newCard) return null;
        const { name, prices, oracle_id, tcgplayer_id, set, id, image_uris } =
            newCard;

        const buyPrice = faker.datatype.float({
            min: 1,
            max: 100,
            precision: 2,
        });
        const targetPrice = parseFloat((buyPrice * 1.5).toFixed(2));
        const isFoil =  prices?.usd_foil ? faker.datatype.boolean() : false
        const newItem: FakerMTGItem = {
            buyPrice,
            targetPrice,
            quantity: faker.datatype.number({ min: 1, max: 4 }),
            language: "EN",
            foil: isFoil,
            name,
            expansion: set,
            oracleId: oracle_id,
            scryfallId: id,
            tcgplayerId: tcgplayer_id,
            scryfallPrices: {
                eur: parseScrPrice(prices.eur),
                usd: parseScrPrice(prices.usd),
                usdFoil: parseScrPrice(prices.usd_foil),
                eurFoil: parseScrPrice(prices.eur_foil),
                tix: parseScrPrice(prices.tix),
            },
            image: image_uris?.normal || "",
        };
        return newItem;
    } catch (error) {
        console.error(
            error,
            "Something went wrong while creating a new card object"
        );
        return null;
    }
};

export const createNewCollection = async (
    size: number
): Promise<{
    byId: Record<string, FakerMTGItem> | null;
    ordered: FakerMTGItem[] | null;
}> => {
    const cards: Record<string, FakerMTGItem> = {};
    const ordered: FakerMTGItem[] = [];
    try {
        const cardRequests = new Array(size).fill(true);
        await Promise.all(
            cardRequests.map(async (_, index) => {
                await testTimeout(index * 100);
                const card = await createNewRandomCard();
                if (!card) throw new Error("Could not create new card");
                cards[card.scryfallId] = card;
                ordered.push(card);
                return card;
            })
        );
        return { byId: cards, ordered };
    } catch (error) {
        console.error(
            error,
            "Something went wrong while creating a new collection"
        );
        return { byId: null, ordered: null };
    }
};

export const collectionToJSON = async (
    fileName: string,
    size: number
): Promise<boolean> => {
    try {
        const { byId: collection } = await createNewCollection(size);
        fs.writeFileSync(`${fileName}.json`, JSON.stringify(collection));
        return true;
    } catch (error) {
        console.error(
            error,
            "Something went wrong creating JSON file from collection"
        );
        return false;
    }
};

export const collectionToMongoDB = async (size: number): Promise<boolean> => {
    try {
        const { ordered: cards } = await createNewCollection(size);
        if (!cards) throw new Error("Could not build a collection");
        let testUser = await User.findOne({ userName: "testUser" });
        if (!testUser) {
            testUser = await User.create({
                userName: "testUser",
                email: "test@test.com",
                cardCollections: [],
            });
        }
        let testCollection = await MTGCollection.findOne({
            name: "testCollection",
        });
        if (!testCollection) {
            testCollection = await MTGCollection.create({
                name: "testCollection",
                cards: [],
                owner: testUser,
            });
        }

        await Promise.all(
            cards.map(async (card) => {
                const newItem = await CollectionItem.create({
                    ...card,
                    cardCollection: testCollection,
                    owner: testUser,
                });
                if (!testCollection)
                    throw new Error(
                        "Something went wrong creating test collection"
                    );
                await testCollection.cards.push(newItem);
            })
        );
        await testCollection.save();
        console.log("Collection successfully created");
        return true;
    } catch (error) {
        console.error(
            error,
            "Something went wrong creating a dummy collection on MDB"
        );
        return false;
    }
};

// collectionToJSON("test", 10);
collectionToMongoDB(50).then(() => process.exit());
