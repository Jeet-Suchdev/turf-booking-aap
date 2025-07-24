import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  databases,
  storage,
  AppwriteID,
  APPWRITE_DATABASE_ID,
  TURFS_COLLECTION_ID,
  BOOKINGS_COLLECTION_ID,
  TURF_IMAGES_BUCKET_ID,
} from "../services/appwrite";
import { useAuth } from "../hooks/useAuth";
import { Query } from "appwrite";

const isToday = (someDate) => {
  const today = new Date();
  return (
    someDate.getDate() === today.getDate() &&
    someDate.getMonth() === today.getMonth() &&
    someDate.getFullYear() === today.getFullYear()
  );
};

const TurfDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [turf, setTurf] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [photoUrls, setPhotoUrls] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const turfPromise = databases.getDocument(
        APPWRITE_DATABASE_ID,
        TURFS_COLLECTION_ID,
        id
      );
      const bookingsPromise = databases.listDocuments(
        APPWRITE_DATABASE_ID,
        BOOKINGS_COLLECTION_ID,
        [Query.equal("turfId", id)]
      );
      const [turfResponse, bookingsResponse] = await Promise.all([
        turfPromise,
        bookingsPromise,
      ]);
      setTurf(turfResponse);
      setBookings(bookingsResponse.documents);
      if (turfResponse.photoIds && turfResponse.photoIds.length > 0) {
        setPhotoUrls(
          turfResponse.photoIds.map((pid) =>
            storage.getFileView(TURF_IMAGES_BUCKET_ID, pid)
          )
        );
      } else {
        setPhotoUrls([]);
      }
    } catch (err) {
      console.error("Error fetching details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleBooking = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!selectedSlot) {
      setBookingStatus("Please select a time slot.");
      return;
    }

    setBookingStatus("Requesting booking...");
    const startTime = new Date(selectedSlot);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const newBookingId = AppwriteID.unique();

    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        BOOKINGS_COLLECTION_ID,
        newBookingId,
        {
          userId: user.$id,
          userName: user.name,
          turfId: turf.$id,
          turfName: turf.name,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          totalPrice: turf.pricePerHour,
          status: "pending",
          // **Add the user's phone number here**
          userNumber: user?.prefs?.phone || "",
        }
      );

      setBookingStatus("Booking request sent! Awaiting owner approval.");
      setSelectedSlot("");
      fetchDetails();
    } catch (error) {
      console.error("Booking failed:", error);
      setBookingStatus(`Booking failed: ${error.message}`);
    }
  };

  const generateSlotsForDate = (date) => {
    if (!turf) return [];
    const slots = [];
    const now = new Date();
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    for (let hour = turf.openingHour; hour < turf.closingHour; hour++) {
      const slotTime = new Date(targetDate);
      slotTime.setHours(hour, 0, 0, 0);
      if (slotTime < now) continue;

      const isBooked = bookings.some((b) => {
        if (b.status !== "approved") return false;
        const bookingStartTime = new Date(b.startTime);
        return (
          bookingStartTime.toDateString() === targetDate.toDateString() &&
          bookingStartTime.getHours() === hour
        );
      });
      if (!isBooked) slots.push(slotTime.toISOString());
    }
    return slots;
  };

  const availableSlots = useMemo(
    () => generateSlotsForDate(selectedDate),
    [selectedDate, turf, bookings]
  );

  const handleDateChange = (daysToAdd) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + daysToAdd);
    if (isToday(newDate) || newDate > new Date()) {
      setSelectedDate(newDate);
      setSelectedSlot("");
    }
  };

  const handlePrev = () => {
    setCarouselIndex((prev) => (prev === 0 ? photoUrls.length - 1 : prev - 1));
  };
  const handleNext = () => {
    setCarouselIndex((prev) => (prev === photoUrls.length - 1 ? 0 : prev + 1));
  };

  if (loading) return <p>Loading turf details...</p>;
  if (!turf) return <p>Turf not found.</p>;

  return (
    <div className="card-content">
      {/* Carousel */}
      {photoUrls.length > 0 && (
        <div style={{ position: "relative", marginBottom: 24 }}>
          <img
            src={photoUrls[carouselIndex]}
            alt={`Turf photo ${carouselIndex + 1}`}
            style={{ width: "100%", height: 320, objectFit: "cover", borderRadius: 8 }}
          />
          {photoUrls.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                style={{ position: "absolute", top: "50%", left: 8, transform: "translateY(-50%)", zIndex: 2 }}
              >
                &#8592;
              </button>
              <button
                onClick={handleNext}
                style={{ position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)", zIndex: 2 }}
              >
                &#8594;
              </button>
            </>
          )}
          <div style={{ textAlign: "center", marginTop: 4 }}>
            {photoUrls.map((_, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: i === carouselIndex ? "#333" : "#ccc",
                  margin: "0 2px",
                }}
              />
            ))}
          </div>
        </div>
      )}
      <h1>{turf.name}</h1>
      <p>
        <strong>Location:</strong> {turf.location}
      </p>
      <p>
        <strong>Price:</strong> ₹{turf.pricePerHour}/hour
      </p>
      <p>
        <strong>Owner Contact:</strong> {turf.ownerPhone || "Not provided"}
      </p>

      <h3>Select a Date</h3>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <button
          onClick={() => handleDateChange(-1)}
          disabled={isToday(selectedDate)}
        >
          Previous Day
        </button>
        <strong>
          {selectedDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </strong>
        <button onClick={() => handleDateChange(1)}>Next Day</button>
      </div>

      <h4>Available Slots</h4>
      <div>
        {availableSlots.length > 0 ? (
          availableSlots.map((slot) => (
            <button
              key={slot}
              className={selectedSlot === slot ? "" : "secondary"}
              style={{ margin: "5px" }}
              onClick={() => setSelectedSlot(slot)}
            >
              {new Date(slot).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </button>
          ))
        ) : (
          <p>No available slots for this day.</p>
        )}
      </div>

      {selectedSlot && (
        <div style={{ marginTop: "1rem" }}>
          <button onClick={handleBooking}>
            Request Booking for {new Date(selectedSlot).toLocaleTimeString()}
          </button>
        </div>
      )}
      {bookingStatus && <p style={{ marginTop: "1rem" }}>{bookingStatus}</p>}
    </div>
  );
};

export default TurfDetailsPage;