const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");
const User = require("../models/user");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed. Please try again latter.",
      500
    );
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const createUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    const error = new HttpError(
      "Name and Image fields are required. Email address mush be in appropriate format. Password must contains at least 6 characters.",
      422
    );
    return next(error);
  }
  const { name, email, password } = req.body;
  let alreadyUser;
  try {
    alreadyUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Sign up failed. Please try again latter.",
      500
    );
    return next(error);
  }
  if (alreadyUser) {
    const error = new HttpError(
      "User exists already. Please login instead.",
      422
    );
    return next(error);
  }
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Could not create user, please try again!",
      500
    );
    return next(error);
  }

  const newUser = new User({
    name,
    imageUrl: req.file.path,
    places: [],
    email,
    password: hashedPassword,
  });

  try {
    await newUser.save();
  } catch (err) {
    const error = new HttpError("Could not create new user", 500);
    return next(error);
  }
  let token;
  try {
    token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
      },
      `${process.env.JWT_KEY}`,
      {
        expiresIn: "1h",
      }
    );
  } catch (err) {
    const error = new HttpError("Could not create new user", 500);
    return next(error);
  }

  res
    .status(201)
    .json({ userId: newUser.id, email: newUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let user;
  try {
    user = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Sign in failed. Please try again latter.",
      500
    );
    return next(error);
  }
  if (!user) {
    const error = new HttpError("Invalid credetials, could not log in.", 403);
    return next(error);
  }
  let isValid;
  try {
    isValid = await bcrypt.compare(password, user.password);
  } catch (err) {
    const error = new HttpError(
      "Could not login. Please check your credentials and try again.",
      500
    );
    return next(error);
  }
  if (!isValid) {
    const error = new HttpError("Invalid credetials, could not log in.", 401);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      `${process.env.JWT_KEY}`,
      {
        expiresIn: "1h",
      }
    );
  } catch (err) {
    const error = new HttpError(
      "Could not login. Please check your credentials and try again.",
      500
    );
    return next(error);
  }
  res.json({ userId: user.id, email: user.email, token: token });
};

exports.getUsers = getUsers;
exports.createUser = createUser;
exports.login = login;
