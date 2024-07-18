import { Router } from "express";
import {
  addItemToWishList,
  getWishListItems,
  removeItemFromWishList,
} from "../controllers/wishListController.js";
import { requiredSignin } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/add", requiredSignin, addItemToWishList);
router.get("/", requiredSignin, getWishListItems);
router.delete("/remove", requiredSignin, removeItemFromWishList);

export default router;
