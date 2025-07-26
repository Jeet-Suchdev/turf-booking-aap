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

const AdminDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bookings");

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

  const handleBookingStatus = async (bookingId, status) => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        BOOKINGS_COLLECTION_ID,
        bookingId,
        { status }
      );
      setBookings((prev) =>
        prev.map((b) => (b.$id === bookingId ? { ...b, status } : b))
      );
    } catch (error) {
      console.error("Failed to update booking status:", error);
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

  return (
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
                    onUpdateStatus={handleBookingStatus}
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
                    onUpdateStatus={handleBookingStatus}
                  />
                ))
              ) : (
                <p>No approved bookings yet.</p>
              )}
            </div>
          )}

          {activeTab === "listed" && <ListedTurfs />}
          {activeTab === "add" && <AddTurfs />}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
