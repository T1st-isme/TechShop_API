import WishList from "../models/wishListModel.js";
import Product from "../models/productModel.js";
import asyncHandler from "express-async-handler";

// Add item to wish list
export const addItemToWishList = asyncHandler(async (req, res) => {
  const wishList = await WishList.findOne({ user: req.user._id });
  const product = await Product.findById(req.body.productId);

  if (!product) {
    return res.status(400).json({ message: "Product not found" });
  }

  if (wishList) {
    const itemExists = wishList.wishListItems.find(
      (item) => item.product.toString() === product._id.toString()
    );

    if (itemExists) {
      return res.status(400).json({ message: "Product already in wish list" });
    }

    wishList.wishListItems.push({ product: product._id });
    await wishList.save();
    res.status(201).json({ success: true, wishList });
  } else {
    const newWishList = new WishList({
      user: req.user._id,
      wishListItems: [{ product: product._id }],
    });
    await newWishList.save();
    res.status(201).json({ success: true, wishList: newWishList });
  }
});

// Get wish list items
export const getWishListItems = asyncHandler(async (req, res) => {
  const wishList = await WishList.findOne({ user: req.user._id }).populate(
    "wishListItems.product",
    "_id name price proImg slug"
  );

  if (!wishList) {
    return res.status(404).json({ message: "Wish list not found" });
  }

  res.status(200).json({ success: true, wishList });
});

// Remove item from wish list
export const removeItemFromWishList = asyncHandler(async (req, res) => {
  const wishList = await WishList.findOne({ user: req.user._id });
  if (!wishList) {
    return res.status(404).json({ message: "Wish list not found" });
  }

  if (!req.body.productId) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  wishList.wishListItems = wishList.wishListItems.filter(
    (item) => item.product.toString() !== req.body.productId
  );

  await wishList.save();
  res.status(200).json({ success: true, wishList });
});
