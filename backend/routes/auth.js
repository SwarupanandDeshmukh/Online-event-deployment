import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDB } from "../config/db.js";

const router = Router();

// User Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const db = getDB();
    const usersCollection = db.collection("users");

    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      createdAt: new Date(),
    };

    await usersCollection.insertOne(newUser);

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully.",
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, phone: newUser.phone, role: "user" },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// User Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Check if admin
    if (email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()) {
      const isMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      const token = jwt.sign(
        { id: "admin", email: process.env.ADMIN_EMAIL, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        message: "Admin login successful.",
        token,
        user: { id: "admin", name: "Admin", email: process.env.ADMIN_EMAIL, role: "admin" },
      });
    }

    // Normal user login
    const db = getDB();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: "user" },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

export default router;
