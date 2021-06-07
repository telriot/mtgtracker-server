import express from "express";
const router = express.Router();
import { asyncErrorHandler as ASH } from "../middleware";
import { getCollection, getCardsFromCollection, deleteCardFromCollection, updateCardFromCollection } from "controllers/collections";

router.get("/:id", ASH((req, res, next) => getCollection(req.params)));
router.get("/:id/cards", ASH((req, res, next) => getCardsFromCollection(req.params.id, req.query)));
router.put("/:id/:cardId", ASH((req, res, next) => updateCardFromCollection(req.params.id, req.params.cardId, req.body)));
router.delete("/:id/:cardId", ASH((req,res,next) => deleteCardFromCollection(req.params.id, req.params.cardId, req.query)));

export {router as default}