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
import { Query, Permission, Role } from "appwrite";

// --- Style Objects for a Consistent Look ---
const styles = {
  formContainer: {
    padding: '2rem',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    marginBottom: '2rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '1rem',
    marginBottom: '1rem',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#2a9d8f',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  // --- New styles for the custom file input ---
  fileInputLabel: {
    display: 'inline-block',
    padding: '0.75rem 1.25rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    backgroundColor: '#f9fafb',
    fontWeight: '500',
    marginBottom: '1rem',
    transition: 'background-color 0.2s',
  },
  fileInfoText: {
    marginLeft: '1rem',
    color: '#4b5563',
    fontStyle: 'italic',
  },
  // --- End of new styles ---
  turfCard: {
    background: "white",
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  delistButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
  }
};

// --- Child Component for the "Add Turf" Form ---
const TurfForm = ({ formData, setFormData, photos, setPhotos, photoPreviews, onSubmit, isSubmitting, error }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    setPhotos(Array.from(e.target.files));
  };

  return (
    <div style={styles.formContainer}>
      <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>List a New Turf</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={onSubmit}>
        <input style={styles.input} type="text" name="name" placeholder="Turf Name" value={formData.name} onChange={handleChange} required />
        <input style={styles.input} type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} required />
        <input style={styles.input} type="number" name="price" placeholder="Price Per Hour" value={formData.price} onChange={handleChange} required />
        <input style={styles.input} type="tel" name="phone" placeholder="Contact Phone Number" value={formData.phone} onChange={handleChange} required />
        
        {/* --- Updated File Input --- */}
        <div>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="photo-upload" style={styles.fileInputLabel}>
            📷 Upload Photos
          </label>
          {photos.length > 0 && (
            <span style={styles.fileInfoText}>
              {photos.length} file(s) selected
            </span>
          )}
        </div>
        {/* --- End of Updated File Input --- */}

        {photoPreviews.length > 0 && (
          <div style={{ display: "flex", gap: 8, margin: "0 0 1rem 0" }}>
            {photoPreviews.map((src, i) => (
              <img key={i} src={src} alt={`Preview ${i + 1}`} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4 }} />
            ))}
          </div>
        )}
        <button type="submit" style={styles.button} disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Turf'}
        </button>
      </form>
    </div>
  );
};

// ... TurfListItem component remains the same ...
const TurfListItem = ({ turf, isAdmin, onDelist }) => (
  <div style={styles.turfCard}>
    <div>
      <h4 style={{ margin: 0 }}>{turf.name}</h4>
      <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280' }}>{turf.location} - ₹{turf.pricePerHour}/hour</p>
    </div>
    {isAdmin && (
      <button style={styles.delistButton} onClick={() => onDelist(turf.$id)}>
        Delist
      </button>
    )}
  </div>
);


// --- Main Container Component ---
const ManageTurfs = () => {
  const { user, isAdmin } = useAuth();
  const [myTurfs, setMyTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormState = { name: "", location: "", price: "", phone: "" };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    databases.listDocuments(APPWRITE_DATABASE_ID, TURFS_COLLECTION_ID, [Query.equal("ownerId", user.$id)])
      .then(response => setMyTurfs(response.documents))
      .catch(error => console.error("Failed to fetch user's turfs:", error))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!photos.length) {
      setPhotoPreviews([]);
      return;
    }
    const objectUrls = photos.map(file => URL.createObjectURL(file));
    setPhotoPreviews(objectUrls);
    return () => objectUrls.forEach(URL.revokeObjectURL);
  }, [photos]);

  const handleAddTurf = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const uploadPromises = photos.map(file => storage.createFile(TURF_IMAGES_BUCKET_ID, AppwriteID.unique(), file));
      const uploadResults = await Promise.all(uploadPromises);
      const photoIds = uploadResults.map(res => res.$id);

      const newTurfData = {
        name: formData.name,
        location: formData.location,
        pricePerHour: Number(formData.price),
        ownerId: user.$id,
        ownerPhone: formData.phone,
        openingHour: 8,
        closingHour: 22,
        photoIds,
      };

      const newDocument = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        TURFS_COLLECTION_ID,
        AppwriteID.unique(),
        newTurfData,
        [Permission.read(Role.any()), Permission.update(Role.user(user.$id)), Permission.delete(Role.user(user.$id))]
      );

      setMyTurfs(prev => [newDocument, ...prev]);
      setFormData(initialFormState);
      setPhotos([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelistTurf = async (turfId) => {
    if (!window.confirm("Are you sure you want to delist this turf?")) return;
    try {
      await databases.deleteDocument(APPWRITE_DATABASE_ID, TURFS_COLLECTION_ID, turfId);
      setMyTurfs(prev => prev.filter(turf => turf.$id !== turfId));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <hr />
      <h2 style={{ marginTop: "2rem" }}>Manage My Turfs</h2>

      <TurfForm
        formData={formData}
        setFormData={setFormData}
        photos={photos} // Pass photos state to display file count
        setPhotos={setPhotos}
        photoPreviews={photoPreviews}
        onSubmit={handleAddTurf}
        isSubmitting={isSubmitting}
        error={error}
      />

      <h3 style={{ marginTop: '2rem' }}>Your Listed Turfs</h3>
      {loading ? (
        <p>Loading your turfs...</p>
      ) : myTurfs.length === 0 ? (
        <p>You have not listed any turfs yet.</p>
      ) : (
        myTurfs.map((turf) => (
          <TurfListItem key={turf.$id} turf={turf} isAdmin={isAdmin} onDelist={handleDelistTurf} />
        ))
      )}
    </div>
  );
};

export default ManageTurfs;