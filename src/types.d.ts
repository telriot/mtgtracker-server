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
export type ScryfallData = {
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
	set:string
};
