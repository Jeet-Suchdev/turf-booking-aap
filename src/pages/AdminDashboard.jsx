import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  databases,
  APPWRITE_DATABASE_ID,
  TURFS_COLLECTION_ID,
  BOOKINGS_COLLECTION_ID,
} from "../services/appwrite";
import { Query } from "appwrite";
import ManageTurfs from "../components/ManageTurfs";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

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

        if (adminTurfIds.length === 0) {
          setBookings([]);
          setLoading(false);
          return;
        }

        // Fetch all bookings for the admin's turfs in a single query
        const bookingsResponse = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            BOOKINGS_COLLECTION_ID,
            [Query.equal("turfId", adminTurfIds)]
        );
        
        setBookings(bookingsResponse.documents);
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

  if (loading) return <p>Loading admin dashboard...</p>;

  // Separate bookings by status
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const approvedBookings = bookings.filter((b) => b.status === "approved");

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <h2>Your Schedule</h2>

      <h3>Pending Bookings</h3>
      {pendingBookings.length === 0 ? (
        <p>No pending bookings.</p>
      ) : (
        <div className="card-content" style={{ background: "#fffbe6" }}>
          {pendingBookings.map((booking) => (
            <div
              key={booking.$id}
              style={{ borderBottom: "1px solid #eee", padding: "1rem 0" }}
            >
              <p>
                <strong>Booked by:</strong> {booking.userName}
              </p>
              {/* **Display User Phone Number** */}
              <p>
                <strong>User Phone:</strong> {booking.userNumber || "Not provided"}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {new Date(booking.startTime).toLocaleString()}
              </p>
              <p>
                <strong>Turf Name:</strong> {booking.turfName}
              </p>
              <button onClick={() => handleBookingStatus(booking.$id, "approved")}>Approve</button>
              <button onClick={() => handleBookingStatus(booking.$id, "rejected")}>Reject</button>
            </div>
          ))}
        </div>
      )}

      <h3>Approved Bookings</h3>
      {approvedBookings.length === 0 ? (
        <p>You have no confirmed bookings for your turfs.</p>
      ) : (
        <div className="card-content" style={{ background: "white" }}>
          {approvedBookings.map((booking) => (
            <div
              key={booking.$id}
              style={{ borderBottom: "1px solid #eee", padding: "1rem 0" }}
            >
              <p>
                <strong>Booked by:</strong> {booking.userName}
              </p>
              {/* **Display User Phone Number** */}
              <p>
                <strong>User Phone:</strong> {booking.userNumber || "Not provided"}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {new Date(booking.startTime).toLocaleString()}
              </p>
              <p>
                <strong>Turf Name:</strong> {booking.turfName}
              </p>
            </div>
          ))}
        </div>
      )}
      <ManageTurfs />
    </div>
  );
};

export default AdminDashboard;