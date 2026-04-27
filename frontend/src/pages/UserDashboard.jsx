import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../utils/api";
import { HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineCurrencyRupee, HiOutlineXCircle } from "react-icons/hi";

export default function UserDashboard() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const res = await api.get("/registrations/my-events");
      setRegistrations(res.data);
    } catch (error) {
      toast.error("Failed to fetch your registrations.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (eventId) => {
    if (!window.confirm("Are you sure you want to cancel this registration?")) return;

    setCancelling(eventId);
    try {
      const res = await api.delete(`/registrations/${eventId}`);
      toast.success(res.data.message);
      fetchMyEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel registration.");
    } finally {
      setCancelling(null);
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
        <h1>My Registered Events</h1>
        <p>View and manage your event registrations</p>
      </div>

      {registrations.length === 0 ? (
        <div className="empty-state">
          <HiOutlineCalendar className="empty-icon" />
          <h2>No Registrations Yet</h2>
          <p>You haven't registered for any events. Browse events to get started!</p>
        </div>
      ) : (
        <div className="events-grid">
          {registrations.map((reg) => (
            <div key={reg.registrationId} className="event-card">
              <div className="event-card-header">
                <h2 className="event-name">{reg.event?.name || "Event Deleted"}</h2>
                <span className="event-badge registered">Registered</span>
              </div>

              {reg.event && (
                <>
                  <p className="event-description">{reg.event.description}</p>

                  <div className="event-details">
                    <div className="event-detail">
                      <HiOutlineCalendar className="detail-icon" />
                      <span>{formatDate(reg.event.date)}</span>
                    </div>
                    <div className="event-detail">
                      <HiOutlineLocationMarker className="detail-icon" />
                      <span>{reg.event.venue}</span>
                    </div>
                    <div className="event-detail">
                      <HiOutlineCurrencyRupee className="detail-icon" />
                      <span>{reg.event.price === 0 ? "Free" : `₹${reg.event.price}`}</span>
                    </div>
                  </div>

                  <p className="registration-date">
                    Registered on: {formatDate(reg.registeredAt)}
                  </p>

                  <button
                    className="btn btn-danger btn-full"
                    onClick={() => handleCancel(reg.event._id)}
                    disabled={cancelling === reg.event._id}
                  >
                    <HiOutlineXCircle />
                    {cancelling === reg.event._id ? "Cancelling..." : "Cancel Registration"}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
