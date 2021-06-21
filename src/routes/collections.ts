import express from "express";
const router = express.Router();
import { asyncErrorHandler as ASH } from "../middleware";
import {
    addCardToCollection,
    deleteCardFromCollection,
    deleteManyFromCollection,
    getCardsFromCollection,
    getCollectionSummary,
    getCollection,
    updateCardFromCollection,
} from "controllers/collections";

router.get(
    "/:id",
    ASH((req) => getCollection(req.params))
);
router.get(
    "/:id/summary",
    ASH((req) => getCollectionSummary(req.params.id))
);
router.get(
    "/:id/cards",
    ASH((req) => getCardsFromCollection(req.params.id, req.query))
);
router.post(
    "/:id/cards",
    ASH((req) => addCardToCollection(req.params.id, req.body))
);
router.put(
    "/:id/:cardId",
    ASH((req) =>
        updateCardFromCollection(req.params.id, req.params.cardId, req.body)
    )
);
router.delete(
    "/:id/:cardId",
    ASH((req) =>
        deleteCardFromCollection(req.params.id, req.params.cardId, req.query)
    )
);
router.delete(
    "/:id/bulk/delete",
    ASH((req) => deleteManyFromCollection(req.params.id, req.query))
);
export { router as default };
