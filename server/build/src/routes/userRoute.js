import express from "express";
import { isAdmin, requiredSignin } from "../middlewares/authMiddleware.js";
import { userLogin, userSignup, userLogout, allUsers, getUserDetails, updateUser, deleteUser, userProfile, createUser, updateUserProfile } from "../controllers/userController.js";
import { uploadAvatar } from "../config/cloudinary.config.js"; // Import the uploadAvatar middleware

const router = express.Router();

// auth middleware
// router.use(authMiddleware);

// login route
router.post("/login", userLogin);

// signup route
router.post("/signup", userSignup);

// logout route
router.get("/logout", userLogout);
router.route("/me").get(requiredSignin, userProfile).put(requiredSignin, uploadAvatar, updateUserProfile); // Use uploadAvatar middleware

// Admin
router.route("/admin/users").get(requiredSignin, isAdmin, allUsers);
router.route("/admin/create-user").get(requiredSignin, isAdmin, createUser);
router.route("/admin/user/:id").get(requiredSignin, isAdmin, getUserDetails).put(requiredSignin, isAdmin, updateUser).delete(requiredSignin, isAdmin, deleteUser);
export default router;