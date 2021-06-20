// import {MTGCollection} from 'models/MTGCollection'
import { CollectionItem, ICollectionItem } from "models/CollectionItem";
import { PaginateResult } from "mongoose";
import { MTGCollection, IMTGCollection } from "models/MTGCollection";
import { MTGCard } from "models/MTGCard";
import { ParsedQs } from "qs";
import createMTGCard from "utils/cardData/createMTGItemFromScryfallObject";
import isOlderThan from "utils/time/isOlderThan";
import axios from "axios";
import { User } from "models/User";

export const getCardFromScryfall = async (id: string) => {
    const { data: card } = await axios.get(
        `https://api.scryfall.com/cards/${id}`
    );
    return card;
};
export const getCollectionFromScryfall = async (identifiers: any[]) => {
    const { data: collection } = await axios.post(
        "https://api.scryfall.com/cards/collection",
        { identifiers }
    );
    return collection.data as any[];
};

export const getCollection = async (params: {
    [key: string]: string;
}): Promise<{ message: string; collection: IMTGCollection | null }> => {
    console.log("getting collection");
    console.log(params.id, "PARAMS ID");
    const collection = await MTGCollection.findOne({ name: params.id });
    if (!collection) {
        throw new Error("Collection not found");
    }
    return {
        message: "Collection successfully found",
        collection,
    };
};



export const updateCollectionData =  async (itemsToUpdate:string[]): Promise<{ message: string }> => {
    const identifiers = itemsToUpdate.map((id) => ({ id }));
    const updates = await getCollectionFromScryfall(identifiers);
    await Promise.all(
        updates.map(async (card: any) => {
            const { usd, eur, tix, usd_foil, eur_foil } = card.prices;
            console.log(card.prices);
            await MTGCard.updateOne(
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
    return {message:'Collection succesfully updated'}
}

export const getCollectionSummary = async (params: {
    [key: string]: string;
}): Promise<{ message: string; summary: Record<string, string|number> }> => {
    const collection = await MTGCollection.findOne({ name: params.id })
    if (!collection) {
        throw new Error("Collection not found");
    }
    const cards = await CollectionItem.find({_id: { $in: collection.cards }}).populate('item').exec()
    // const aggregate = CollectionItem.aggregate().match({_id: { $in: collection.cards }}).lookup()
    let maxUsd = 0,
        minUsd = 0,
        maxEur = 0,
        minEur = 0,
        totalUsd = 0,
        totalEur = 0,
        cardsQuantity = 0;
            cards.forEach(card =>
        {
            const {scryfallPrices} = card.item
            const usd = parseFloat(scryfallPrices.usd || '0')
            const eur = parseFloat(scryfallPrices.eur || '0')
            const usdFoil = parseFloat(scryfallPrices.usdFoil || '0')
            const eurFoil = parseFloat(scryfallPrices.eurFoil || '0')
            cardsQuantity += card.quantity

            if(card.foil){
                if(usdFoil > maxUsd) maxUsd = usdFoil
                if(eurFoil > maxEur) maxEur = eurFoil
                if(!minUsd || usdFoil < minUsd) minUsd = usdFoil
                if(!minEur || eurFoil < minEur) minEur = eurFoil                
                totalUsd += usdFoil * card.quantity
                totalEur += eurFoil * card.quantity

            } else {
                if(usd > maxUsd) maxUsd = usd
                if(eur > maxEur) maxEur = eur
                if(!minUsd || usd < minUsd) minUsd = usd
                if(!minEur || eur < minEur) minEur = eur     
                totalUsd += usd * card.quantity
                totalEur += eur * card.quantity
            }
        })
    
    return {
        message: "Collection successfully found",
        summary: {
            maxUsd,
            minUsd,
            maxEur,
            minEur,
            totalUsd,
            totalEur ,
            cardsQuantity, 
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
    const mongoQuery = {
        _id: { $in: collection.cards },
        name: nameRegExp,
    };
    const sortByName = { name: "asc" };
    const paginationOptions = {
        limit: Number(query.limit) || 20,
        page: Number(query.page) || 1,
        populate: { path: "item", model: MTGCard },
        sort: sortByName,
    };
    let cards = await CollectionItem.paginate(mongoQuery, paginationOptions);
    const itemsToUpdate = cards.docs
        .map((card) =>
            isOlderThan(card.item.lastUpdated, "day")
                ? card.item.scryfallId
                : null
        )
        .filter(Boolean) as string[];

    if (itemsToUpdate.length) {

        await updateCollectionData(itemsToUpdate)
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
            card: Record<string, any>;
            buyPrice: number;
            targetPrice: number;
            quantity: number;
            isFoil: boolean;
        };
        query: Record<string, any>;
    }
): Promise<{ message: string; cards: PaginateResult<ICollectionItem> }> => {
    const { card, buyPrice, targetPrice, quantity, isFoil } = body.payload;
    const cardObject = createMTGCard(card);
    let dbCard = await MTGCard.findOne({ scryfallId: card.id });
    if (!dbCard) {
        dbCard = await MTGCard.create(cardObject);
    } else {
        await dbCard.update({
            ...cardObject,
            lastUpdated: new Date(Date.now()),
        });
    }

    const collection = await MTGCollection.findById(collectionId);
    if (!collection) throw new Error("No collection to add this card to");
    //STILL ONLY TESTING
    const user = await User.findOne({ userName: "testUser" });
    if (!user) throw new Error("No user to refer to");

    const FullItem = {
        item: dbCard,
        buyPrice,
        targetPrice,
        quantity,
        foil: isFoil,
        language: "EN",
        name: card.name,
        cardCollection: collection,
        owner: user,
    };
    const newItem = await CollectionItem.create(FullItem);
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
    console.log(collectionId, "COLLECTIONID", query);
    await CollectionItem.deleteMany({
        _id: { $in: query.cardIds as string[] },
    });
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
        query: Record<string, any>;
    }
): Promise<{ message: string; cards: PaginateResult<ICollectionItem> }> => {
    await CollectionItem.updateOne({ _id: cardId }, body.update);
    const { cards } = await getCardsFromCollection(collectionId, body.query);
    return {
        message: "Card successfully updated",
        cards,
    };
};
