// import {MTGCollection} from 'models/MTGCollection'
import { CollectionItem, ICollectionItem } from "models/CollectionItem";
import {
    BulkCardCreationPayload,
    CollectionSummary,
    ScryfallCard,
    ScryfallIdentifier,
} from "types";
import { PaginateResult } from "mongoose";
import { MTGCollection, IMTGCollection } from "models/MTGCollection";
import { ParsedQs } from "qs";
import isOlderThan from "utils/time/isOlderThan";
import axios from "axios";
import { User } from "models/User";
import chunk from "utils/arrays/chunk";
import timeout from "utils/testTimeout";
import createItemFromScryfall from "utils/cardData/createItemFromScryfall";
import addPriceFilters from "utils/queries/addPriceFilters";
import calcCollectionSummary from "utils/cardData/calcCollectionSummary";
const getItemIdsToUpdate = (cards: ICollectionItem[]): string[] =>
    cards
        .map((card) =>
            isOlderThan(card.lastUpdated, "day") ? card.scryfallId : null
        )
        .filter(Boolean) as string[];

export const getCardFromScryfall = async (
    id: string
): Promise<void | ScryfallCard> => {
    try {
        const { data: card } = await axios.get(
            `https://api.scryfall.com/cards/${id}`
        );
        return card;
    } catch (error) {
        console.error(error);
    }
};
export const getCollectionFromScryfall = async (
    identifiers: ScryfallIdentifier[]
): Promise<void | ScryfallCard[]> => {
    try {
        const { data: collection } = await axios.post(
            "https://api.scryfall.com/cards/collection",
            { identifiers }
        );
        return collection.data;
    } catch (error) {
        console.error(error);
    }
};

export const getCollection = async (params: {
    [key: string]: string;
}): Promise<{ message: string; collection: IMTGCollection | null }> => {
    const collection = await MTGCollection.findOne({ name: params.id });
    if (!collection) {
        throw new Error("Collection not found");
    }
    return {
        message: "Collection successfully found",
        collection,
    };
};

export const updateCollectionData = async (
    itemsToUpdate: string[]
): Promise<{ message: string }> => {
    const identifiers = itemsToUpdate.map((id) => ({ id }));
    const chunks = chunk(identifiers, 75);
    chunks.forEach(async (chunk, index) => {
        index && (await timeout(100));
        const updates = await getCollectionFromScryfall(chunk);
        if (!updates) throw new Error("Could not get data from scryfall");
        await Promise.all(
            updates.map(async (card: ScryfallCard) => {
                const { usd, eur, tix, usd_foil, eur_foil } = card.prices;
                await CollectionItem.updateMany(
                    { scryfallId: card.id },
                    {
                        prices: {
                            usd,
                            eur,
                            tix,
                            eurFoil: eur_foil,
                            usdFoil: usd_foil,
                        },
                        lastUpdated: new Date(Date.now()),
                    }
                );
            })
        );
    });

    return { message: "Collection succesfully updated" };
};

export const getCollectionSummary = async (
    id: string
): Promise<{
    message: string;
    summary: CollectionSummary;
}> => {
    const collection = await MTGCollection.findById(id);
    if (!collection) {
        throw new Error("Collection not found");
    }
    let cards = await CollectionItem.find({ _id: { $in: collection.cards } });

    const idsToUpdate = getItemIdsToUpdate(cards);
    if (idsToUpdate.length) {
        await updateCollectionData(getItemIdsToUpdate(cards));
        // can avaoid a read if modifying the results on the card payload returning the modified copy from the update function
        cards = await CollectionItem.find({ _id: { $in: collection.cards } });
    }

    const summary = calcCollectionSummary(cards);

    return {
        message: "Collection summary successfully produced",
        summary,
    };
};

export const getCardsFromCollection = async (
    collectionId: string,
    query: ParsedQs
): Promise<{ message: string; cards: PaginateResult<ICollectionItem> }> => {
    const nameRegExp = new RegExp(query.cardName?.toString() || "", "ig");
    const collection = await MTGCollection.findOne({ _id: collectionId });
    if (!collection) throw new Error("Collection not found");
    const mongoQuery: Record<string, any> = {
        cardCollection: collectionId,
        name: nameRegExp,
    };
    const { minEur, maxEur, minUsd, maxUsd, language, expansion } = query;
    const priceFilters = { minEur, maxEur, minUsd, maxUsd };
    if (expansion) mongoQuery.expansion = expansion.toString().toUpperCase();
    if (language) mongoQuery.language = language.toString();
    addPriceFilters(priceFilters, mongoQuery);

    const sortByName = { name: "asc" };
    const paginationOptions = {
        limit: Number(query.limit) || 20,
        page: Number(query.page) || 1,
        sort: sortByName,
    };
    let cards = await CollectionItem.paginate(mongoQuery, paginationOptions);

    const itemsToUpdate = getItemIdsToUpdate(cards.docs);

    if (itemsToUpdate.length) {
        await updateCollectionData(itemsToUpdate);
        cards = await CollectionItem.paginate(mongoQuery, paginationOptions);
    }

    return {
        message: "Cards successfully found",
        cards,
    };
};

