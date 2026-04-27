import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineCurrencyRupee, HiOutlineUsers, HiOutlineTicket, HiOutlineSearch } from "react-icons/hi";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get("/events");
      setEvents(res.data);
    } catch (error) {
      toast.error("Failed to fetch events.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    if (!user) {
      toast.info("Please login to register for events.");
      return;
    }
    setRegistering(eventId);
    try {
      const res = await api.post(`/registrations/${eventId}`);
      toast.success(res.data.message);
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed.");
    } finally {
      setRegistering(null);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredEvents = events.filter((event) => {
    const term = searchTerm.toLowerCase();
    return (
      event.name.toLowerCase().includes(term) ||
      event.description.toLowerCase().includes(term) ||
      event.venue.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Upcoming Events</h1>
          <p>Browse and register for exciting events</p>
        </div>
      </div>

      {events.length > 0 && (
        <div className="search-bar">
          <HiOutlineSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search events by name, description or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="search-events"
          />
        </div>
      )}

      {events.length === 0 ? (
        <div className="empty-state">
          <HiOutlineCalendar className="empty-icon" />
          <h2>No Events Available</h2>
          <p>Check back later for upcoming events.</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="empty-state">
          <HiOutlineSearch className="empty-icon" />
          <h2>No Results Found</h2>
          <p>No events match your search. Try different keywords.</p>
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map((event, index) => (
            <div key={event._id} className="event-card" style={{ animationDelay: `${index * 0.06}s` }}>
              <div className="event-card-header">
                <h2 className="event-name">{event.name}</h2>
                <span className={`event-badge ${event.availableSeats > 0 ? "available" : "full"}`}>
                  {event.availableSeats > 0 ? `${event.availableSeats} seats left` : "Housefull"}
                </span>
              </div>

              <p className="event-description">{event.description}</p>

              <div className="event-details">
                <div className="event-detail">
                  <HiOutlineCalendar className="detail-icon" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="event-detail">
                  <HiOutlineLocationMarker className="detail-icon" />
                  <span>{event.venue}</span>
                </div>
                <div className="event-detail">
                  <HiOutlineCurrencyRupee className="detail-icon" />
                  <span>{event.price === 0 ? "Free" : `₹${event.price}`}</span>
                </div>
                <div className="event-detail">
                  <HiOutlineUsers className="detail-icon" />
                  <span>{event.availableSeats} / {event.totalSeats} seats</span>
                </div>
              </div>

              {user && user.role !== "admin" && (
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => handleRegister(event._id)}
                  disabled={event.availableSeats <= 0 || registering === event._id}
                >
                  <HiOutlineTicket />
                  {registering === event._id
                    ? "Registering..."
                    : event.availableSeats <= 0
                    ? "No Seats Available"
                    : "Register Now"}
                </button>
              )}

              {!user && (
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => handleRegister(event._id)}
                  disabled={event.availableSeats <= 0}
                >
                  <HiOutlineTicket />
                  {event.availableSeats <= 0 ? "No Seats Available" : "Login to Register"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
