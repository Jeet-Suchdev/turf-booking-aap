import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { storage, TURF_IMAGES_BUCKET_ID } from "../services/appwrite";
import {
  CButton,
  CCard,
  CCardBody,
  CCardImage,
  CCardText,
  CCardTitle,
} from "@coreui/react";

const TurfCard = ({ turf }) => {
  // State will now hold the URL object or null
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    if (turf.photoIds && turf.photoIds.length > 0) {
      const url = storage.getFileView(TURF_IMAGES_BUCKET_ID, turf.photoIds[0]);
      setPhotoUrl(url);
    }
  }, [turf]);

  return (
    // We use className="h-100" to make cards in a grid have the same height.
    // The width will be determined by its container, making it responsive.
    <CCard className="h-100 shadow-sm border-0">
      <CCardImage
        orientation="top"
        src={photoUrl}
        style={{ height: "180px", objectFit: "cover" }}
      />
      <CCardBody className="d-flex flex-column">
        <CCardTitle
          className="mb-2"
          style={{ fontWeight: "600", color: "#1e293b" }}
        >
          {turf.name}
        </CCardTitle>
        <CCardText as="div" className="flex-grow-1">
          <p className="mb-2 text-muted" style={{ fontSize: "0.9rem" }}>
            📍 {turf.location}
          </p>
          <p
            className="mb-3"
            style={{ fontSize: "1rem", fontWeight: "500", color: "#334155" }}
          >
            ₹{turf.pricePerHour}/hour
          </p>
        </CCardText>
        {/*
          The CButton is rendered 'as' a React Router Link to preserve SPA navigation.
        */}
        <CButton
          as={Link}
          to={`/turf/${turf.$id}`}
          color="primary"
          style={{ backgroundColor: "#2a9d8f", border: "none" }}
        >
          View Details
        </CButton>
      </CCardBody>
    </CCard>
  );
};

export default TurfCard;
