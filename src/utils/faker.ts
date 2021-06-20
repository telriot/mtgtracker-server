import dotenv from "dotenv";
import faker from "faker";
import axios from "axios";
import fs from "fs";
import testTimeout from "utils/testTimeout";
import { LangVariant, ScryfallPrices } from "types";
import { MTGCard } from "models/MTGCard";
import { MTGCollection } from "models/MTGCollection";
import { CollectionItem } from "models/CollectionItem";
import { User } from "models/User";
import createMTGCard from "utils/cardData/createMTGItemFromScryfallObject";
import mongoose from "mongoose";
dotenv.config();

//Connect to the DB
const mongoUrl =
    process.env.MONGO_URI || `mongodb://localhost:27017/mtgtracker`;
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

export type FakerMTGCardObject = {
    cardmarketId: string;
    scryfallId: string;
    tcgplayerId: string;
    oracleId: string;
    image: string;
    scryfallPrices: ScryfallPrices;
    cardName: string;
    expansion: string;
};
export type FakerMTGItem = {
    buyPrice: number;
    targetPrice: number;
    quantity: number;
    language: LangVariant;
    foil: boolean;
    item: FakerMTGCardObject;
    name: string;
};

const fetchCardFromScryfall = async () => {
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
        const { name } = newCard;

        const mtgCardObject: FakerMTGCardObject = createMTGCard(newCard);
        const buyPrice = faker.datatype.float({
            min: 1,
            max: 100,
            precision: 2,
        });
        const targetPrice = parseFloat((buyPrice * 1.5).toFixed(2));
        const newItem: FakerMTGItem = {
            item: mtgCardObject,
            buyPrice,
            targetPrice,
            quantity: faker.datatype.number({ min: 1, max: 4 }),
            language: "EN",
            foil: faker.datatype.boolean(),
            name,
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
                cards[card.item.scryfallId] = card;
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
                let dbCard = await MTGCard.findOne({
                    scryfallId: card.item.scryfallId,
                });
                if (!dbCard) {
                    dbCard = await MTGCard.create(card.item);
                }
                const {
                    buyPrice,
                    targetPrice,
                    quantity,
                    language,
                    foil,
                    name,
                } = card;
                const newItem = await CollectionItem.create({
                    buyPrice,
                    targetPrice,
                    quantity,
                    language,
                    foil,
                    name,
                    item: dbCard,
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
collectionToMongoDB(200).then(() => process.exit());
