import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const Schema = mongoose.Schema;
const Model = mongoose.model;

const userSchema = new Schema(
  {
    fullname: {
      type: String,
      minlength: 3,
      maxlength: 50,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
      index: true,
      lowercase: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    avatar: {
      type: String,
      default:
        "https://res.cloudinary.com/dzyf7iccb/image/upload/v1720293502/kfmbibviz6fyjuvxnmch.png",
    },
    password: {
      type: String,
      minlength: 6,
      required: true,
    },
    cart: [
      {
        prroduct: { type: Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
      },
    ],
    role: {
      type: String,
      required: true,
      enum: ["admin", "user"],
      default: "user",
    },
    refreshToken: {
      type: String,
    },
    address: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
      unique: true,
      index: true,
      trim: true,
      // validate: [
      //   {
      //     validator: /^\d{10}$/,
      //     message: "{VALUE} is not a valid phone number",
      //   },
      // ],
    },
  },
  {
    wishList: [{ type: Schema.Types.ObjectId, ref: "WishList" }],
  },
  { timestamps: true }
);

// Encrypt password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
  next();
});

// Return JWT token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME,
  });
};

export const userModels = Model("User", userSchema);
