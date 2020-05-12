const fs = require("fs");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");
const getCoordinatesForAddress = require("../utils/location");
const Place = require("../models/place");
const User = require("../models/user");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.placeId;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Could not find  a place for the requested id",
      500
    );
    return next(error);
  }

  if (place) {
    res.json({ place: place.toObject({ getters: true }) });
  } else {
    const error = new HttpError(
      "Could not find  a place for the requested id",
      404
    );
    return next(error);
  }
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.userId;
  let userPlaces;
  try {
    userPlaces = await Place.find({ creator: userId });
  } catch (err) {
    const error = new HttpError(
      "Could not find places for the requested user id",
      500
    );
    return next(error);
  }
  if (userPlaces.length) {
    res.json({
      userPlaces: userPlaces.map((place) => place.toObject({ getters: true })),
    });
  } else {
    const error = new HttpError(
      "Could not find places for the requested user id",
      404
    );
    return next(error);
  }
};
const addPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    const error = new HttpError(
      "Title, address and image fields are required. Describtion should contain at least 6 characters.",
      422
    );
    return next(error);
  }
  const { title, describtion, address } = req.body;
  let location;
  try {
    location = await getCoordinatesForAddress(address);
  } catch (error) {
    return next(error);
  }

  const newPlace = new Place({
    title,
    describtion,
    address,
    creator: req.userData.userId,
    location,
    imageUrl: req.file.path,
  });
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Creating place failed. Please try again", 500);
    return next(error);
  }
  if (!user) {
    const error = new HttpError("Could not find user for the provided id", 404);
    return next(error);
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await newPlace.save({ session: session });
    user.places.push(newPlace);
    await user.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError("Could not add new place.", 500);
    return next(error);
  }

  res.status(201).json({
    newPlace,
  });
};
const patchPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    const error = new HttpError(
      "Title is required. Describtion should contain at least 6 characters.",
      422
    );
    return next(error);
  }
  const { title, describtion } = req.body;
  const placeId = req.params.placeId;
  let updatedPlace;
  try {
    updatedPlace = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Could not update the place.", 500);
    return next(error);
  }
  if (updatedPlace.creator.toString() !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this place.", 401);
    return next(error);
  }
  updatedPlace.title = title;
  updatedPlace.describtion = describtion;
  try {
    await updatedPlace.save();
  } catch (err) {
    const error = new HttpError("Could not update the place.", 500);
    return next(error);
  }
  res
    .status(200)
    .json({ updatedPlace: updatedPlace.toObject({ getters: true }) });
};
const deletePlace = async (req, res, next) => {
  const placeId = req.params.placeId;
  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError("Could not delete place.", 500);
    return next(error);
  }
  if (!place) {
    const error = new HttpError(
      "Could not find a place for the provided id.",
      404
    );
    return next(error);
  }

  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to delete this place.",
      401
    );
    return next(error);
  }
  const imagePath = place.imageUrl;
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await place.remove({ session: session });
    place.creator.places.pull(place);
    await place.creator.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError("Could not delete.", 500);
    return next(error);
  }
  fs.unlink(imagePath, (err) => {
    console.log(err);
  });
  res.status(200).json({ message: "Deleted" });
};
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.addPlace = addPlace;
exports.patchPlace = patchPlace;
exports.deletePlace = deletePlace;
