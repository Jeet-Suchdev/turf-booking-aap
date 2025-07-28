import React from "react";
import { Carousel } from "react-bootstrap";

const ImageCarousel = ({ imageUrls = [] }) => {
  // If there are no images, display a placeholder.
  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div style={styles.placeholderContainer}>
        <span style={styles.placeholderText}>No Images Available</span>
      </div>
    );
  }

  return (
    <Carousel fade interval={4000} style={styles.carouselContainer}>
      {imageUrls.map((url, index) => (
        <Carousel.Item key={index}>
          <img
            className="d-block w-100"
            // FIX: Pass the entire URL object directly to src, as requested.
            // React and modern browsers will correctly interpret its href property.
            src={url}
            alt={`Turf image ${index + 1}`}
            style={styles.image}
          />
        </Carousel.Item>
      ))}
    </Carousel>
  );
};

const styles = {
  carouselContainer: {
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "2rem",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
  },
  image: {
    height: "450px",
    objectFit: "cover",
  },
  placeholderContainer: {
    height: "450px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: "12px",
    marginBottom: "2rem",
  },
  placeholderText: {
    color: "#6c757d",
    fontWeight: "500",
    fontSize: "1.2rem",
  },
};

export default ImageCarousel;