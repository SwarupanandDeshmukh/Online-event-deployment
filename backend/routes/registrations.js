import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// Register for an event
router.post("/:eventId", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const eventId = new ObjectId(req.params.eventId);
    const userId = new ObjectId(req.user.id);

    // Check if event exists
    const event = await db.collection("events").findOne({ _id: eventId });
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Check available seats
    if (event.availableSeats <= 0) {
      return res.status(400).json({ message: "No seats available for this event." });
    }

    // Check for duplicate registration
    const existingRegistration = await db.collection("registrations").findOne({
      eventId: eventId,
      userId: userId,
    });
    if (existingRegistration) {
      return res.status(400).json({ message: "You are already registered for this event." });
    }

    // Create registration
    const registration = {
      eventId: eventId,
      userId: userId,
      registeredAt: new Date(),
    };

    await db.collection("registrations").insertOne(registration);

    // Decrease available seats
    await db.collection("events").updateOne(
      { _id: eventId },
      { $inc: { availableSeats: -1 } }
    );

    res.status(201).json({ message: "Successfully registered for the event." });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Cancel registration
router.delete("/:eventId", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const eventId = new ObjectId(req.params.eventId);
    const userId = new ObjectId(req.user.id);

    // Check if registration exists
    const registration = await db.collection("registrations").findOne({
      eventId: eventId,
      userId: userId,
    });
    if (!registration) {
      return res.status(404).json({ message: "Registration not found." });
    }

    // Delete registration
    await db.collection("registrations").deleteOne({ _id: registration._id });

    // Increase available seats
    await db.collection("events").updateOne(
      { _id: eventId },
      { $inc: { availableSeats: 1 } }
    );

    res.status(200).json({ message: "Registration cancelled successfully." });
  } catch (error) {
    console.error("Cancel registration error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Get user's registered events
router.get("/my-events", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const userId = new ObjectId(req.user.id);

    const registrations = await db.collection("registrations")
      .find({ userId: userId })
      .sort({ registeredAt: -1 })
      .toArray();

    const eventIds = registrations.map((r) => r.eventId);
    const events = await db.collection("events")
      .find({ _id: { $in: eventIds } })
      .toArray();

    const eventMap = {};
    events.forEach((e) => {
      eventMap[e._id.toString()] = e;
    });

    const result = registrations.map((r) => ({
      registrationId: r._id,
      registeredAt: r.registeredAt,
      event: eventMap[r.eventId.toString()] || null,
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Get my events error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

export default router;
