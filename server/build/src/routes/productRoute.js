import express from "express";
import { createProduct, deleteProduct, getProductByName, getProducts, updateProduct, uploadImage, getProductByID, AdGetProducts, getBrands, getTopBrands } from "../controllers/productController.js";
import { isAdmin, requiredSignin } from "../middlewares/authMiddleware.js";
import { uploadCloud } from "../config/cloudinary.config.js";
const router = express.Router();

// GET all products
router.get("/", getProducts);
router.get("/admin", requiredSignin, isAdmin, AdGetProducts);

// GET all brands
router.get("/brands", getBrands);
router.get("/brands/top", getTopBrands);

// GET a single product
router.get("/:slug", getProductByName);

// CREATE a product
router.post("/", uploadCloud, createProduct);

// UPDATE a product
router.put("/:slug", uploadCloud, updateProduct);

// DELETE & GET a product
router.route("/:id").delete(requiredSignin, deleteProduct);
// .get(requiredSignin, getProductByID);

// Upload images
router.post("/upload/:id", uploadCloud, uploadImage);
export default router;