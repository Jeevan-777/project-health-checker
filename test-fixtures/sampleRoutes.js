const express = require("express");
const router = express.Router();

router.get("/users", (req, res) => {
  res.send("all users");
});

router.post("/users", (req, res) => {
  res.send("create user");
});

router.get("/users/:id", (req, res) => {
  res.send("one user");
});

router.delete("/users/:id", (req, res) => {
  res.send("delete user");
});

module.exports = router;
