import { Schema, model } from 'mongoose'

const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cartItems: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: { type: Number, default: 1 },
        price: { type: Schema.Types.Decimal128, required: true }
      }
    ]
  },
  { timestamps: true }
)

export default model('Cart', cartSchema)
