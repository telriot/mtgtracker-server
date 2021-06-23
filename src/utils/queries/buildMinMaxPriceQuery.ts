const buildMinMaxPriceQuery = (
    targetValue: string,
    comparison: "$lte" | "$gte",
    key: string,
    
) => ({
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
                    [key+'Foil']: {
                        [comparison]: parseFloat(targetValue),
                    },
                },
                { foil: true },
            ],
        },
    ],
});

export default buildMinMaxPriceQuery;
