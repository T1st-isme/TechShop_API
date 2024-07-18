import { Schema, model } from "mongoose";
// A
const orderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  totalPrice: {
    type: Schema.Types.Decimal128,
    default: 0,
    required: true,
  },
  items: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      payablePrice: {
        type: Number,
        required: true,
      },
      purchasedQty: {
        type: Number,
        required: true,
      },
    },
  ],
  paymentStatus: {
    type: String,
    enum: ["Đang xử lý", "Hoàn tất", "Đã hủy", "Hoàn tiền"],
  },
  paymentType: {
    type: String,
    enum: ["COD", "VNPAY PAYMENT", "VietQR"],
    default: "COD",
    required: true,
  },
  orderStatus: {
    type: String,
    enum: ["Đã đặt hàng", "Đang xử lý", "Đã giao", "Đã hủy"],
    default: "Đã đặt hàng",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  orderCode: {
    type: String,
    required: true,
  },
});

export default model("Order", orderSchema);