export const addCardToCollection = async (
    collectionId: string,
    body: {
        payload: {
            card: ScryfallCard;
            buyPrice: number;
            targetPrice: number;
            quantity: number;
            isFoil: boolean;
            expansion: string;
        };
        query: Record<string, any>;
    }
): Promise<{ message: string; cards: PaginateResult<ICollectionItem> }> => {
    const collection = await MTGCollection.findById(collectionId);
    if (!collection) throw new Error("No collection to add this card to");
    //STILL ONLY TESTING
    const user = await User.findOne({ userName: "testUser" });
    if (!user) throw new Error("No user to refer to");
    const fullItem = createItemFromScryfall({
        ...body.payload,
        collection,
        user,
    });
    const newItem = await CollectionItem.create(fullItem);
    await collection.cards.push(newItem);
    await collection.save();
    const { cards } = await getCardsFromCollection(collectionId, body.query);
    return {
        message: "Card successfully added",
        cards,
    };
};

export const addManyCardsToCollection = async (
    collectionId: string,
    body: {
        cards: BulkCardCreationPayload;
        query: Record<string, any>;
    }
): Promise<{
    message: string;
    cards: PaginateResult<ICollectionItem>;
    summary: CollectionSummary;
}> => {
    const collection = await MTGCollection.findById(collectionId);
    if (!collection) throw new Error("No collection to add cards to");
    const user = await User.findOne({ userName: "testUser" });
    if (!user) throw new Error("No user to refer to");

    const chunks = chunk(body.cards, 75);
    const newCards: Partial<ICollectionItem>[] = [];
    await chunks.forEach(async (chunk, index) => {
        index && (await timeout(100));
        const identifiers = chunk.map(({ name, expansion }) =>
            expansion
                ? {
                      name,
                      set: expansion,
                  }
                : { name }
        );
        const cardsToAdd = await getCollectionFromScryfall(identifiers);
        if (!cardsToAdd) throw new Error("Could not get data from scryfall");

        const cardItems = cardsToAdd.map(
            (card, index) => {
                const { name, foil, expansion, ...cardData } = chunk[index];
                return createItemFromScryfall({
                    card,
                    ...cardData,
                    isFoil: foil,
                    collection,
                    user,
                });
            }
        );
        newCards.push(...cardItems);
    });
    const newItems = await CollectionItem.insertMany(newCards);
    await collection.cards.push(...newItems);
    await collection.save();
    const [{ cards }, { summary }] = await Promise.all([
        getCardsFromCollection(collectionId, body.query),
        getCollectionSummary(collectionId),
    ]);
    return {
        message: "Card successfully added",
        cards,
        summary,
    };
};

export const deleteCardFromCollection = async (
    collectionId: string,
    cardId: string,
    query: ParsedQs
): Promise<{ message: string; cards: PaginateResult<ICollectionItem> }> => {
    await CollectionItem.deleteOne({ _id: cardId });
    await MTGCollection.updateOne(
        { _id: collectionId },
        { $pull: { cards: cardId } }
    );
    const { cards } = await getCardsFromCollection(collectionId, query);
    return {
        message: "Card successfully deleted",
        cards,
    };
};

export const deleteManyFromCollection = async (
    collectionId: string,
    query: ParsedQs
): Promise<{ message: string; cards: PaginateResult<ICollectionItem> }> => {
    const ids = query.cardIds as string[];
    await CollectionItem.deleteMany({
        _id: { $in: ids },
    });
    await MTGCollection.updateOne(
        { _id: collectionId },
        { $pull: { cards: { $in: ids } } }
    );

    const { cards } = await getCardsFromCollection(collectionId, query);
    return {
        message: "Cards successfully deleted",
        cards,
    };
};

export const updateCardFromCollection = async (
    collectionId: string,
    cardId: string,
    body: {
        update: {
            buyPrice?: number;
            targetPrice?: number;
            foil?: boolean;
            quantity?: number;
        };
        query: ParsedQs;
    }
): Promise<{ message: string; cards: PaginateResult<ICollectionItem> }> => {
    await CollectionItem.updateOne({ _id: cardId }, body.update);
    const { cards } = await getCardsFromCollection(collectionId, body.query);
    return {
        message: "Card successfully updated",
        cards,
    };
};
