import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  databases,
  APPWRITE_DATABASE_ID,
  BOOKINGS_COLLECTION_ID,
} from "../services/appwrite";
import { Query } from "appwrite";

// A small component to render a styled status badge
const BookingStatusBadge = ({ status }) => {
  const style = {
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    color: "white",
    textTransform: "capitalize",
  };

  const statusStyles = {
    pending: { ...style, backgroundColor: "#f59e0b" },
    approved: { ...style, backgroundColor: "#22c55e" },
    rejected: { ...style, backgroundColor: "#ef4444" },
    cancelled: { ...style, backgroundColor: "#64748b" },
    default: { ...style, backgroundColor: "#64748b" },
  };

  return (
    <span style={statusStyles[status.toLowerCase()] || statusStyles.default}>
      {status}
    </span>
  );
};

const MyBookingsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          BOOKINGS_COLLECTION_ID,
          [Query.equal("userId", user.$id), Query.orderDesc("$createdAt")] // Order by most recent
        );
        setBookings(response.documents);
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const handleCancel = async (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          BOOKINGS_COLLECTION_ID,
          bookingId,
          { status: "cancelled" } // Using lowercase for consistency
        );
        // Optimistic UI update for a smoother experience
        setBookings((prevBookings) =>
          prevBookings.map((b) =>
            b.$id === bookingId ? { ...b, status: "cancelled" } : b
          )
        );
      } catch (error) {
        console.error("Failed to cancel booking:", error);
        alert("Could not cancel the booking. Please try again.");
      }
    }
  };

  if (loading) return <p>Loading your bookings...</p>;

  // Card styles for a clean look
  const cardStyle = {
    background: "white",
    borderRadius: "8px",
    padding: "1.5rem",
    marginBottom: "1rem",
    boxShadow:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  };

  return (
    <div>
      <h1 style={{ marginBottom: "1.5rem" }}>My Bookings</h1>
      {bookings.length === 0 ? (
        <p>You have no bookings.</p>
      ) : (
        <div>
          {bookings.map((booking) => {
            const bookingDate = new Date(booking.startTime);
            const isCancellable =
              booking.status === "pending" || booking.status === "approved";

            return (
              <div key={booking.$id} style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "1.25rem" }}>
                    {booking.turfName}
                  </h3>
                  <BookingStatusBadge status={booking.status} />
                </div>

                <div style={{ color: "#4b5563", fontSize: "0.9rem" }}>
                  <p>
                    <strong>🗓️ Date:</strong>{" "}
                    {bookingDate.toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p>
                    <strong>⏰ Time:</strong>{" "}
                    {bookingDate.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                  <p>
                    <strong>💰 Price:</strong> ₹{booking.totalPrice}
                  </p>
                </div>

                {isCancellable && (
                  <div
                    style={{
                      marginTop: "1.5rem",
                      borderTop: "1px solid #e5e7eb",
                      paddingTop: "1rem",
                      textAlign: "right",
                    }}
                  >
                    <button
                      className="danger"
                      onClick={() => handleCancel(booking.$id)}
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
