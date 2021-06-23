import isEmptyObject from "../objects/isEmptyObject";
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
        "minUsd" | "maxUsd" | "minEur" | "maxEur",
        string | ParsedQs | string[] | ParsedQs[] | undefined
    >,
    queryObj: Record<string, any>
) : void=> {
    if (isEmptyObject(priceFilters) || !queryObj) return;

    Object.entries(priceFilters).forEach(([condition, value]) => {
        if (value) {
            if (!queryObj["$and"]) queryObj["$and"] = [];
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
