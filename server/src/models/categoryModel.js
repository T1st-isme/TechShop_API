import { Schema, model } from 'mongoose'

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 32
    },
    slug: {
      type: String,
      lowercase: true
    },
    parentId: {
      type: String
    }
  },
  { timestamps: true }
)

export default model('Category', categorySchema)
