import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useParams, useNavigate } from "react-router-dom";
import {
  databases,
  storage,
  AppwriteID,
  APPWRITE_DATABASE_ID,
  TURFS_COLLECTION_ID,
  TURF_IMAGES_BUCKET_ID,
} from "../services/appwrite";
import { Permission, Role, Query } from "appwrite";

const UpdateTurf = () => {
  const { id: turfId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [existingPhotoPreviews, setExistingPhotoPreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(true);

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
  const [photosToDelete, setPhotosToDelete] = useState([]);

  useEffect(() => {
    const fetchTurfData = async () => {
      try {
        const turf = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          TURFS_COLLECTION_ID,
          turfId
        );

        if (turf.ownerId !== user?.$id) {
          navigate("/");
          return;
        }

        setFormData({
          name: turf.name,
          location: turf.location,
          price: turf.pricePerHour.toString(),
          phone: turf.ownerPhone,
        });

        const slotConfig = JSON.parse(turf.slotConfiguration || "[]");
        setSelectedDays(slotConfig.map((d) => d.dayOfWeek));
        setSelectedSlots(slotConfig.length > 0 ? slotConfig[0].hours : []);

        const photoIds = turf.photoIds || [];
        setExistingPhotos(photoIds);

        if (photoIds.length > 0) {
          const previews = await Promise.all(
            photoIds.map(async (id) => {
              const url = storage.getFileView(TURF_IMAGES_BUCKET_ID, id);
              return { id, url };
            })
          );
          setExistingPhotoPreviews(previews);
        }
      } catch (error) {
        console.error("Error fetching turf:", error);
        setMessage({ text: "Failed to load turf data.", type: "error" });
        navigate("/admin/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    if (user && turfId) {
      fetchTurfData();
    }
  }, [user, turfId, navigate]);

  useEffect(() => {
    if (!photos.length) {
      setPhotoPreviews([]);
      return;
    }
    const newObjectUrls = photos.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(newObjectUrls);
    return () => newObjectUrls.forEach(URL.revokeObjectURL);
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

  const handleDeleteExistingPhoto = (photoId) => {
    setPhotosToDelete((prev) => [...prev, photoId]);
    setExistingPhotos((prev) => prev.filter((id) => id !== photoId));
    setExistingPhotoPreviews((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleRemoveNewPhoto = (indexToRemove) => {
    setPhotos((prevPhotos) =>
      prevPhotos.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: "", type: "" });

    try {
      const deletePromises = photosToDelete.map((id) =>
        storage.deleteFile(TURF_IMAGES_BUCKET_ID, id)
      );
      await Promise.all(deletePromises);

      let newPhotoIds = [];
      if (photos.length > 0) {
        const uploadPromises = photos.map((file) =>
          storage.createFile(TURF_IMAGES_BUCKET_ID, AppwriteID.unique(), file, [
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
          ])
        );
        const uploadResults = await Promise.all(uploadPromises);
        newPhotoIds = uploadResults.map((res) => res.$id);
      }

      const finalPhotoIds = [...existingPhotos, ...newPhotoIds];
      const updatedTurfData = {
        name: formData.name,
        location: formData.location,
        pricePerHour: Number(formData.price),
        ownerPhone: formData.phone,
        photoIds: finalPhotoIds,
        slotConfiguration: JSON.stringify(prepareSlotData()),
      };

      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        TURFS_COLLECTION_ID,
        turfId,
        updatedTurfData
      );

      setMessage({ text: "✅ Turf updated successfully!", type: "success" });
      setTimeout(() => navigate("/admin/dashboard"), 1500);
    } catch (err) {
      console.error("Error updating turf:", err);
      setMessage({
        text: `❌ ${err.message || "Failed to update."}`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={styles.loadingContainer}>Loading turf data...</div>;
  }

  const messageStyle = {
    ...styles.messageBox,
    ...(message.type === "success" ? styles.messageSuccess : {}),
    ...(message.type === "error" ? styles.messageError : {}),
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.formContainer}>
        <h2 style={styles.formTitle}>Update Your Turf</h2>
        <p style={styles.formSubtitle}>
          Update the details of your turf listing.
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
            <h3 style={styles.sectionHeader}>Turf Photos</h3>

            {existingPhotoPreviews.length > 0 && (
              <div style={styles.existingPhotosContainer}>
                <h4 style={styles.existingPhotosTitle}>Current Photos</h4>
                <div style={styles.previewContainer}>
                  {existingPhotoPreviews.map((photo) => (
                    <div key={photo.id} style={styles.photoContainer}>
                      <div style={styles.imageWrapper}>
                        <img
                          src={photo.url}
                          alt="Turf Preview"
                          style={styles.previewImage}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/150";
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingPhoto(photo.id)}
                        style={styles.deletePhotoButton}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {photoPreviews.length > 0 && (
              <div style={styles.existingPhotosContainer}>
                <h4 style={styles.existingPhotosTitle}>New Photos to Add</h4>
                <div style={styles.previewContainer}>
                  {photoPreviews.map((src, i) => (
                    <div key={i} style={styles.photoContainer}>
                      <div style={styles.imageWrapper}>
                        <img
                          src={src}
                          alt={`New Preview ${i + 1}`}
                          style={styles.previewImage}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewPhoto(i)}
                        style={styles.deletePhotoButton}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={styles.inputGroup}>
              <label htmlFor="photo-upload" style={styles.fileInputLabel}>
                <span style={styles.fileInputIcon}>📷</span>
                <span>Add More Photos</span>
                <span style={styles.fileInputSubtext}>
                  {photos.length > 0
                    ? `${photos.length} new file(s) selected`
                    : "Select new photos to upload"}
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
            </div>
          </div>

          <button
            type="submit"
            style={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating Turf..." : "Update Turf"}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontSize: "1.2rem",
  },
  pageContainer: { padding: "0.5rem", minHeight: "100vh" },
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
  messageError: { color: "#991b1b", backgroundColor: "#fef2f2" },
  messageSuccess: { color: "#14532d", backgroundColor: "#f0fdf4" },
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
  inputGroup: { display: "flex", flexDirection: "column" },
  inputLabel: {
    marginBottom: "0.25rem",
    fontWeight: "500",
    color: "#475569",
    fontSize: "0.9rem",
  },
  input: {
    width: "100%",
    padding: "0.65rem 0.85rem",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "1rem",
    backgroundColor: "#fff",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  },
  daysContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "0.5rem",
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
  },
  slotButton: { fontSize: "0.8rem" },
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
    marginTop: "1rem",
  },
  fileInputIcon: { fontSize: "1.6rem" },
  fileInputSubtext: { fontSize: "0.8rem", color: "#94a3b8" },
  existingPhotosContainer: { marginBottom: "1.5rem" },
  existingPhotosTitle: {
    fontSize: "0.95rem",
    color: "#334155",
    fontWeight: "600",
    marginBottom: "0.75rem",
  },
  previewContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
    marginTop: "0.5rem",
  },
  photoContainer: {
    position: "relative",
    width: "150px",
    height: "150px",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: "8px",
    border: "2px solid #e2e8f0",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  deletePhotoButton: {
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

export default UpdateTurf;
