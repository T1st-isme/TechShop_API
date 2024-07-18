import express from "express";
import { isAdmin, requiredSignin } from "../middlewares/authMiddleware.js";
import {
  addItemToCart,
  getCartItems,
  removeCartItems,
  updateCart,
  clearCart,
} from "../controllers/cartController.js";
const router = express.Router();

router.post("/addToCart", requiredSignin, addItemToCart);

router.get("/getCartItems", requiredSignin, getCartItems);

router.post("/removeCartItem", requiredSignin, removeCartItems);

router.put("/updateCart", requiredSignin, updateCart);

router.delete("/clearCart", requiredSignin, clearCart);

export default router;
