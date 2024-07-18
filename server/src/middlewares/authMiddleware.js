import jwt from "jsonwebtoken";
import { userModels } from "../models/userModel.js";
import catchAsyncError from "./catchAsyncError.js";
import ErrorHandler from "../Utils/ErrorHandler.js";

export const requiredSignin = catchAsyncError(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;
  // const token = req.cookies.token;
  // console.log(token);
  if (!token) {
    return next(new ErrorHandler("Login first to access this resource.", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await userModels.findById(decoded.id);

  next();
});
// admin access
export const isAdmin = async (req, res, next) => {
  try {
    const user = await userModels.findById(req.user._id);
    console.log(user);
    if (user.role != "admin") {
      return res.send({
        success: false,
        message: "Bạn không có quyền truy cập!!!",
      });
    }
    next();
  } catch (error) {
    res.status(500).send({
      error: error.message,
    });
  }
};
