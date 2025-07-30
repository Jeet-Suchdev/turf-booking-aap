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
import ImageCarousel from "../components/ImageCarousel";
import DatePicker from "react-datepicker";
import conf from "../../conf/conf";

// You must have this CSS import in your main App.js or index.js
// import "react-datepicker/dist/react-datepicker.css";

// A helper function to dynamically load the Razorpay script
const loadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [bookingStatus, setBookingStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [photoUrls, setPhotoUrls] = useState([]);

  useEffect(() => {
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

    fetchDetails();
  }, [id]);

  const handleSlotToggle = (slotTime) => {
    setSelectedSlots((prevSelected) => {
      if (prevSelected.includes(slotTime)) {
        return prevSelected.filter((s) => s !== slotTime);
      } else {
        return [...prevSelected, slotTime].sort();
      }
    });
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (selectedSlots.length === 0) {
      setBookingStatus({
        type: "error",
        message: "Please select at least one time slot.",
      });
      return;
    }

    setBookingStatus({ type: "loading", message: "Initializing payment..." });

    const isScriptLoaded = await loadScript(
      "https://checkout.razorpay.com/v1/checkout.js"
    );

    if (!isScriptLoaded) {
      setBookingStatus({
        type: "error",
        message:
          "Payment gateway failed to load. Please check your connection.",
      });
      return;
    }

    const totalPrice = turf.pricePerHour * selectedSlots.length;
    const advanceAmount = totalPrice / 2;

    const options = {
      key: conf.RAZORPAY_KEY,
      amount: advanceAmount * 100,
      currency: "INR",
      name: "Turf Booking (Advance)",
      description: `Advance payment for ${turf.name}`,
      image: photoUrls.length > 0 ? photoUrls[0].href : "/logo.png",
      handler: async function (response) {
        setBookingStatus({
          type: "loading",
          message: "Payment successful! Saving booking request...",
        });

        try {
          const bookingPromises = selectedSlots.map((slot) => {
            const startTime = new Date(slot);
            const bookingData = {
              turfId: turf.$id,
              userId: user.$id,
              startTime: startTime.toISOString(),
              endTime: new Date(
                startTime.getTime() + 60 * 60 * 1000
              ).toISOString(),
              totalPrice: turf.pricePerHour,
              status: "pending",
              userName: user.name,
              turfName: turf.name,
              userNumber: user?.prefs?.phone || "",
              paymentId: response.razorpay_payment_id,
            };

            return databases.createDocument(
              APPWRITE_DATABASE_ID,
              BOOKINGS_COLLECTION_ID,
              AppwriteID.unique(),
              bookingData
            );
          });

          await Promise.all(bookingPromises);

          setBookingStatus({
            type: "success",
            message: "Booking request sent successfully!",
          });

          setSelectedSlots([]);
          const bookingsResponse = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            BOOKINGS_COLLECTION_ID,
            [Query.equal("turfId", id)]
          );
          setBookings(bookingsResponse.documents);
        } catch (error) {
          console.error("Failed to save booking after payment:", error);
          setBookingStatus({
            type: "error",
            message: `Payment was successful, but saving booking failed. Contact support with Payment ID: ${response.razorpay_payment_id}`,
          });
        }
      },
      prefill: {
        name: user.name,
        email: user.email,
        contact: user?.prefs?.phone || "",
      },
      theme: {
        color: "#2a9d8f",
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.on("payment.failed", function (response) {
      setBookingStatus({
        type: "error",
        message: `Payment failed: ${response.error.description}`,
      });
    });
    paymentObject.open();
  };

  const generateSlotsForDate = (date) => {
    if (!turf?.slotConfiguration) return [];
    try {
      const config = JSON.parse(turf.slotConfiguration);
      if (!Array.isArray(config)) return [];
      const now = new Date();
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      const dayConfig = config.find((c) => c.dayOfWeek === dayOfWeek);
      if (!dayConfig || !Array.isArray(dayConfig.hours)) return [];

      const bookedTimeSlots = bookings
        .filter((b) => b.status === "approved" || b.status === "pending")
        .map((t) => new Date(t.startTime).getTime());

      return dayConfig.hours.map((hour) => {
        const slotTime = new Date(targetDate);
        slotTime.setHours(hour, 0, 0, 0);
        const isPast = slotTime < now;
        const isBooked = bookedTimeSlots.includes(slotTime.getTime());

        return { time: slotTime.toISOString(), isPast, isBooked };
      });
    } catch (err) {
      console.error("Error parsing slot configuration:", err);
      return [];
    }
  };

  const availableSlots = useMemo(
    () => generateSlotsForDate(selectedDate),
    [selectedDate, turf, bookings]
  );

  const handleDateChange = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date >= today) {
      setSelectedDate(date);
      setSelectedSlots([]);
      setBookingStatus("");
    }
  };

  const CustomDateInput = React.forwardRef(({ value, onClick }, ref) => (
    <div style={styles.dateDisplay} ref={ref}>
      <span>{value}</span>
      <span style={styles.calendarIcon} onClick={onClick}>
        📅
      </span>
    </div>
  ));

  if (loading)
    return (
      <div style={styles.pageContainer}>
        <p>Loading turf details...</p>
      </div>
    );
  if (!turf)
    return (
      <div style={styles.pageContainer}>
        <p>Turf not found.</p>
      </div>
    );

  const totalPrice = turf.pricePerHour * selectedSlots.length;
  const advanceAmount = totalPrice / 2;

  return (
    <div style={styles.pageContainer}>
      <ImageCarousel imageUrls={photoUrls} />

      <div style={styles.detailsHeader}>
        <h1 style={styles.turfName}>{turf.name}</h1>
        <div style={styles.price}>₹{turf.pricePerHour}/hour</div>
      </div>
      <p style={styles.location}>📍 {turf.location}</p>
      {turf.ownerPhone && <p style={styles.location}>📞 {turf.ownerPhone}</p>}

      <div style={styles.bookingContainer}>
        <h3 style={styles.bookingTitle}>Book a Slot</h3>

        <div style={styles.dateSelector}>
          <button
            onClick={() =>
              handleDateChange(
                new Date(
                  new Date(selectedDate).setDate(selectedDate.getDate() - 1)
                )
              )
            }
            disabled={isToday(selectedDate)}
            style={{
              ...styles.dateButton,
              ...(isToday(selectedDate) && styles.dateButtonDisabled),
            }}
          >
            &larr;
          </button>

          <DatePicker
            selected={selectedDate}
            onChange={(date) => handleDateChange(date)}
            minDate={new Date()}
            dateFormat="E, MMM d"
            customInput={<CustomDateInput />}
            popperPlacement="bottom"
            withPortal
            popperClassName="custom-datepicker-popper"
            popperModifiers={[
              { name: "offset", options: { offset: [0, 8] } },
              {
                name: "preventOverflow",
                options: { rootBoundary: "viewport" },
              },
            ]}
          />

          <button
            onClick={() =>
              handleDateChange(
                new Date(
                  new Date(selectedDate).setDate(selectedDate.getDate() + 1)
                )
              )
            }
            style={styles.dateButton}
          >
            &rarr;
          </button>
        </div>

        <div style={styles.slotsGrid}>
          {availableSlots.length > 0 ? (
            availableSlots.map(({ time, isPast, isBooked }) => {
              if (isPast) return null;
              const isSelected = selectedSlots.includes(time);
              const formattedTime = new Date(time).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });
              return (
                <button
                  key={time}
                  onClick={() => !isBooked && handleSlotToggle(time)}
                  disabled={isBooked}
                  style={{
                    ...styles.slotButton,
                    ...(isSelected && styles.slotButtonSelected),
                    ...(isBooked && styles.slotButtonBooked),
                  }}
                >
                  {formattedTime}
                </button>
              );
            })
          ) : (
            <p style={styles.noSlotsText}>No available slots for this day.</p>
          )}
        </div>

        {/* --- UI TEXT CHANGES ARE HERE --- */}
        {selectedSlots.length > 0 && (
          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <button onClick={handleBooking} style={styles.bookNowButton}>
              Pay Advance ₹{advanceAmount}
            </button>
            <p style={styles.advanceMessage}>
              {`Pay Advance & Confirm Booking`}
              <br />
              {`Advance: ₹${advanceAmount}`}
              <br />
              {`Total: ₹${totalPrice}`}
            </p>
          </div>
        )}

        {bookingStatus && (
          <p
            style={{
              ...styles.statusMessage,
              color:
                bookingStatus.type === "error"
                  ? "#dc3545"
                  : bookingStatus.type === "success"
                  ? "#198754"
                  : "#6c757d",
            }}
          >
            {bookingStatus.message}
          </p>
        )}
      </div>
    </div>
  );
};

