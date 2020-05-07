const uuid = require("uuid");
const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");

const USERS = [
  {
    id: "u1",
    name: "Muhammad Ali",
    image:
      "https://inspirationfeed.com/wp-content/uploads/2019/07/Muhammad-Ali-Quotes.jpeg",
    places: 23,
    email: "muhammad@gmail.com",
    password: "text",
  },
];

const getUsers = (req, res, next) => {
  if (USERS.length) {
    res.json({ users: USERS });
  } else {
    const error = new HttpError("No users found", 404);
    return next(error);
  }
};

const createUser = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    throw new HttpError(
      "Name is required. Email address mush be in appropriate format. Password must contains at least 6 characters.",
      422
    );
  }
  const { name, email, password } = req.body;
  const alreadyUser = USERS.find((user) => user.email === email);
  if (alreadyUser) {
    const error = new HttpError(
      "Could not create new user, email already exists",
      422
    );
    return next(error);
  }
  const newUser = {
    id: uuid.v4(),
    name,
    email,
    password,
  };
  USERS.push(newUser);
  res.status(201).json({ user: newUser });
};

const login = (req, res, next) => {
  const { email, password } = req.body;
  const user = USERS.find((user) => user.email === email);
  if (!user || user.password !== password) {
    const error = new HttpError("Could not identify user", 401);
    return next(error);
  }
  res.json({ message: "Logged in!" });
};

exports.getUsers = getUsers;
exports.createUser = createUser;
exports.login = login;
