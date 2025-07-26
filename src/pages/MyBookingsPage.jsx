import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Modal, Button } from "react-bootstrap"; // 1. Import Modal and Button
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

  // 2. Add state for the modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);

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

  // 3. Function to open the modal
  const handleCancelClick = (bookingId) => {
    setBookingToCancel(bookingId);
    setShowCancelModal(true);
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setBookingToCancel(null);
    setShowCancelModal(false);
  };

  // 4. Function to run when cancellation is confirmed
  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;

    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        BOOKINGS_COLLECTION_ID,
        bookingToCancel,
        { status: "cancelled" }
      );
      setBookings((prevBookings) =>
        prevBookings.map((b) =>
          b.$id === bookingToCancel ? { ...b, status: "cancelled" } : b
        )
      );
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      alert("Could not cancel the booking. Please try again.");
    } finally {
      // Close the modal after the action is complete
      handleCloseModal();
    }
  };

  if (loading)
    return (
      <div style={styles.pageContainer}>
        <p>Loading your bookings...</p>
      </div>
    );

  return (
    <div style={styles.pageContainer}>
      <h1 style={styles.pageTitle}>My Bookings</h1>
      {bookings.length === 0 ? (
        <p style={styles.emptyText}>You have no bookings.</p>
      ) : (
        <div>
          {bookings.map((booking) => {
            const bookingDate = new Date(booking.startTime);
            const isCancellable =
              booking.status === "pending" || booking.status === "approved";

            return (
              <div key={booking.$id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.turfName}>{booking.turfName}</h3>
                  <BookingStatusBadge status={booking.status} />
                </div>

                <div style={styles.cardBody}>
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
                  <div style={styles.cardFooter}>
                    <Button
                      variant="outline-danger"
                      // 5. Trigger the modal instead of window.confirm
                      onClick={() => handleCancelClick(booking.$id)}
                    >
                      Cancel Booking
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Add the Modal component to the page */}
      <Modal show={showCancelModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Cancellation</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to cancel this booking?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Back
          </Button>
          <Button variant="danger" onClick={handleConfirmCancel}>
            Yes, Cancel Booking
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// --- STYLES ---
const styles = {
  pageContainer: {
    maxWidth: "800px",
    margin: "2rem auto",
    padding: "0 1rem",
  },
  pageTitle: {
    marginBottom: "2rem",
    textAlign: "center",
    fontWeight: "700",
    color: "#212529",
  },
  emptyText: {
    textAlign: "center",
    color: "#6c757d",
    fontSize: "1.1rem",
  },
  card: {
    background: "white",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    border: "1px solid #e9ecef",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid #e9ecef",
  },
  turfName: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: "600",
  },
  cardBody: {
    color: "#495057",
    fontSize: "1rem",
    lineHeight: "1.6",
  },
  cardFooter: {
    marginTop: "1.5rem",
    borderTop: "1px solid #e5e7eb",
    paddingTop: "1rem",
    textAlign: "right",
  },
};

export default MyBookingsPage;
