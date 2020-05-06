const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {
  console.log("GET request in places!");
  const data = {
    message: "It works!",
  };
  res.json(data);
});

module.exports = router;
