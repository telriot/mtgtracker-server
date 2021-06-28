import { ICollectionItem } from "models/CollectionItem";
import { IMTGCollection } from "models/MTGCollection";
import { IUser } from "models/User";
import { LangVariant, ScryfallCard } from "types";
import parseScrPrice from 'utils/cardData/parseScrPrice'
export interface CreateItemFromScryfallPayload {
    card: ScryfallCard;
    buyPrice: number;
    targetPrice: number;
    quantity: number;
    isFoil: boolean;
    language?: LangVariant;
    user:IUser;
    collection:IMTGCollection
}
const createItemFromScryfall = ({
    card,
    buyPrice,
    targetPrice,
    quantity,
    isFoil,
    user, 
    collection,
    language = "EN",
}: CreateItemFromScryfallPayload): Partial<ICollectionItem> => ({
    buyPrice,
    targetPrice,
    quantity,
    foil: isFoil,
    language,
    name: card.name,
    cardCollection: collection,
    owner: user,
    scryfallPrices: {
        usd:parseScrPrice(card.prices.usd),
        eur: parseScrPrice(card.prices.eur),
        usdFoil: parseScrPrice(card.prices.usd_foil),
        eurFoil: parseScrPrice(card.prices.eur_foil),
        tix: parseScrPrice(card.prices.tix),
    },
    scryfallId: card.id,
    oracleId: card.oracle_id,
    image: card.image_uris?.normal || "",
    expansion: card.set,
    tcgplayerId: card.tcgplayer_id,
});

export default createItemFromScryfall