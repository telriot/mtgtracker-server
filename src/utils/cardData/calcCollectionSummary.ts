import { ICollectionItem } from "../../models/CollectionItem";
import { LangVariant } from "../../types";
/**
 * 
 * @param cards collection items to summarize
 * @returns a summary of the collection contents
 */
const calcCollectionSummary = (cards: ICollectionItem[]): {
    maxUsd: number
    minUsd: number
    maxEur: number
    minEur: number
    totalUsd: string
    totalEur: string
    cardsQuantity: number
    expansions: string[]
    languages: LangVariant[]
}=> {
    let maxUsd = 0,
        minUsd = 0,
        maxEur = 0,
        minEur = 0,
        totalUsd = 0,
        totalEur = 0,
        cardsQuantity = 0;
    const expansions: string[] = [],
        languages: LangVariant[] = [];

    cards.forEach((card) => {
        const {
            scryfallPrices: { usd, eur, usdFoil, eurFoil },
            expansion,
            foil,
            language,
        } = card;

        cardsQuantity += card.quantity;
        const usdPrice = foil ? usdFoil : usd;
        const eurPrice = foil ? eurFoil : eur;

        if (usdPrice > maxUsd) maxUsd = usdPrice;
        if (eurPrice > maxEur) maxEur = eurPrice;
        if (usdPrice < minUsd) minUsd = usdPrice;
        if (eurPrice < minEur) minEur = eurPrice;
        if (!expansions.includes(expansion)) expansions.push(expansion);
        if (!languages.includes(language)) languages.push(language);
        totalUsd += usdPrice * card.quantity;
        totalEur += eurPrice * card.quantity;
    });

    return {
        maxUsd,
        minUsd,
        maxEur,
        minEur,
        totalUsd: totalUsd.toFixed(2),
        totalEur: totalEur.toFixed(2),
        cardsQuantity,
        expansions,
        languages,
    };
};
export default calcCollectionSummary;
