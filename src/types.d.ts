export type Price = number;
export type LangVariant =
    | "EN"
    | "CN"
    | "TW"
    | "FR"
    | "DE"
    | "IT"
    | "JP"
    | "KO"
    | "PT"
    | "RU"
    | "ES";

export type MKMPrices = {
    median: string;
    low: string;
};
export type ScryfallPrices = {
    usd: Price;
    usdFoil: Price;
    eur: Price;
    eurFoil: Price;
    tix: Price;
};
export type ScryfallCard = {
    name: string;
    prices: {
        usd: string;
        eur: string;
        usd_foil: string;
        eur_foil: string;
        tix: string;
    };
    id: string;
    oracle_id: string;
    image_uris: { normal: string };
    tcgplayer_id: string;
    set: string;
};

export type ScryfallIdentifier =
    | { id: string }
    | { name: string; set: string }
    | { name: string }
    | { oracle_id: string }
    | { multiverse_id: string }
    | { illustration_id: string }
    | { collector_number: string; set: string };

export type BulkCardCreationObject = {
        name: string;
        quantity: number;
        expansion: string;
        language:LangVariant;
        foil: boolean;
        buyPrice: number;
        targetPrice: number;
    };
export type BulkCardCreationPayload = BulkCardCreationObject[];

export type CollectionSummary = {
    maxUsd: number
    minUsd: number
    maxEur: number
    minEur: number
    totalUsd: number
    totalEur: number
    cardsQuantity: number
    expansions: string[]
    languages: LangVariant[]
}