const axios = require("axios");
const HttpError = require("../models/http-error");
const GOOGLE_API_KEY = "AIzaSyCJGZ4q3h_KoD4XYM3CIGGaEF94NB7RtCc";

const getCoordinatesForAddress = (address) => {
  let coordinates = axios
    .get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_API_KEY}`
    )
    .then((Response) => {
      if (!Response.data || Response.data.status === "ZERO_RESULTS") {
        const error = new HttpError(
          "Could not find a place for the requested address.",
          422
        );
        throw error;
      }
      return Response.data.results[0].geometry.location;
    });
  return coordinates;
};

module.exports = getCoordinatesForAddress;
