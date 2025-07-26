import React, { useState } from "react";

const BookingCard = ({ booking, onUpdateStatus }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const bookingDate = new Date(booking.startTime);

  const handleAction = async (status) => {
    setIsUpdating(true);
    await onUpdateStatus(booking.$id, status);
    setIsUpdating(false);
  };

  const cardStyle = {
    background: booking.status === "pending" ? "#fffbeb" : "white",
    borderRadius: "8px",
    padding: "1.5rem",
    marginBottom: "1rem",
    boxShadow:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    borderLeft: `5px solid ${
      booking.status === "pending" ? "#f59e0b" : "#22c55e"
    }`,
  };

  const buttonBaseStyle = {
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    marginRight: "0.5rem",
    transition: "background-color 0.2s",
  };

  const phoneLinkStyle = {
    fontWeight: "bold",
    color: "#1d4ed8",
    textDecoration: "none",
  };

  return (
    <div style={cardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h4 style={{ margin: 0 }}>{booking.turfName}</h4>
        <strong style={{ color: "#4b5563" }}>₹{booking.totalPrice}</strong>
      </div>
      <p style={{ margin: "0.5rem 0", color: "#374151" }}>
        Booked by: <strong>{booking.userName}</strong>
      </p>

      <p style={{ margin: "0.5rem 0", color: "#374151" }}>
        Contact:{" "}
        {booking.status === "pending" && booking.userNumber ? (
          <a href={`tel:${booking.userNumber}`} style={phoneLinkStyle}>
            {booking.userNumber}
          </a>
        ) : (
          <span>{booking.userNumber || "Not provided"}</span>
        )}
      </p>

      <p style={{ margin: "0.5rem 0 1rem 0", color: "#6b7280" }}>
        Slot: {bookingDate.toLocaleDateString("en-IN")} @{" "}
        {bookingDate.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      {booking.status === "pending" && (
        <div>
          <button
            style={{
              ...buttonBaseStyle,
              backgroundColor: "#22c55e",
              color: "white",
            }}
            onClick={() => handleAction("approved")}
            disabled={isUpdating}
          >
            {isUpdating ? "..." : "Approve"}
          </button>
          <button
            style={{
              ...buttonBaseStyle,
              backgroundColor: "#ef4444",
              color: "white",
            }}
            onClick={() => handleAction("rejected")}
            disabled={isUpdating}
          >
            {isUpdating ? "..." : "Reject"}
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingCard;
