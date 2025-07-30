import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  databases,
  APPWRITE_DATABASE_ID,
  BOOKINGS_COLLECTION_ID,
} from "../services/appwrite";
import { Query } from "appwrite";

// --- A reusable Modal component for confirmations ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const modalContentStyle = {
    background: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
    width: "90%",
    maxWidth: "400px",
    textAlign: "center",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const titleStyle = {
    margin: "0 0 1rem 0",
    fontSize: "1.25rem",
  };

  const closeButtonStyle = {
    background: "transparent",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    lineHeight: 1,
  };

  const buttonContainerStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
    marginTop: "2rem",
  };

  const cancelButtonStyle = {
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    background: "#6c757d",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  };

  const confirmButtonStyle = {
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    background: "#dc3545", // Red color for destructive action
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>{title}</h2>
          <button style={closeButtonStyle} onClick={onClose}>
            &times;
          </button>
        </div>
        <p style={{ fontSize: "1rem", color: "#333" }}>{message}</p>
        <div style={buttonContainerStyle}>
          <button style={cancelButtonStyle} onClick={onClose}>
            Keep Booking
          </button>
          <button style={confirmButtonStyle} onClick={onConfirm}>
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

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

  // --- State to manage the confirmation modal ---
  const [modalState, setModalState] = useState({
    isOpen: false,
    bookingIdToCancel: null,
  });

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
          [Query.equal("userId", user.$id), Query.orderDesc("$createdAt")]
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

  // --- Opens the modal and stores the booking ID ---
  const openCancelModal = (bookingId) => {
    setModalState({ isOpen: true, bookingIdToCancel: bookingId });
  };

  // --- Closes the modal ---
  const closeCancelModal = () => {
    setModalState({ isOpen: false, bookingIdToCancel: null });
  };

  // --- Runs the actual cancellation logic after confirmation ---
  const handleConfirmCancel = async () => {
    const { bookingIdToCancel } = modalState;
    if (!bookingIdToCancel) return;

    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        BOOKINGS_COLLECTION_ID,
        bookingIdToCancel,
        { status: "cancelled" }
      );
      setBookings((prevBookings) =>
        prevBookings.map((b) =>
          b.$id === bookingIdToCancel ? { ...b, status: "cancelled" } : b
        )
      );
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      alert("Could not cancel the booking. Please try again.");
    } finally {
      closeCancelModal();
    }
  };

  if (loading) return <p>Loading your bookings...</p>;

  const cardStyle = {
    background: "white",
    borderRadius: "8px",
    padding: "1.5rem",
    marginBottom: "1rem",
    boxShadow:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  };

  return (
    <>
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={closeCancelModal}
        onConfirm={handleConfirmCancel}
        title="Confirm Cancellation"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
      />

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
                        // --- The button now opens the modal ---
                        onClick={() => openCancelModal(booking.$id)}
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
    </>
  );
};

export default MyBookingsPage;
