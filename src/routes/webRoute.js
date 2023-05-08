const express = require("express");
const { home, login, signup } = require("../services/webService");

const id = process.env.ID;

const router = express.Router();

router.route("/").get(home);
router.route("/login").get(login);
router.route("/signup").get(signup);

module.exports = router;
