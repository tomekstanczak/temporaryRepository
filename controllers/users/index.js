const { newUserSignup, userIsLoggingIn } = require("./services.js");
const User = require("../../models/users.js");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const Jimp = require("jimp");
const fs = require("fs/promises");
const path = require("path");
const { v4: uuidV4 } = require("uuid");

const signup = async (req, res, next) => {
  const { password, email } = req.body;

  const user = await newUserSignup(email);
  if (user) {
    return res.status(409).json({ message: "Email in use" });
  }
  try {
    const avatar = gravatar.url(email, { s: "250", r: "pg", d: "404" });
    console.log(avatar);
    const newUser = new User({ email });
    newUser.avatarURL = avatar;
    await newUser.setPassword(password);
    await newUser.save();
    return res.status(201).json({ message: "Created" });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await userIsLoggingIn(email);

  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }
  const isPasswordIsValidate = await user.validPassword(password);
  if (isPasswordIsValidate) {
    const payload = {
      id: user._id,
      email: user.email,
    };
    const token = jwt.sign(payload, process.env.SECRET, { expiresIn: "30d" });

    user.token = token;
    await user.save();

    res.status(200).json({ token });
  } else {
    return res.status(401).json({ message: "Email or password is wrong." });
  }
};

const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    user.token = null;
    await user.save();

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

const currentUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const email = user.email;
    const subscription = user.subscription;

    res.status(200).json({ email, subscription });
  } catch (err) {
    next(err);
  }
};

const avatarUpdate = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const storeImageDir = path.join(process.cwd(), "public/images");

    const { path: tempPath } = req.file;

    console.log(`Temp Path: ${tempPath}`);
    console.log(`Store Image Dir: ${storeImageDir}`);

    const extension = path.extname(tempPath);
    const fileName = `${uuidV4()}${extension}`;
    const filePath = path.join(storeImageDir, fileName);

    const image = await Jimp.read(tempPath);
    await image.resize(250, 250).writeAsync(filePath);
    await fs.unlink(tempPath);

    const avatarURL = `../../public/avatar/${fileName}`;
    req.user.avatarURL = avatarURL;
    await req.user.save();

    res.redirect(`/avatars/${fileName}`);
    return res.status(200).json({ avatarURL });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, logout, currentUser, avatarUpdate };
