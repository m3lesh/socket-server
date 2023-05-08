const express = require("express");
const {
  signupValidator,
  loginValidator,
} = require("../utils/authValidator");

const { signup, login } = require("../services/authService");

const router = express.Router();

router.post("/signup", signupValidator, signup);

router.post("/login", loginValidator, login);

module.exports = router;
