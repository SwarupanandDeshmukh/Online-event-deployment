import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const router = Router();

// Get all events (public)
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const events = await db.collection("events").find({}).sort({ createdAt: -1 }).toArray();
    res.status(200).json(events);
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Get single event by ID (public)
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const event = await db.collection("events").findOne({ _id: new ObjectId(req.params.id) });
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }
    res.status(200).json(event);
  } catch (error) {
    console.error("Get event error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Create event (admin only)
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, date, venue, price, totalSeats } = req.body;

    if (!name || !description || !date || !venue || price === undefined || !totalSeats) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const db = getDB();
    const newEvent = {
      name,
      description,
      date: new Date(date),
      venue,
      price: Number(price),
      totalSeats: Number(totalSeats),
      availableSeats: Number(totalSeats),
      createdAt: new Date(),
    };

    const result = await db.collection("events").insertOne(newEvent);
    newEvent._id = result.insertedId;

    res.status(201).json({ message: "Event created successfully.", event: newEvent });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Update event (admin only)
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, date, venue, price, totalSeats } = req.body;
    const db = getDB();

    const existingEvent = await db.collection("events").findOne({ _id: new ObjectId(req.params.id) });
    if (!existingEvent) {
      return res.status(404).json({ message: "Event not found." });
    }

    const registeredCount = existingEvent.totalSeats - existingEvent.availableSeats;
    const newTotalSeats = totalSeats !== undefined ? Number(totalSeats) : existingEvent.totalSeats;
    const newAvailableSeats = newTotalSeats - registeredCount;

    if (newAvailableSeats < 0) {
      return res.status(400).json({ message: `Cannot reduce total seats below ${registeredCount}. There are already ${registeredCount} registrations.` });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (date) updateData.date = new Date(date);
    if (venue) updateData.venue = venue;
    if (price !== undefined) updateData.price = Number(price);
    if (totalSeats !== undefined) {
      updateData.totalSeats = newTotalSeats;
      updateData.availableSeats = newAvailableSeats;
    }

    await db.collection("events").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    const updatedEvent = await db.collection("events").findOne({ _id: new ObjectId(req.params.id) });
    res.status(200).json({ message: "Event updated successfully.", event: updatedEvent });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Delete event (admin only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getDB();

    const event = await db.collection("events").findOne({ _id: new ObjectId(req.params.id) });
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    await db.collection("registrations").deleteMany({ eventId: new ObjectId(req.params.id) });
    await db.collection("events").deleteOne({ _id: new ObjectId(req.params.id) });

    res.status(200).json({ message: "Event and associated registrations deleted successfully." });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Get registered users for an event (admin only)
router.get("/:id/registrations", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const registrations = await db.collection("registrations")
      .find({ eventId: new ObjectId(req.params.id) })
      .sort({ registeredAt: -1 })
      .toArray();

    // Get user details for each registration
    const userIds = registrations.map((r) => r.userId);
    const users = await db.collection("users")
      .find({ _id: { $in: userIds } })
      .toArray();

    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = { name: u.name, email: u.email, phone: u.phone };
    });

    const result = registrations.map((r) => ({
      _id: r._id,
      registeredAt: r.registeredAt,
      user: userMap[r.userId.toString()] || { name: "Unknown", email: "Unknown", phone: "Unknown" },
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Get registrations error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

export default router;
