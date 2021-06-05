import express from "express";
const router = express.Router();
import { asyncErrorHandler as ASH } from "../middleware";
import { getCollection, getCardsFromCollection } from "controllers/collections";

router.get("/", ASH(getCardsFromCollection));
router.get("/:id", ASH(getCollection));

export {router as default}