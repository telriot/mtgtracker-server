export type Price = string | null;
export type LangVariant =
	| 'EN'
	| 'CN'
	| 'TW'
	| 'FR'
	| 'DE'
	| 'IT'
	| 'JP'
	| 'KO'
	| 'PT'
	| 'RU'
	| 'ES';

export type MKMPrices =
{
    median: string;
    low: string;
}
export type ScryfallPrices =
{
    usd: Price;
    usdFoil: Price;
    eur: Price;
    eurFoil: Price,
    tix: Price;
}