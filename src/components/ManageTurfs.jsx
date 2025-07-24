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

const ManageTurfs = () => {
  const { user, isAdmin } = useAuth();
  const [myTurfs, setMyTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  // New state for the phone number input
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  const fetchMyTurfs = async () => {
    if (!user) return;
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        TURFS_COLLECTION_ID,
        [Query.equal("ownerId", user.$id)]
      );
      setMyTurfs(response.documents);
    } catch (error) {
      console.error("Failed to fetch user's turfs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTurfs();
  }, [user]);

  // useEffect for photo previews remains the same
  useEffect(() => {
    if (photos.length === 0) {
      setPhotoPreviews([]);
      return;
    }
    const readers = [];
    let isCancelled = false;
    Promise.all(
      photos.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            readers.push(reader);
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          })
      )
    ).then((results) => {
      if (!isCancelled) setPhotoPreviews(results);
    });
    return () => {
      isCancelled = true;
      readers.forEach((r) => r.abort && r.abort());
    };
  }, [photos]);

  const handleAddTurf = async (e) => {
    e.preventDefault();
    setError("");
    let photoIds = [];
    try {
      if (photos.length > 0) {
        const uploadPromises = photos.map((file) =>
          storage.createFile(TURF_IMAGES_BUCKET_ID, AppwriteID.unique(), file)
        );
        const uploadResults = await Promise.all(uploadPromises);
        photoIds = uploadResults.map((res) => res.$id);
      }
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        TURFS_COLLECTION_ID,
        AppwriteID.unique(),
        {
          name,
          location,
          pricePerHour: Number(price),
          ownerId: user.$id,
          openingHour: 8,
          closingHour: 22,
          photoIds,
          // **Use the phone number from the input field**
          ownerPhone: phone,
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      );
      setName("");
      setLocation("");
      setPrice("");
      // **Reset the phone input field**
      setPhone("");
      setPhotos([]);
      setPhotoPreviews([]);
      fetchMyTurfs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelistTurf = async (turfId) => {
    if (!window.confirm("Are you sure you want to delist this turf?")) return;
    setError("");
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        TURFS_COLLECTION_ID,
        turfId
      );
      fetchMyTurfs();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <hr />
      <h2 style={{ marginTop: "2rem" }}>Manage My Turfs</h2>

      <div
        className="form-container"
        style={{ maxWidth: "100%", margin: "1rem 0" }}
      >
        <h3>List a New Turf</h3>
        <form onSubmit={handleAddTurf}>
          {error && <p className="error">{error}</p>}
          <input
            type="text"
            placeholder="Turf Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Price Per Hour"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          {/* **New phone number input field** */}
          <input
            type="tel"
            placeholder="Contact Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setPhotos(Array.from(e.target.files))}
          />
          {photoPreviews.length > 0 && (
            <div style={{ display: "flex", gap: 8, margin: "8px 0" }}>
              {photoPreviews.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Preview ${i + 1}`}
                  style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4 }}
                />
              ))}
            </div>
          )}
          <button type="submit">Add Turf</button>
        </form>
      </div>

      <h3>Your Listed Turfs</h3>
      {loading ? (
        <p>Loading your turfs...</p>
      ) : myTurfs.length === 0 ? (
        <p>You have not listed any turfs yet.</p>
      ) : (
        myTurfs.map((turf) => (
          <div
            key={turf.$id}
            className="card-content"
            style={{ background: "white", marginBottom: "1rem" }}
          >
            <h4>{turf.name}</h4>
            <p>
              <strong>Location:</strong> {turf.location}
            </p>
            <p>
              <strong>Price:</strong> ₹{turf.pricePerHour}/hour
            </p>
            {isAdmin && (
              <button
                style={{ background: '#ff4d4f', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', marginTop: 8 }}
                onClick={() => handleDelistTurf(turf.$id)}
              >
                Delist Turf
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ManageTurfs;