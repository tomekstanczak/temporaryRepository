const express = require("express");
const uploadMiddleware = require("../../middleware/multerMiddleware.js");

const {
  signup,
  login,
  logout,
  currentUser,
  avatarUpdate,
} = require("../../controllers/users/index.js");

const authMiddleware = require("../../middleware/jwt.js");

const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);

router.post("/logout", authMiddleware, logout);

router.get("/current", authMiddleware, currentUser);

router.patch(
  "/avatar",
  authMiddleware,
  uploadMiddleware.single("avatar"),
  avatarUpdate
);

router.get("/avatars/:imgPath", (req, res, next) => {
  const { imgPath } = req.params;

  res.render("avatars", { imgPath });
});

module.exports = router;
