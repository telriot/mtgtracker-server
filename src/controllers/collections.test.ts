import { User } from "../models/User";
import { MTGCollection } from "../models/MTGCollection";
import { CollectionItem } from "../models/CollectionItem";
import db from "../utils/test/dbConnection";
import cardItem from "../utils/test/mocks/cardItem";
import { getCollection, addCardToCollection, deleteCardFromCollection } from "./collections";
const connection = db();

beforeAll(async () => {
    await connection.createCollection("mtgcollections");
    await connection.createCollection("users");
    await MTGCollection.create({name:'testCollection'})

});
afterAll(async () => {
    await connection.dropCollection("mtgcollections");
    await connection.dropCollection("collectionitems");
    await connection.dropCollection("users");
    connection.close();

});
test("Can get testCollection", async () => {
    const res = await getCollection({ id: "testCollection" });
    expect(res.collection?.name).toBe("testCollection");
});

test("Can create a new card", async () => {
    const collection = await MTGCollection.findOne({ name: "testCollection" });
    await User.create({ userName: "testUser" });
    await addCardToCollection(collection?._id, {
        payload: {
            card: cardItem,
            buyPrice: 1,
            targetPrice: 2,
            quantity: 3,
            isFoil: false,
        },
        query: {},
    });

    expect(collection?.name).toBe("testCollection");
    const updatedCollection = await MTGCollection.findOne({ name: "testCollection" });
    expect(updatedCollection?.cards).toHaveLength(1)
});

test("Can delete a card", async () => {
    const collection = await MTGCollection.findOne({ name: "testCollection" });
    const card = await CollectionItem.findOne({name: cardItem.name})
    expect(collection?.cards).toHaveLength(1)

    await deleteCardFromCollection( collection?._id, card?._id, {})
    const updatedCollection = await MTGCollection.findOne({ name: "testCollection" });
    expect(updatedCollection?.cards).toHaveLength(0)
});