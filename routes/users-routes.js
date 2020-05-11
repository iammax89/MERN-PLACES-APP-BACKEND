const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const usersControllers = require("../controllers/users-controller");
const uploadFile = require("../middleware/file-upload");
router.get("/", usersControllers.getUsers);
router.post(
  "/signup",
  uploadFile.single("image"),
  [
    check("name").notEmpty(),
    check("password").isLength({ min: 6 }),
    check("email").normalizeEmail().isEmail(),
  ],
  usersControllers.createUser
);
router.post("/login", usersControllers.login);
module.exports = router;
