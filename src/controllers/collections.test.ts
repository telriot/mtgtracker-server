import { User } from "../models/User";
import { IMTGCollection, MTGCollection } from "../models/MTGCollection";
import { CollectionItem } from "../models/CollectionItem";
import db from "../utils/test/dbConnection";
import { cardItem, cardCreationOptions } from "../utils/test/mocks/cardItem";
import {
    getCollection,
    addCardToCollection,
    deleteCardFromCollection,
    deleteManyFromCollection,
    updateCardFromCollection,
} from "./collections";

const connection = db();
let collection: IMTGCollection | null;

//UTILS
const cardPayload = (cardName?: string): any => ({
    payload: {
        card: { ...cardItem, name: cardName || cardItem.name },
        ...cardCreationOptions,
    },
    query: {},
});
const createMultipleCards = async (collectionId: string, cards: string[]) =>
    await Promise.all(
        cards.map(
            async (cardName) =>
                await addCardToCollection(collectionId, cardPayload(cardName))
        )
    );
// HOOKS
beforeAll(async () => {
    await connection.createCollection("mtgcollections");
    await connection.createCollection("users");
    await User.create({ userName: "testUser" });
    await MTGCollection.create({ name: "testCollection" });
    collection = await MTGCollection.findOne({
        name: "testCollection",
    });
});
beforeEach(
    async () =>
        await MTGCollection.updateOne({ name: "testCollection" }, { cards: [] })
);
afterAll(async () => {
    await connection.dropCollection("mtgcollections");
    await connection.dropCollection("users");
    await connection.dropCollection("collectionitems");
    connection.close();
});

// TESTS
test("Can get testCollection", async () => {
    const res = await getCollection({ id: "testCollection" });
    expect(res.collection?.name).toBe("testCollection");
});

describe("Card creation", () => {
    test("Can create a new card", async () => {
        await addCardToCollection(collection?._id, cardPayload());
        const updatedCollection = await MTGCollection.findOne({
            name: "testCollection",
        });
        expect(updatedCollection?.cards).toHaveLength(1);
    });

    test("Can add multiple cards", async () => {
        const cards = ["card1", "card2", "card3"];
        await createMultipleCards(collection?._id || "", cards);

        const updatedCollection = await MTGCollection.findOne({
            name: "testCollection",
        });
        expect(updatedCollection?.cards).toHaveLength(cards.length);
    });
});

describe("Card deletion", () => {
    test("Can delete a card", async () => {
        await addCardToCollection(collection?._id, cardPayload("cardToDelete"));

        const card = await CollectionItem.findOne({ name: "cardToDelete" });
        await deleteCardFromCollection(collection?._id, card?._id, {});
        const updatedCollection = await MTGCollection.findOne({
            name: "testCollection",
        });
        expect(updatedCollection?.cards).toHaveLength(0);
    });
    test("Can delete multiple cards at once", async () => {
        const cardsToDelete = ["toDelete1", "toDelete2"];
        await createMultipleCards(collection?._id || "", cardsToDelete);

        const returnedCards = await Promise.all(
            cardsToDelete.map(
                async (cardName) =>
                    await CollectionItem.findOne({ name: cardName })
            )
        );
        await deleteManyFromCollection(collection?._id || "", {
            cardIds: returnedCards.map((card) => card?._id),
        });
    });
});

test("Can update a card", async () => {
    await addCardToCollection(collection?._id, cardPayload("cardToUpdate"));
    const card = await CollectionItem.findOne({ name: "cardToUpdate" });
    await updateCardFromCollection(collection?._id, card?._id, {
        update: { buyPrice: 40, foil: true },
        query: {},
    });
    const updatedCard = await CollectionItem.findOne({ name: "cardToUpdate" });
    expect(updatedCard?.buyPrice).toBe(40);
    expect(updatedCard?.foil).toBeTruthy;
});
