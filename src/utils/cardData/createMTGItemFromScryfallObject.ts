
const createMTGItemFromScryfallObject = (scryfallCard:Record<string, any>) => {
    const {
        tcgplayer_id,
        cardmarket_id,
        id,
        prices,
        oracle_id,
        name,
        set,
        image_uris,
    } = scryfallCard;

    const mtgCardObject = {
        cardmarketId: cardmarket_id,
        scryfallId: id,
        tcgplayerId: tcgplayer_id,
        oracleId: oracle_id,
        image: image_uris?.normal || "",
        scryfallPrices: prices,
        cardName: name,
        expansion: set,
    };

    return mtgCardObject

}

export default createMTGItemFromScryfallObject