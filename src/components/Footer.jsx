import React from "react";

const Footer = () => {
  const slogans = [
    "Book your game, not your time — instant turf reservations at your fingertips.",
    "Where your game begins — find your turf today.",
    "Play more, search less — your turf is waiting.",
    "Your match, your moment — turf booking made simple.",
    "Turn time into playtime — reserve your turf now.",
  ];

  const randomSlogan = slogans[Math.floor(Math.random() * slogans.length)];

  const footerStyles = {
    color: "#333",
    padding: "2rem 1rem 0",
    fontFamily: "Segoe UI, sans-serif",
    borderTop: "1px solid #ccc",
  };

  const containerStyles = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2rem",
    maxWidth: "1200px",
    margin: "auto",
  };

  const sectionStyles = {
    textAlign: "left",
  };

  const headingStyles = {
    textTransform: "uppercase",
    marginBottom: "0.5rem",
    fontWeight: "bold",
    fontSize: "16px",
    color:"#2a9d8f"
  };

  const linkStyles = {
    color: "#000",
    textDecoration: "none",
    fontWeight: "bold",
    transition: "color 0.3s ease",
    cursor: "pointer",
  };

  const linkHoverStyles = {
    color: "#007BFF",
  };

  const bottomStyles = {
    marginTop: "2rem",
    padding: "1rem",
    backgroundColor: "rgba(0, 0, 0, 0)",
    fontSize: "14px",
    textAlign: "center",
  };
  

  return (
    <footer style={footerStyles}>
      <div style={containerStyles}>
        <div style={sectionStyles}>
          <h5 style={headingStyles}>Our Vision</h5>
          <p>{randomSlogan}</p>
        </div>

        <div style={sectionStyles}>
          <h5 style={headingStyles}>Contact Us</h5>
          <p style={{ cursor: "pointer" }}>📧 support@turfapp.com</p>
          <p style={{ cursor: "pointer" }}>📞 +91-9876543210</p>
          <p>
  📍{" "}
  <a
    href="https://www.google.com/maps/place/Thadomal+Shahani+Engineering+College/@19.0669552,72.8356613,17z"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      textDecoration: "none",
      color: "#000",
      fontWeight: "bold",
      transition: "color 0.3s ease",
      cursor: "pointer",
    }}
    onMouseOver={(e) => (e.target.style.color = "#2a9d8f")}
    onMouseOut={(e) => (e.target.style.color = "#000")}
  >
    TurfTown, Bandra
  </a>
</p>

        </div>
      </div>

      <div
        style={bottomStyles}
        onMouseOver={(e) => {''
          e.target.style.cursor = "pointer";
        }}
        onMouseOut={(e) => {
          e.target.style.color = "#000";
        }}
      >
        &copy; {new Date().getFullYear()} TurfApp. All rights reserved. |{" "}
        <a
          href="https://turfapp.com"
          style={linkStyles}
          onMouseOver={(e) => (e.target.style.color = "#007BFF")}
          onMouseOut={(e) => (e.target.style.color = "#000")}
        >
          www.turftown.com
        </a>
      </div>
    </footer>
  );
};

export default Footer;