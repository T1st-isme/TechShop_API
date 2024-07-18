import mongoose from "mongoose";
mongoose.set("strictQuery", true);
const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    // skipcq: JS-0002
    console.log("Kết nối MongoDB thành công.");
  } catch (err) {
    console.log("Lỗi kết nỗi MongoDB: ", err);
  }
};
export default dbConnect;