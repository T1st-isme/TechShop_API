import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  allowedFormats: ["jpg", "png"],
  params: (req, file) => {
    let folder = "TechShop";
    if (file.fieldname === "avatar") {
      folder = "TechShop/Avatars";
    }
    return {
      folder,
      resource_type: "auto",
    };
  },
});

export const uploadCloud = multer({ storage }).array("proImg");
export const uploadAvatar = multer({ storage }).single("avatar");
