const uuid = require("uuid");
const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");
const getCoordinatesForAddress = require("../utils/location");
let DUMMY_PLACES = [
  {
    id: "p1",
    imageUrl:
      "https://media.cntraveler.com/photos/5b914e80d5806340ca438db1/master/pass/BrandenburgGate_2018_GettyImages-549093677.jpg",
    title: "Brandenburg Gate",
    describtion:
      "An 18th-century neoclassical monument in Berlin, built on the orders of Prussian king Frederick William II after the temporary restoration of order during the Batavian Revolution.",
    address: "Pariser Platz, 10117 Berlin, Germany",
    creator: "u1",
    location: {
      lat: 52.5162746,
      lng: 13.3755154,
    },
  },
];

const getPlaceById = (req, res, next) => {
  const placeId = req.params.placeId;
  const place = DUMMY_PLACES.find((place) => place.id === placeId);
  if (place) {
    res.json({ place });
  } else {
    const error = new HttpError(
      "Could not find  a place for the requested id",
      404
    );
    return next(error);
  }
};

const getPlacesByUserId = (req, res, next) => {
  const userId = req.params.userId;
  const userPlaces = DUMMY_PLACES.filter((place) => place.creator === userId);
  if (userPlaces.length) {
    res.json({ userPlaces });
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
      "Title, address fields are required. Describtion should contain at least 6 characters.",
      422
    );
    return next(error);
  }
  const { title, describtion, address, creator } = req.body;
  let location;
  try {
    location = await getCoordinatesForAddress(address);
  } catch (error) {
    return next(error);
  }

  const newPlace = {
    id: uuid.v4(),
    title,
    describtion,
    location,
    address,
    creator,
  };
  DUMMY_PLACES.push(newPlace);
  res.status(201).json({
    newPlace,
  });
};
const patchPlace = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    throw new HttpError(
      "Title is required. Describtion should contain at least 6 characters.",
      422
    );
  }
  const { title, describtion } = req.body;
  const placeId = req.params.placeId;
  const updatedPlace = {
    ...DUMMY_PLACES.find((place) => place.id === placeId),
  };
  const idx = DUMMY_PLACES.findIndex((place) => (place.id = placeId));
  updatedPlace.title = title;
  updatedPlace.describtion = describtion;
  DUMMY_PLACES.splice(idx, 1, updatedPlace);
  res.status(200).json(updatedPlace);
};
const deletePlace = (req, res, next) => {
  const placeId = req.params.placeId;
  const place = DUMMY_PLACES.find((place) => place.id === placeId);
  if (!place) {
    throw new HttpError("Could dont find a place for that id.", 404);
  }
  DUMMY_PLACES = DUMMY_PLACES.filter((place) => place.id !== placeId);
  res.status(200).json({ message: "Deleted" });
};
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.addPlace = addPlace;
exports.patchPlace = patchPlace;
exports.deletePlace = deletePlace;
