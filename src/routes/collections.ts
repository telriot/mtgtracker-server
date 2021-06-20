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
    ASH((req, res, next) => getCollection(req.params))
);
router.get(
    "/:id/summary",
    ASH((req, res, next) => getCollectionSummary(req.params.id))
);
router.get(
    "/:id/cards",
    ASH((req, res, next) => getCardsFromCollection(req.params.id, req.query))
);
router.post(
    "/:id/cards",
    ASH((req, res, next) => addCardToCollection(req.params.id, req.body))
);
router.put(
    "/:id/:cardId",
    ASH((req, res, next) =>
        updateCardFromCollection(req.params.id, req.params.cardId, req.body)
    )
);
router.delete(
    "/:id/:cardId",
    ASH((req, res, next) =>
        deleteCardFromCollection(req.params.id, req.params.cardId, req.query)
    )
);
router.delete(
    "/:id/bulk/delete",
    ASH((req, res, next) =>
        deleteManyFromCollection(req.params.id, req.query)
    )
);
export { router as default };
