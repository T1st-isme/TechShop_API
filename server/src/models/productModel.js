import { Schema, model } from 'mongoose'

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    slug: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    richdescription: {
      cpu: { type: String },
      ram: { type: String },
      vga: { type: String },
      display: { type: String },
      ssd: { type: String },
      tansuat: { type: String },
      bovixuly: { type: String },
      pin: { type: String },
      cambien: { type: String },
      dophangiai: { type: String },
      mau: { type: String },
      trongluong: { type: String },
      kichthuoc: { type: String }
    },
    proImg: [{ img: { type: String } }],
    brand: {
      type: String,
      default: ''
    },
    price: {
      type: Schema.Types.Decimal128,
      default: 0
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category'
    },
    stock: {
      type: Number,
      required: true,
      default: 0
    },
    sold: {
      type: Number,
      default: 0
    },
    rating: [
      {
        star: { type: Number },
        postedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        comment: { type: String }
      }
    ],
    totalRating: {
      type: Number,
      default: 0
    },
    numReviews: {
      type: Number,
      default: 0
    },
    shipping: {
      type: Boolean
    }
  },
  { timestamps: true }
)

// productSchema.virtual("id").get(function () {
//   return this._id.toHexString();
// });

// productSchema.set("toJSON", {
//   virtuals: true,
// });

export default model('Product', productSchema)
