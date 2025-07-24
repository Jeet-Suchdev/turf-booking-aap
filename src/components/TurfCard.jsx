import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { storage, TURF_IMAGES_BUCKET_ID } from "../services/appwrite";

const TurfCard = ({ turf }) => {
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    if (turf.photoIds && turf.photoIds.length > 0) {
      const url = storage.getFileView(TURF_IMAGES_BUCKET_ID, turf.photoIds[0]);
      setPhotoUrl(url);
    }
  }, [turf]);

  return (
    <div className="card">
      <div className="card-content">
        {photoUrl && (
          <img
            src={photoUrl}
            alt={turf.name}
            style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 8, marginBottom: 12 }}
          />
        )}
        <h3>{turf.name}</h3>
        <p>
          <strong>Location:</strong> {turf.location}
        </p>
        <p>
          <strong>Price:</strong> ₹{turf.pricePerHour}/hour
        </p>
        <Link to={`/turf/${turf.$id}`}>
          <button>View Details</button>
        </Link>
      </div>
    </div>
  );
};

export default TurfCard;
