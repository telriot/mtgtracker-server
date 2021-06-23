import { User } from "../models/User";
import { IMTGCollection, MTGCollection } from "../models/MTGCollection";
import { CollectionItem } from "../models/CollectionItem";
import db from "../utils/test/dbConnection";
import {
    cardItem,
    cardCreationOptions,
    cardItem2,
} from "../utils/test/mocks/cardItem";
import {
    getCollection,
    addCardToCollection,
    deleteCardFromCollection,
    deleteManyFromCollection,
    updateCardFromCollection,
    getCardsFromCollection,
} from "./collections";
import { ScryfallData } from "../types";

const connection = db();
let collection: IMTGCollection | null;

//UTILS
const cardPayload = (
    cardName?: string,
    item: ScryfallData = cardItem
): any => ({
    payload: {
        card: { ...item, name: cardName || item.name },
        ...cardCreationOptions,
    },
    query: {},
});
const createMultipleCards = async (
    collectionId: string,
    cards: string[],
    item: ScryfallData = cardItem
) =>
    await Promise.all(
        cards.map(
            async (cardName) =>
                await addCardToCollection(
                    collectionId,
                    cardPayload(cardName, item)
                )
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

describe("Card fetching", () => {
    let collectionId:string
    beforeEach(()=>{collectionId = collection?._id || "" })
    afterEach(async () => await connection.dropCollection("collectionitems"));
    test("Can get cards by name", async () => {
        const collectionId = collection?._id || "";
        const cardsToCreate = [
            "cardToFetch1",
            "cardToFetch2",
            "otherCard1",
            "cardToFetch3",
            "otherCard2",
        ];
        await createMultipleCards(collectionId, cardsToCreate);
        const { cards } = await getCardsFromCollection(collectionId, {
            cardName: "cardtofetch",
        });
        expect(cards.docs).toHaveLength(3);
        const { cards: cards2 } = await getCardsFromCollection(collectionId, {
            cardName: "othercard",
        });
        expect(cards2.docs).toHaveLength(2);
    });
    test("Can get cards by price", async () => {
        const cheapCardsSet = ["cheapCard1", "cheapCard2"];
        const expensiveCardsSet = [
            "expensiveCard1",
            "expensiveCard2",
            "expensiveCard3",
        ];

        await createMultipleCards(collectionId, cheapCardsSet);
        await createMultipleCards(collectionId, expensiveCardsSet, cardItem2);

        const { cards: expensiveCards } = await getCardsFromCollection(
            collectionId,
            {
                minEur: "3",
            }
        );
        expect(expensiveCards.docs).toHaveLength(expensiveCardsSet.length);
        const { cards: cheapCards } = await getCardsFromCollection(
            collectionId,
            {
                maxEur: "3",
            }
        );
        expect(cheapCards.docs).toHaveLength(cheapCardsSet.length);
        const { cards: overpricedCards } = await getCardsFromCollection(
            collectionId,
            {
                minUsd: "3000",
            }
        );
        expect(overpricedCards.docs).toHaveLength(0);
    });
    test("Can get cards by set", async () => {
        const lowrynCardSet = ["lwr1", "lwr2"];
        const horizonsCardSet = ["hor1"];
        await createMultipleCards(collectionId, lowrynCardSet);
        await createMultipleCards(collectionId, horizonsCardSet, cardItem2);
        const { cards: lrwCards } = await getCardsFromCollection(collectionId, {
            expansion: "LRW",
        });
        expect(lrwCards.docs).toHaveLength(lowrynCardSet.length);
        const { cards: mh1Cards } = await getCardsFromCollection(collectionId, {
            expansion: "MH1",
        });
        expect(mh1Cards.docs).toHaveLength(horizonsCardSet.length);
    });
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
