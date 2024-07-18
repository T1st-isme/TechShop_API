import { userModels } from "../models/userModel.js";
import bcrypt from "bcrypt";
import validator from "validator";
import sendToken from "../Utils/jwtToken.js";
import asyncHandler from "express-async-handler";

//Login
const userLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send({
      success: false,
      message: "Email hoặc Mật này không đúng!!!",
    });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).send({ message: "Email không hợp lệ!!!" });
  }
  const user = await userModels.findOne({ email });
  if (!user) {
    return res.status(400).send({
      success: false,
      message: "Email chưa được đăng ký!!!",
    });
  }
  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(400).send({
      success: false,
      message: "Mật khẩu không đúng!!!",
    });
  }
  sendToken(user, 200, res);
});

// signup user
const userSignup = asyncHandler(async (req, res) => {
  const { fullname, email, password } = req.body;

  if (!fullname || !email || !password) {
    return res
      .status(400)
      .send({ message: "Vui lòng điền đầy đủ thông tin!!!" });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).send({ message: "Email không hợp lệ!!!" });
  }

  if (!validator.isLength(password, { min: 6 })) {
    res.status(400).send({ message: "Mật khẩu phải có ít nhất 6 ký tự!!!" });
  }

  // check user
  const exisitingUser = await userModels.findOne({ email });
  // exisiting user
  if (exisitingUser) {
    return res.status(400).send({
      success: false,
      message: "Email đã tồn tại!!!",
    });
  }
  const user = await userModels.create(req.body);
  sendToken(user, 201, res);
  // const token = createToken(user._id);
  // if (user) {
  //   const { lastname, email, password } = user;
  //   res.cookie("token", token, {
  //     httpOnly: true,
  //     expires: new Date(Date.now() + 1 * 86400 * 1000),
  //   });
  // res.status(201).send({
  //   firstname,
  //   lastname,
  //   email,
  //   password,
  //   token,
  //   success: true,
  //   message: "Đăng ký thành công!!!",
  // });
  // } catch (err) {
  //   res.status(500).send({
  //     success: false,
  //     message: "Đăng ký thất bại!!!",
  //     err,
  //   });
  // }
});

// create user
const createUser = asyncHandler(async (req, res) => {
  const { fullname, email, password, role } = req.body;

  if (!fullname || !email || !password || !role) {
    return res
      .status(400)
      .send({ message: "Vui lòng điền đầy đủ thông tin!!!" });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).send({ message: "Email không hợp lệ!!!" });
  }

  if (!validator.isLength(password, { min: 6 })) {
    res.status(400).send({ message: "Mật khẩu phải có ít nhất 6 ký tự!!!" });
  }

  // check user
  const exisitingUser = await userModels.findOne({ email });
  // exisiting user
  if (exisitingUser) {
    return res.status(400).send({
      success: false,
      message: "Email đã tồn tại!!!",
    });
  }
  await userModels.create(req.body);
});

const userLogout = asyncHandler(async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.cookie("user", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out!",
  });
});

// Admin Routes

// Get all users   =>   /admin/users
const allUsers = asyncHandler(async (req, res, next) => {
  const users = await userModels.find();

  res.status(200).json({
    success: Boolean(users),
    user: users || "Không tìm thấy!!!",
  });
});

// Get user details   =>  /admin/user/:id
const getUserDetails = asyncHandler(async (req, res, next) => {
  const user = await userModels.findById(req.params.id);

  res.status(200).json({
    success: Boolean(user),
    user: user || "Không tìm thấy user!!!",
  });
});

// Update user profile   =>   /admin/user/:id
const updateUser = asyncHandler(async (req, res, next) => {
  const newUserData = {
    fullname: req.body.fullname,
    email: req.body.email,
    role: req.body.role,
  };
  const user = await userModels.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    user,
  });
});

// Delete user   =>   /api/v1/admin/user/:id
const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await userModels.findByIdAndDelete(req.params.id);

  // // Remove avatar from cloudinary
  // const image_id = user.avatar.public_id;
  // await cloudinary.v2.uploader.destroy(image_id);
  res.status(200).json({
    success: Boolean(user),
    message: user ? "Xóa thành công" : "Không tìm thấy user!!!",
  });
});

const userProfile = asyncHandler(async (req, res, next) => {
  const user = await userModels.findById(req.user._id);
  res.status(200).json({
    success: Boolean(user),
    user: user || "Không tìm thấy user!!!",
  });
});

// update profile
const updateUserProfile = asyncHandler(async (req, res, next) => {
  // Check if a file is uploaded
  if (req.file) {
    req.body.avatar = req.file.path;
  }

  // Check if password is being updated
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
  }

  const updateFields = {
    fullname: req.body.fullname,
    email: req.body.email,
    avatar: req.body.avatar,
    address: req.body.address,
    phone: req.body.phone,
  };

  // Only include password if it is being updated
  if (req.body.password) {
    updateFields.password = req.body.password;
  }

  const user = await userModels.findByIdAndUpdate(
    req.user._id,
    updateFields,
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    user,
  });
});

export {
  userLogin,
  userSignup,
  userLogout,
  allUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  userProfile,
  createUser,
  updateUserProfile,
};
