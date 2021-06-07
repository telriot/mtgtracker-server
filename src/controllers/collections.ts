// import {MTGCollection} from 'models/MTGCollection'
import { CollectionItem, ICollectionItem } from "models/CollectionItem";
import { PaginateResult } from "mongoose";
import { MTGCollection, IMTGCollection } from "models/MTGCollection";
import { MTGCard } from "models/MTGCard";
import { ParsedQs } from "qs";

export const getCollection = async (params: {
    [key: string]: string;
}): Promise<{ message: string; collection: IMTGCollection | null }> => {
    console.log("getting collection");
    console.log(params.id, "PARAMS ID");
    const collection = await MTGCollection.findOne({ name: params.id });
    return {
        message: "Collection successfully found",
        collection,
    };
};
export const getCardsFromCollection = async (
    collectionId: string, query: ParsedQs
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
    const cards = await CollectionItem.paginate(mongoQuery, paginationOptions);

    return {
        message: "Cards successfully found",
        cards,
    };
};

export const deleteCardFromCollection = async (
    collectionId:string, cardId: string, query: ParsedQs
): Promise<{ message: string; cards: PaginateResult<ICollectionItem> }> => {

    console.log(query, 'QUERY')
    await CollectionItem.deleteOne({_id: cardId})
    const {cards} = await getCardsFromCollection(collectionId, query)
    return {
        message: "Card successfully deleted",
        cards,
    };
};
