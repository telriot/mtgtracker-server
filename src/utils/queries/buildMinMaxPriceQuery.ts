export type MinMaxPriceQuery = {
    $or: {
        $and: [{ [key: string]: { [key: string]: number } }, { foil: boolean }];
    }[];
};
const buildMinMaxPriceQuery = (
    targetValue: string,
    comparison: "$lte" | "$gte",
    key: string
): MinMaxPriceQuery => ({
    $or: [
        {
            $and: [
                {
                    [key]: {
                        [comparison]: parseFloat(targetValue),
                    },
                },
                { foil: false },
            ],
        },
        {
            $and: [
                {
                    [key + "Foil"]: {
                        [comparison]: parseFloat(targetValue),
                    },
                },
                { foil: true },
            ],
        },
    ],
});

export default buildMinMaxPriceQuery;
