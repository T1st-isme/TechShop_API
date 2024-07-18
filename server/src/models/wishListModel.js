import { Schema, model } from "mongoose";

const wishListSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    wishListItems: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default model("WishList", wishListSchema);
