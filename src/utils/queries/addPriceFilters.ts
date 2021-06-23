import isEmptyObject from "utils/objects/isEmptyObject";
import minMaxQuery from "./buildMinMaxPriceQuery";
import { ParsedQs } from "qs";

/**
 *
 * @param priceFilters the query entries used for filtering through cards
 * @param queryObj the mongoose query object to populate
 * @returns void if missing parameters
 */
const addPriceFilters = (
    priceFilters: Record<
        string,
        string | ParsedQs | string[] | ParsedQs[] | undefined
    >,
    queryObj: Record<string, any>
) => {
    if (isEmptyObject(priceFilters) || !queryObj) return;
    if (!queryObj["$and"]) queryObj["$and"] = [];

    Object.entries(priceFilters).forEach(([condition, value]) => {
        if (value) {
            const currency = condition.toLowerCase().includes("eur")
                ? "eur"
                : "usd";
            const queryType = condition.toLowerCase().includes("min")
                ? "$gte"
                : "$lte";
            queryObj["$and"].push(
                minMaxQuery(
                    value.toString(),
                    queryType,
                    `scryfallPrices.${currency}`
                )
            );
        }
    });
};

export default addPriceFilters;