const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const placesControllers = require("../controllers/places-controller");

router.get("/:placeId", placesControllers.getPlaceById);
router.get("/user/:userId", placesControllers.getPlacesByUserId);
router.post(
  "/",
  [
    check("title").notEmpty(),
    check("describtion").isLength({ min: 6 }),
    check("address").notEmpty(),
  ],
  placesControllers.addPlace
);
router.patch(
  "/:placeId",
  [check("title").notEmpty(), check("describtion").isLength({ min: 6 })],
  placesControllers.patchPlace
);
router.delete("/:placeId", placesControllers.deletePlace);
module.exports = router;
