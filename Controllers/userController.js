import User from "../models/UserSchema.js";
import bcrypt from "bcrypt";

export const registerControllers = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });

    await newUser.save();
    return res.status(201).json({ success: true, message: "User registered successfully.", user: newUser });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const loginControllers = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json({ success: true, message: `Welcome back, ${user.name}!`, user: userWithoutPassword });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const setAvatarController = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const { image } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isAvatarImageSet: true, avatarImage: image },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({ isSet: user.isAvatarImageSet, image: user.avatarImage });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const allUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.params.id } }).select("email name avatarImage _id").lean();

    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
