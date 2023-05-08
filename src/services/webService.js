const path = require("path");
const asyncHandler = require("express-async-handler");

exports.home = asyncHandler(async (req, res, next) => {
  res.status(200).sendFile(path.join(__dirname, "../public/index.html"));
});

exports.login = asyncHandler(async (req, res, next) => {
  res.status(200).sendFile(path.join(__dirname, "../public/login/login.html"));
});

exports.signup = asyncHandler(async (req, res, next) => {
  res.status(200).sendFile(path.join(__dirname, "../public/index.html"));
});