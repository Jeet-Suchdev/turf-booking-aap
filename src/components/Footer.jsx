import React from "react";

const Footer = () => {
  // Array of slogans for a dynamic touch
  const slogans = [
    "Book your game, not your time — instant turf reservations at your fingertips.",
    "Where your game begins — find your turf today.",
    "Play more, search less — your turf is waiting.",
    "Your match, your moment — turf booking made simple.",
    "Turn time into playtime — reserve your turf now.",
  ];

  // Select a random slogan each time the component renders
  const randomSlogan = slogans[Math.floor(Math.random() * slogans.length)];

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        {/* Section 1: Vision/Slogan */}
        <div style={styles.section}>
          <h5 style={styles.heading}>Our Vision</h5>
          <p style={styles.paragraph}>{randomSlogan}</p>
        </div>

        {/* Section 2: Contact Information */}
        <div style={styles.section}>
          <h5 style={styles.heading}>Contact Us</h5>
          <p style={styles.paragraph}>
            <a href="mailto:support@turftown.com" style={styles.link}>
              📧 support@turftown.com
            </a>
          </p>
          <p style={styles.paragraph}>
            <a href="tel:+919876543210" style={styles.link}>
              📞 +91-9876543210
            </a>
          </p>
          <p style={styles.paragraph}>
            <a
              href="https://www.google.com/maps" // Generic maps link for example
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              📍 TurfTown, Bandra, Mumbai
            </a>
          </p>
        </div>

        {/* Section 3: Social Media Links */}
        <div style={styles.section}>
          <h5 style={styles.heading}>Follow Us</h5>
          <div style={styles.socialContainer}>
            <a href="#" style={styles.link}>
              Facebook
            </a>
            <a href="#" style={styles.link}>
              Instagram
            </a>
            <a href="#" style={styles.link}>
              Twitter
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar for copyright notice */}
      <div style={styles.bottomBar}>
        © {new Date().getFullYear()} TurfTown. All rights reserved.
      </div>
    </footer>
  );
};

// --- STYLES OBJECT (LIGHT THEME) ---
const styles = {
  footer: {
    backgroundColor: "#ffffff", // Light background
    color: "#4a5568", // Dark gray text for readability
    padding: "3rem 2rem 2rem",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    borderTop: "1px solid #e2e8f0", // Subtle top border
    marginTop: "4rem",
  },
  container: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "3rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  section: {
    textAlign: "left",
  },
  heading: {
    textTransform: "uppercase",
    marginBottom: "1rem",
    fontWeight: "600",
    fontSize: "1rem",
    color: "#2a9d8f", // Original green accent color
    letterSpacing: "0.05em",
  },
  paragraph: {
    margin: "0.5rem 0",
    lineHeight: "1.6",
    color: "#4a5568",
  },
  link: {
    color: "#4a5568", // Dark gray text for links
    textDecoration: "none",
    fontWeight: "500",
  },
  socialContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0.5rem",
  },
  bottomBar: {
    marginTop: "3rem",
    paddingTop: "2rem",
    fontSize: "0.875rem",
    textAlign: "center",
    color: "#6b7280", // Lighter gray for copyright
    borderTop: "1px solid #e2e8f0",
  },
};

// This is a simple way to add hover effects without a library.
// We create a <style> tag and append it to the document head.
const hoverStyles = `
  a[style*="text-decoration: none"] {
    transition: color 0.2s ease;
  }
  a[style*="text-decoration: none"]:hover {
    color: #2a9d8f !important; /* Original green for hover */
  }
`;

// A check to ensure we don't add duplicate style tags on hot-reloads in development
if (!document.getElementById("footer-hover-styles")) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "footer-hover-styles";
  styleSheet.innerText = hoverStyles;
  document.head.appendChild(styleSheet);
}

export default Footer;
