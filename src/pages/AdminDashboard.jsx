import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  databases,
  APPWRITE_DATABASE_ID,
  TURFS_COLLECTION_ID,
  BOOKINGS_COLLECTION_ID,
} from "../services/appwrite";
import { Query } from "appwrite";
import AddTurfs from "../components/AddTurfs";
import ListedTurfs from "../components/ListedTurf";
import BookingCard from "../components/BookingCard";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant,
}) => {
  if (!isOpen) return null;

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const modalContentStyle = {
    background: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    width: "90%",
    maxWidth: "400px",
    textAlign: "center",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #eee",
    paddingBottom: "1rem",
    marginBottom: "1rem",
  };

  const titleStyle = {
    margin: 0,
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

  // --- FIX 1: Corrected conditional logic from 'approve' to 'approved' ---
  const confirmButtonStyle = {
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    background: variant === "approved" ? "#28a745" : "#dc3545", // Green for approve, Red for reject
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
            Cancel
          </button>
          {/* --- FIX 2: Corrected conditional logic for button text --- */}
          <button style={confirmButtonStyle} onClick={onConfirm}>
            {variant === "approved" ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bookings");

  const [modalState, setModalState] = useState({
    isOpen: false,
    bookingId: null,
    newStatus: null,
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const turfResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          TURFS_COLLECTION_ID,
          [Query.equal("ownerId", user.$id)]
        );
        const adminTurfIds = turfResponse.documents.map((turf) => turf.$id);

        if (adminTurfIds.length > 0) {
          const bookingsResponse = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            BOOKINGS_COLLECTION_ID,
            [Query.equal("turfId", adminTurfIds), Query.orderDesc("$createdAt")]
          );
          setBookings(bookingsResponse.documents);
        } else {
          setBookings([]);
        }
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [user]);

  const openConfirmationModal = (bookingId, newStatus) => {
    setModalState({
      isOpen: true,
      bookingId,
      newStatus,
    });
  };

  const closeConfirmationModal = () => {
    setModalState({ isOpen: false, bookingId: null, newStatus: null });
  };

  const handleConfirmAction = async () => {
    const { bookingId, newStatus } = modalState;
    if (!bookingId || !newStatus) return;

    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        BOOKINGS_COLLECTION_ID,
        bookingId,
        { status: newStatus }
      );
      setBookings((prev) =>
        prev.map((b) => (b.$id === bookingId ? { ...b, status: newStatus } : b))
      );
    } catch (error) {
      console.error("Failed to update booking status:", error);
    } finally {
      closeConfirmationModal();
    }
  };

  const tabButtonStyle = (tabName) => ({
    padding: "10px 20px",
    fontSize: "1rem",
    fontWeight: "bold",
    border: "none",
    borderBottom:
      activeTab === tabName ? "3px solid #2a9d8f" : "3px solid transparent",
    cursor: "pointer",
    background: "none",
    color: activeTab === tabName ? "#2a9d8f" : "#6b7280",
  });

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const approvedBookings = bookings.filter((b) => b.status === "approved");
  const rejectedBookings = bookings.filter((b) => b.status === "rejected");

  return (
    <>
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={handleConfirmAction}
        variant={modalState.newStatus}
        title={`Confirm ${
          modalState.newStatus === "approved" ? "Approval" : "Rejection"
        }`}
        message={`Are you sure you want to ${
          modalState.newStatus === "approved" ? "approve" : "reject"
        } this booking? This action cannot be undone.`}
      />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <h1 style={{ marginBottom: "30px" }}>Admin Dashboard</h1>

        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e5e7eb",
            marginBottom: "2rem",
            gap: "10px",
          }}
        >
          <button
            style={tabButtonStyle("bookings")}
            onClick={() => setActiveTab("bookings")}
          >
            Booking Requests
          </button>
          <button
            style={tabButtonStyle("listed")}
            onClick={() => setActiveTab("listed")}
          >
            Listed Turfs
          </button>
          <button
            style={tabButtonStyle("add")}
            onClick={() => setActiveTab("add")}
          >
            Add Turfs
          </button>
        </div>

        {loading ? (
          <p>Loading your data...</p>
        ) : (
          <div>
            {activeTab === "bookings" && (
              <div>
                <h2>Pending Requests</h2>
                {pendingBookings.length > 0 ? (
                  pendingBookings.map((booking) => (
                    <BookingCard
                      key={booking.$id}
                      booking={booking}
                      onUpdateStatus={openConfirmationModal}
                    />
                  ))
                ) : (
                  <p>No pending bookings.</p>
                )}

                <h2 style={{ marginTop: "3rem" }}>Approved Bookings</h2>
                {approvedBookings.length > 0 ? (
                  approvedBookings.map((booking) => (
                    <BookingCard
                      key={booking.$id}
                      booking={booking}
                      onUpdateStatus={openConfirmationModal}
                    />
                  ))
                ) : (
                  <p>No approved bookings yet.</p>
                )}

                <h2 style={{ marginTop: "3rem" }}>Rejected Bookings</h2>
                {rejectedBookings.length > 0 ? (
                  rejectedBookings.map((booking) => (
                    <BookingCard
                      key={booking.$id}
                      booking={booking}
                      onUpdateStatus={openConfirmationModal}
                    />
                  ))
                ) : (
                  <p>No rejected bookings.</p>
                )}
              </div>
            )}

            {activeTab === "listed" && <ListedTurfs />}
            {activeTab === "add" && <AddTurfs />}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminDashboard;
