/**
 *
 * @param price price value from scryfall
 * @returns a parsed price
 */
const parseScrPrice = (price: string | null): number => {
    if (!price) return 0;
    else return parseFloat(parseFloat(price).toFixed(2));
};
export default parseScrPrice;
