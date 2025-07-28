import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  databases,
  storage,
  AppwriteID,
  APPWRITE_DATABASE_ID,
  TURFS_COLLECTION_ID,
  TURF_IMAGES_BUCKET_ID,
} from "../services/appwrite";
import { Permission, Role } from "appwrite";

const AddTurfs = () => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    price: "",
    phone: "",
  });

  const daysOfWeek = [
    { id: 0, name: "Sun" },
    { id: 1, name: "Mon" },
    { id: 2, name: "Tue" },
    { id: 3, name: "Wed" },
    { id: 4, name: "Thu" },
    { id: 5, name: "Fri" },
    { id: 6, name: "Sat" },
  ];

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return {
      hour24: hour,
      display: `${displayHour.toString().padStart(2, "0")}:00 ${period}`,
    };
  });

  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);

  useEffect(() => {
    if (!photos.length) {
      setPhotoPreviews([]);
      return;
    }
    const objectUrls = photos.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(objectUrls);
    return () => objectUrls.forEach(URL.revokeObjectURL);
  }, [photos]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    if (e.target.files.length > 0) {
      setPhotos((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  // --- NEW: Function to handle removing a photo ---
  const handleRemovePhoto = (indexToRemove) => {
    // The existing useEffect will automatically update the previews
    setPhotos((prevPhotos) =>
      prevPhotos.filter((_, index) => index !== indexToRemove)
    );
  };

  const toggleDay = (dayId) => {
    setSelectedDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((id) => id !== dayId)
        : [...prev, dayId]
    );
  };

  const toggleSlot = (hour) => {
    setSelectedSlots((prev) =>
      prev.includes(hour) ? prev.filter((h) => h !== hour) : [...prev, hour]
    );
  };

  const prepareSlotData = () => {
    return selectedDays.map((dayId) => ({
      dayOfWeek: dayId,
      hours: selectedSlots.sort((a, b) => a - b),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setIsSubmitting(true);

    if (photos.length === 0) {
      setMessage({ text: "Please upload at least one photo.", type: "error" });
      setIsSubmitting(false);
      return;
    }

    try {
      const uploadPromises = photos.map((file) =>
        storage.createFile(TURF_IMAGES_BUCKET_ID, AppwriteID.unique(), file)
      );
      const uploadResults = await Promise.all(uploadPromises);
      const photoIds = uploadResults.map((res) => res.$id);

      const newTurfData = {
        name: formData.name,
        location: formData.location,
        pricePerHour: Number(formData.price),
        ownerId: user.$id,
        ownerPhone: formData.phone,
        photoIds,
        slotConfiguration: JSON.stringify(prepareSlotData()),
        openingHour: 0,
        closingHour: 23,
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        TURFS_COLLECTION_ID,
        AppwriteID.unique(),
        newTurfData,
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      );

      setFormData({ name: "", location: "", price: "", phone: "" });
      setPhotos([]);
      setSelectedDays([]);
      setSelectedSlots([]);
      setMessage({ text: "✅ Turf added successfully!", type: "success" });
    } catch (err) {
      console.error("Error adding turf:", err);
      setMessage({
        text: `❌ ${err.message || "Failed to add turf. Please try again."}`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const messageStyle = {
    ...styles.messageBox,
    ...(message.type === "success" ? styles.messageSuccess : {}),
    ...(message.type === "error" ? styles.messageError : {}),
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.formContainer}>
        <h2 style={styles.formTitle}>Add Your Turf</h2>
        <p style={styles.formSubtitle}>
          Fill in the details to get your turf listed.
        </p>

        {message.text && <p style={messageStyle}>{message.text}</p>}

        <form onSubmit={handleSubmit} noValidate>
          <div style={styles.responsiveGrid}>
            <div style={styles.inputGroup}>
              <label htmlFor="name" style={styles.inputLabel}>
                Turf Name
              </label>
              <input
                id="name"
                style={styles.input}
                type="text"
                name="name"
                placeholder="e.g., City Soccer Arena"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="location" style={styles.inputLabel}>
                Location
              </label>
              <input
                id="location"
                style={styles.input}
                type="text"
                name="location"
                placeholder="e.g., Andheri, Mumbai"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="price" style={styles.inputLabel}>
                Price Per Hour (₹)
              </label>
              <input
                id="price"
                style={styles.input}
                type="number"
                name="price"
                placeholder="e.g., 1500"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="phone" style={styles.inputLabel}>
                Contact Phone
              </label>
              <input
                id="phone"
                style={styles.input}
                type="tel"
                name="phone"
                placeholder="Your 10-digit number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionHeader}>Available Days</h3>
            <div style={styles.daysContainer}>
              {daysOfWeek.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  style={{
                    ...styles.choiceButton,
                    ...(selectedDays.includes(day.id) &&
                      styles.choiceButtonActive),
                  }}
                >
                  {day.name}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionHeader}>Available Time Slots</h3>
            <div style={styles.slotsContainer}>
              {timeSlots.map((slot) => (
                <button
                  key={slot.hour24}
                  type="button"
                  onClick={() => toggleSlot(slot.hour24)}
                  style={{
                    ...styles.choiceButton,
                    ...styles.slotButton,
                    ...(selectedSlots.includes(slot.hour24) &&
                      styles.choiceButtonActive),
                  }}
                >
                  {slot.display}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionHeader}>Upload Photos</h3>
            <div style={styles.inputGroup}>
              <label htmlFor="photo-upload" style={styles.fileInputLabel}>
                <span style={styles.fileInputIcon}>📷</span>
                <span>Click to Upload</span>
                <span style={styles.fileInputSubtext}>
                  Add at least one photo
                </span>
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                style={{ display: "none" }}
              />
              {photos.length > 0 && (
                <p style={styles.fileInfoText}>
                  {photos.length} file(s) selected.
                </p>
              )}
            </div>

            {/* --- MODIFIED: Photo preview section --- */}
            {photoPreviews.length > 0 && (
              <div style={styles.previewContainer}>
                {photoPreviews.map((src, i) => (
                  <div key={i} style={styles.previewImageContainer}>
                    <img
                      src={src}
                      alt={`Preview ${i + 1}`}
                      style={styles.previewImage}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(i)}
                      style={styles.removePhotoButton}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            style={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding Turf..." : "Add My Turf"}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- STYLES ---

const styles = {
  pageContainer: {
    minHeight: "100vh",
  },
  formContainer: {
    padding: "clamp(1rem, 4vw, 1.5rem)",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    maxWidth: "960px",
    margin: "0.5rem auto",
  },
  formTitle: {
    fontSize: "clamp(1.4rem, 5vw, 2rem)",
    fontWeight: "700",
    marginBottom: "0.25rem",
    color: "#1e293b",
    textAlign: "center",
  },
  formSubtitle: {
    textAlign: "center",
    color: "#64748b",
    marginBottom: "1.5rem",
    fontSize: "1rem",
  },
  messageBox: {
    textAlign: "center",
    marginBottom: "1.5rem",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: "500",
  },
  messageError: {
    color: "#991b1b",
    backgroundColor: "#fef2f2",
  },
  messageSuccess: {
    color: "#14532d",
    backgroundColor: "#f0fdf4",
  },
  responsiveGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "1rem",
    marginBottom: "1rem",
  },
  section: {
    borderTop: "1px solid #f1f5f9",
    paddingTop: "1.25rem",
    marginTop: "1.25rem",
  },
  sectionHeader: {
    fontSize: "1.1rem",
    fontWeight: "600",
    marginBottom: "0.75rem",
    color: "#334155",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
  },
  inputLabel: {
    marginBottom: "0.25rem",
    fontWeight: "500",
    color: "#475569",
    fontSize: "0.9rem",
  },
  input: {
    width: "85%",
    padding: "0.65rem 0.85rem",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "1rem",
    backgroundColor: "#fff",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box", // FIX: Prevents input from overflowing its container
  },
  daysContainer: {
    display: "grid", // CHANGE: Use grid for fixed columns
    gridTemplateColumns: "repeat(3, 1fr)", // CHANGE: Create 3 equal columns
    gap: "0.5rem", // Adjusted gap for grid
  },
  slotsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(95px, 1fr))",
    gap: "0.4rem",
  },
  choiceButton: {
    padding: "0.5rem",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    textAlign: "center",
    fontWeight: "500",
    fontSize: "0.85rem",
    // flexGrow is not needed for grid, items will fill cell
  },
  slotButton: {
    fontSize: "0.8rem",
  },
  choiceButtonActive: {
    backgroundColor: "#2a9d8f",
    color: "white",
    borderColor: "#2a9d8f",
  },
  fileInputLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.25rem",
    padding: "1.25rem",
    border: "2px dashed #cbd5e1",
    borderRadius: "12px",
    backgroundColor: "#f8fafc",
    textAlign: "center",
    cursor: "pointer",
    color: "#475569",
  },
  fileInputIcon: {
    fontSize: "1.6rem",
  },
  fileInputSubtext: {
    fontSize: "0.8rem",
    color: "#94a3b8",
  },
  fileInfoText: {
    textAlign: "center",
    color: "#475569",
    marginTop: "0.75rem",
    fontSize: "0.9rem",
    fontWeight: "500",
  },
  previewContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem", // Increased gap slightly
    marginTop: "1.25rem",
  },
  // --- NEW: Styles for the remove button and its container ---
  previewImageContainer: {
    position: "relative",
    width: "70px",
    height: "70px",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: "8px",
    objectFit: "cover",
    border: "2px solid #e2e8f0",
  },
  removePhotoButton: {
    position: "absolute",
    top: "-5px",
    right: "-5px",
    width: "22px",
    height: "22px",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    color: "white",
    border: "2px solid white",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    padding: 0,
    fontSize: "14px",
    fontWeight: "bold",
    transition: "background-color 0.2s, transform 0.2s",
  },
  submitButton: {
    width: "100%",
    padding: "0.8rem 1.5rem",
    backgroundColor: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s, transform 0.1s",
    marginTop: "1.5rem",
  },
};

export default AddTurfs;
