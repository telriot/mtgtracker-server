import { ScryfallCard } from "types";

export const cardItem : ScryfallCard = {
   
        name: "Test card",
        prices: {
            usd: "1",
            eur: "2",
            usd_foil: "2",
            eur_foil: "2",
            tix: "3",
        },
        id: "baseId",
        oracle_id: "oracle",
        image_uris: {
            normal: "http://www.google.com",
        },
        tcgplayer_id: "tcgplayer",
        set: "LRW",
};
export const cardItem2 : ScryfallCard = {

        name: "Test card 2",
        prices: {
            usd: "4",
            eur: "5",
            usd_foil: "10",
            eur_foil: "20",
            tix: "3",
        },
        id: "baseId2",
        oracle_id: "oracle2",
        image_uris: {
            normal: "http://www.google.com",
        },
        tcgplayer_id: "tcgplayer2",
        set: "MH1",
};
export const cardCreationOptions = {
    buyPrice: 1,
    targetPrice: 2,
    quantity: 3,
    isFoil: false,
    language:'EN'
} 