// --- STYLES ---
const styles = {
  pageContainer: { maxWidth: "900px", margin: "0 auto", padding: "1rem" },
  detailsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
  },
  turfName: { margin: 0, color: "#212529" },
  price: { fontSize: "1.5rem", fontWeight: "bold", color: "#2a9d8f" },
  location: { fontSize: "1.1rem", color: "#6c757d", marginBottom: "0.5rem" },
  bookingContainer: {
    backgroundColor: "#f8f9fa",
    padding: "1.5rem",
    borderRadius: "12px",
    border: "1px solid #e9ecef",
    marginTop: "2rem",
  },
  bookingTitle: {
    marginTop: 0,
    marginBottom: "1.5rem",
    borderBottom: "1px solid #dee2e6",
    paddingBottom: "1rem",
  },
  dateSelector: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    marginBottom: "1.5rem",
  },
  dateButton: {
    padding: "0.5rem",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a9d8f",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1.2rem",
  },
  dateButtonDisabled: { backgroundColor: "#e9ecef", cursor: "not-allowed" },
  dateDisplay: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    fontSize: "1.1rem",
    fontWeight: "600",
    textAlign: "center",
    flexGrow: 1,
    whiteSpace: "nowrap",
  },
  calendarIcon: { cursor: "pointer", fontSize: "1.5rem", lineHeight: 1 },
  slotsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
    gap: "0.75rem",
  },
  slotButton: {
    padding: "0.75rem",
    backgroundColor: "#fff",
    color: "#212529",
    border: "1px solid #dee2e6",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
  },
  slotButtonSelected: {
    backgroundColor: "#2a9d8f",
    color: "white",
    borderColor: "#2a9d8f",
    transform: "scale(1.05)",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  },
  slotButtonBooked: {
    backgroundColor: "#e9ecef",
    color: "#6c757d",
    cursor: "not-allowed",
    textDecoration: "line-through",
  },
  noSlotsText: { color: "#6c757d", gridColumn: "1 / -1", textAlign: "center" },
  bookNowButton: {
    padding: "0.8rem 1.5rem",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1.1rem",
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%",
  },
  advanceMessage: {
    fontSize: "1rem",
    color: "#6c757d",
    marginTop: "0.5rem",
  },
  statusMessage: { marginTop: "1rem", fontWeight: "500", textAlign: "center" },
};

const customDatepickerStyles = `
  .react-datepicker-portal {
    background-color: rgba(0,0,0,0.2);
  }
  .custom-datepicker-popper {
    z-index: 10 !important;
  }
`;

if (!document.getElementById("custom-datepicker-styles")) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "custom-datepicker-styles";
  styleSheet.innerText = customDatepickerStyles;
  document.head.appendChild(styleSheet);
}

export default TurfDetailsPage;
