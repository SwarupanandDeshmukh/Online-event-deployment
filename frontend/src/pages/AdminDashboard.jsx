import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../utils/api";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUsers,
  HiOutlineX,
  HiOutlineCalendar,
  HiOutlineLocationMarker,
  HiOutlineCurrencyRupee,
  HiOutlineSearch,
} from "react-icons/hi";

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showRegistrations, setShowRegistrations] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [regLoading, setRegLoading] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [regSearchTerm, setRegSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    venue: "",
    price: "",
    totalSeats: "",
  });
  const [submitting, setSubmitting] = useState(false);

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

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData({ name: "", description: "", date: "", venue: "", price: "", totalSeats: "" });
    setShowModal(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    const eventDate = new Date(event.date);
    const localDate = new Date(eventDate.getTime() - eventDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setFormData({
      name: event.name,
      description: event.description,
      date: localDate,
      venue: event.venue,
      price: event.price.toString(),
      totalSeats: event.totalSeats.toString(),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        totalSeats: Number(formData.totalSeats),
      };

      if (editingEvent) {
        const res = await api.put(`/events/${editingEvent._id}`, payload);
        toast.success(res.data.message);
      } else {
        const res = await api.post("/events", payload);
        toast.success(res.data.message);
      }

      setShowModal(false);
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event? All registrations will also be deleted.")) return;

    try {
      const res = await api.delete(`/events/${eventId}`);
      toast.success(res.data.message);
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete event.");
    }
  };

  const viewRegistrations = async (event) => {
    setSelectedEvent(event);
    setRegLoading(true);
    setRegSearchTerm("");
    setShowRegistrations(true);

    try {
      const res = await api.get(`/events/${event._id}/registrations`);
      setRegistrations(res.data);
    } catch (error) {
      toast.error("Failed to fetch registrations.");
    } finally {
      setRegLoading(false);
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
          <h1>Admin Dashboard</h1>
          <p>Manage events and view registrations</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <HiOutlinePlus />
          Add New Event
        </button>
      </div>

      {events.length > 0 && (
        <div className="search-bar">
          <HiOutlineSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search events by name, description or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="search-admin-events"
          />
        </div>
      )}

      {events.length === 0 ? (
        <div className="empty-state">
          <HiOutlineCalendar className="empty-icon" />
          <h2>No Events Created</h2>
          <p>Click "Add New Event" to create your first event.</p>
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

              <div className="event-card-actions">
                <button className="btn btn-secondary" onClick={() => viewRegistrations(event)}>
                  <HiOutlineUsers />
                  Registrations
                </button>
                <button className="btn btn-secondary" onClick={() => openEditModal(event)}>
                  <HiOutlinePencil />
                  Edit
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(event._id)}>
                  <HiOutlineTrash />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Event Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingEvent ? "Edit Event" : "Create New Event"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <HiOutlineX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="event-name">Event Name</label>
                <input
                  id="event-name"
                  type="text"
                  placeholder="Enter event name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="event-description">Description</label>
                <textarea
                  id="event-description"
                  placeholder="Enter event description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="event-date">Date & Time</label>
                  <input
                    id="event-date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="event-venue">Venue</label>
                  <input
                    id="event-venue"
                    type="text"
                    placeholder="Enter venue"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="event-price">Price (₹)</label>
                  <input
                    id="event-price"
                    type="number"
                    placeholder="0"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="event-seats">Total Seats</label>
                  <input
                    id="event-seats"
                    type="number"
                    placeholder="100"
                    min="1"
                    value={formData.totalSeats}
                    onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                {submitting
                  ? editingEvent
                    ? "Updating..."
                    : "Creating..."
                  : editingEvent
                  ? "Update Event"
                  : "Create Event"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Registrations Modal */}
      {showRegistrations && (
        <div className="modal-overlay" onClick={() => setShowRegistrations(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrations — {selectedEvent?.name}</h2>
              <button className="modal-close" onClick={() => setShowRegistrations(false)}>
                <HiOutlineX />
              </button>
            </div>

            <div className="modal-body">
              {regLoading ? (
                <div className="loading-screen" style={{ minHeight: "200px" }}>
                  <div className="spinner"></div>
                </div>
              ) : registrations.length === 0 ? (
                <div className="empty-state" style={{ padding: "2rem" }}>
                  <HiOutlineUsers className="empty-icon" />
                  <h3>No Registrations</h3>
                  <p>No users have registered for this event yet.</p>
                </div>
              ) : (
                <>
                  <div className="search-bar" style={{ marginBottom: "1rem" }}>
                    <HiOutlineSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search by name, email or phone..."
                      value={regSearchTerm}
                      onChange={(e) => setRegSearchTerm(e.target.value)}
                      id="search-registrations"
                    />
                  </div>
                  {(() => {
                    const filtered = registrations.filter((reg) => {
                      const term = regSearchTerm.toLowerCase();
                      return (
                        reg.user.name.toLowerCase().includes(term) ||
                        reg.user.email.toLowerCase().includes(term) ||
                        reg.user.phone.toLowerCase().includes(term)
                      );
                    });
                    return filtered.length === 0 ? (
                      <div className="empty-state" style={{ padding: "2rem" }}>
                        <HiOutlineSearch className="empty-icon" />
                        <h3>No Results Found</h3>
                        <p>No registered users match your search.</p>
                      </div>
                    ) : (
                      <div className="registrations-table-wrapper">
                        <table className="registrations-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Phone</th>
                              <th>Registered On</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((reg, index) => (
                              <tr key={reg._id}>
                                <td>{index + 1}</td>
                                <td>{reg.user.name}</td>
                                <td>{reg.user.email}</td>
                                <td>{reg.user.phone}</td>
                                <td>{formatDate(reg.registeredAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
