// import {MTGCollection} from 'models/MTGCollection'
import { CollectionItem, ICollectionItem } from "models/CollectionItem";
import { LangVariant, ScryfallData } from "types";
import { PaginateResult } from "mongoose";
import { MTGCollection, IMTGCollection } from "models/MTGCollection";
import { ParsedQs } from "qs";
import isOlderThan from "utils/time/isOlderThan";
import axios from "axios";
import { User } from "models/User";
import chunk from "utils/arrays/chunk";
import timeout from "utils/testTimeout";
import createItemFromScryfall from "utils/cardData/createItemFromScryfall";

const getItemIdsToUpdate = (cards: ICollectionItem[]): string[] =>
    cards
        .map((card) =>
            isOlderThan(card.lastUpdated, "day") ? card.scryfallId : null
        )
        .filter(Boolean) as string[];

export const getCardFromScryfall = async (
    id: string
): Promise<ScryfallData> => {
    const { data: card } = await axios.get(
        `https://api.scryfall.com/cards/${id}`
    );
    return card;
};
export const getCollectionFromScryfall = async (
    identifiers: { id: string }[]
): Promise<ScryfallData[]> => {
    const { data: collection } = await axios.post(
        "https://api.scryfall.com/cards/collection",
        { identifiers }
    );
    return collection.data;
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
        await Promise.all(
            updates.map(async (card: ScryfallData) => {
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
    summary: Record<string, string | number | string[]>;
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

    let maxUsd = 0,
        minUsd = 0,
        maxEur = 0,
        minEur = 0,
        totalUsd = 0,
        totalEur = 0,
        cardsQuantity = 0;
    const expansions: string[] = [],
        languages: LangVariant[] = [];
    // console.log(cards)
    cards.forEach((card) => {
        const { scryfallPrices, expansion, foil } = card;
        const { language } = card;
        const usd = scryfallPrices.usd || 0;
        const eur = scryfallPrices.eur || 0;
        const usdFoil = scryfallPrices.usdFoil || 0;
        const eurFoil = scryfallPrices.eurFoil || 0;
        cardsQuantity += card.quantity;

        if (foil) {
            if (usdFoil > maxUsd) maxUsd = usdFoil;
            if (eurFoil > maxEur) maxEur = eurFoil;
            if (!minUsd || usdFoil < minUsd) minUsd = usdFoil;
            if (!minEur || eurFoil < minEur) minEur = eurFoil;
            totalUsd += usdFoil * card.quantity;
            totalEur += eurFoil * card.quantity;
        } else {
            if (usd > maxUsd) maxUsd = usd;
            if (eur > maxEur) maxEur = eur;
            if (!minUsd || usd < minUsd) minUsd = usd;
            if (!minEur || eur < minEur) minEur = eur;
            if (!expansions.includes(expansion)) expansions.push(expansion);
            if (!languages.includes(language)) languages.push(language);
            totalUsd += usd * card.quantity;
            totalEur += eur * card.quantity;
        }
    });

    return {
        message: "Collection successfully found",
        summary: {
            maxUsd,
            minUsd,
            maxEur,
            minEur,
            totalUsd,
            totalEur,
            cardsQuantity,
            expansions,
            languages,
        },
    };
};

export const getCardsFromCollection = async (
    collectionId: string,
    query: ParsedQs
): Promise<{ message: string; cards: PaginateResult<ICollectionItem> }> => {
    const nameRegExp = new RegExp(query.cardName?.toString() || "", "ig");
    const collection = await MTGCollection.findOne({ _id: collectionId });
    if (!collection) throw new Error("Collection not found");
    console.log(query, "QUERY");
    const mongoQuery: Record<string, any> = {
        _id: { $in: collection.cards },
        name: nameRegExp,
    };
    if (query.expansion)
        mongoQuery.expansion = query.expansion.toString().toLowerCase();
    if (query.language) mongoQuery.language = query.language.toString();
    if (query.minEur)
        mongoQuery["scryfallPrices.eur"] = {
            $gte: parseFloat(query.minEur.toString()),
        };
    if (query.maxEur && parseInt(query.maxEur.toString()) > 0)
        mongoQuery["scryfallPrices.eur"] = {
            ...mongoQuery["scryfallPrices.eur"],
            $lte: parseFloat(query.maxEur.toString()),
        };
    if (query.minUsd)
        mongoQuery["scryfallPrices.usd"] = {
            $gte: parseFloat(query.minUsd.toString()),
        };
    if (query.maxUsd && parseInt(query.maxUsd.toString()) > 0)
        mongoQuery["scryfallPrices.usd"] = {
            ...mongoQuery["scryfallPrices.usd"],
            $lte: parseFloat(query.maxUsd.toString()),
        };

    console.log(mongoQuery, "Query");
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
            card: ScryfallData;
            buyPrice: number;
            targetPrice: number;
            quantity: number;
            isFoil: boolean;
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

    // await CollectionItem.create(FullItem);
    const { cards } = await getCardsFromCollection(collectionId, body.query);
    return {
        message: "Card successfully added",
        cards,
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
    console.log(body.query, "QUERY");
    const { cards } = await getCardsFromCollection(collectionId, body.query);
    return {
        message: "Card successfully updated",
        cards,
    };
};
