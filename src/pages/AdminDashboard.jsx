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

// --- A dedicated, styled component for each booking card ---
const BookingCard = ({ booking, onUpdateStatus }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const bookingDate = new Date(booking.startTime);

  const handleAction = async (status) => {
    setIsUpdating(true);
    await onUpdateStatus(booking.$id, status);
  };

  const cardStyle = {
    background: booking.status === 'pending' ? '#fffbeb' : 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    borderLeft: `5px solid ${booking.status === 'pending' ? '#f59e0b' : '#22c55e'}`,
  };

  const buttonBaseStyle = {
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginRight: '0.5rem',
    transition: 'background-color 0.2s',
  };

  // **New style for the clickable phone link**
  const phoneLinkStyle = {
      fontWeight: 'bold',
      color: '#1d4ed8',
      textDecoration: 'none'
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>{booking.turfName}</h4>
        <strong style={{ color: '#4b5563' }}>₹{booking.totalPrice}</strong>
      </div>
      <p style={{ margin: '0.5rem 0', color: '#374151' }}>
        Booked by: <strong>{booking.userName}</strong>
      </p>

      {/* --- Conditionally Rendered Phone Number --- */}
      <p style={{ margin: '0.5rem 0', color: '#374151' }}>
        Contact: {' '}
        {booking.status === 'pending' && booking.userNumber ? (
          // **Clickable link for pending bookings**
          <a href={`tel:${booking.userNumber}`} style={phoneLinkStyle}>
            {booking.userNumber}
          </a>
        ) : (
          // **Plain text for other statuses**
          <span>{booking.userNumber || 'Not provided'}</span>
        )}
      </p>
      {/* --- End of Conditional Rendering --- */}

      <p style={{ margin: '0.5rem 0 1rem 0', color: '#6b7280' }}>
        Slot: {bookingDate.toLocaleDateString('en-IN')} @ {bookingDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
      </p>
      
      {booking.status === 'pending' && (
        <div>
          <button
            style={{ ...buttonBaseStyle, backgroundColor: '#22c55e', color: 'white' }}
            onClick={() => handleAction('approved')}
            disabled={isUpdating}
          >
            {isUpdating ? '...' : 'Approve'}
          </button>
          <button
            style={{ ...buttonBaseStyle, backgroundColor: '#ef4444', color: 'white' }}
            onClick={() => handleAction('rejected')}
            disabled={isUpdating}
          >
            {isUpdating ? '...' : 'Reject'}
          </button>
        </div>
      )}
    </div>
  );
};


// --- Main Admin Dashboard Component (No changes needed here) ---
const AdminDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');

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
    padding: '10px 20px',
    fontSize: '1rem',
    fontWeight: 'bold',
    border: 'none',
    borderBottom: activeTab === tabName ? '3px solid #2a9d8f' : '3px solid transparent',
    cursor: 'pointer',
    background: 'none',
    color: activeTab === tabName ? '#2a9d8f' : '#6b7280',
  });

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const approvedBookings = bookings.filter((b) => b.status === "approved");

  return (
    <div>
      <h1>Admin Dashboard</h1>
      
      {/* Tab Navigation */}
      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '2rem' }}>
        <button style={tabButtonStyle('bookings')} onClick={() => setActiveTab('bookings')}>
          Booking Requests
        </button>
        <button style={tabButtonStyle('turfs')} onClick={() => setActiveTab('turfs')}>
          Manage Turfs
        </button>
      </div>

      {loading ? <p>Loading your data...</p> : (
        <div>
          {activeTab === 'bookings' ? (
            <div>
              <h2>Pending Requests</h2>
              {pendingBookings.length > 0 ? (
                pendingBookings.map((booking) => (
                  <BookingCard key={booking.$id} booking={booking} onUpdateStatus={handleBookingStatus} />
                ))
              ) : <p>No pending bookings.</p>}
              
              <h2 style={{ marginTop: '3rem' }}>Approved Bookings</h2>
              {approvedBookings.length > 0 ? (
                approvedBookings.map((booking) => (
                  <BookingCard key={booking.$id} booking={booking} onUpdateStatus={handleBookingStatus} />
                ))
              ) : <p>No approved bookings yet.</p>}
            </div>
          ) : (
            <ManageTurfs />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;