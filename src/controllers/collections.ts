// import {MTGCollection} from 'models/MTGCollection'
import { Request as Req, Response as Res } from "express";
import { CollectionItem } from "models/CollectionItem";
// import { CollectionItem } from "models/CollectionItem";
import { MTGCollection } from "models/MTGCollection";
import { MTGCard } from "models/MTGCard";
export const getCollection = async ({ params }: Req, res: Res): Promise<void>=> {
    console.log("getting collection");
    console.log(params.id, "PARAMS ID");
    const collection = await MTGCollection.findOne({ name: params.id });
    res.status(200).json({
        message: "Collection successfully found",
        collection,
    });
};
export const getCardsFromCollection = async ({ query }: Req, res: Res):Promise<void>=> {
    const nameRegExp = new RegExp(query.cardName?.toString() || "", "ig");
    const collection = await MTGCollection.findOne({ _id: query.collection });
    if (!collection) throw new Error("Collection not found");
    const cards = await CollectionItem.find({
        _id: { $in: collection.cards },
        name: nameRegExp,
    })
        .populate({ path: "item", model: MTGCard })
        .exec();
    res.status(200).json({
        message: "Cards successfully found",
        cards,
    });
};
