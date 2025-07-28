import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  databases,
  APPWRITE_DATABASE_ID,
  TURFS_COLLECTION_ID,
} from "../services/appwrite";
import TurfCard from "../components/TurfCard";

// --- Style Objects for a Clean and Professional Look ---
const styles = {
  pageContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "1rem", // Light background for the whole page
  },
  // NEW: A container for the hero and search bar
  headerContainer: {
    textAlign: "center",
    padding: "2.5rem 1.5rem",
    borderRadius: "12px",
    marginBottom: "3rem",
  },
  heroSection: {
    marginBottom: "0.5rem", // Space between hero text and search bar
  },
  heroTitle: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    color: "#1e293b",
  },
  heroSubtitle: {
    fontSize: "1.2rem",
    color: "#64748b",
    marginTop: "0.5rem",
    maxWidth: "600px",
    margin: "0.5rem auto 0 auto", // Center the subtitle
  },
  userName: {
    color: "#2a9d8f",
    fontWeight: "bold",
  },
  searchInput: {
    width: "100%",
    maxWidth: "600px", // Constrain search bar width on larger screens
    margin: "0 auto", // Center the search bar
    padding: "0.85rem 1rem",
    fontSize: "1rem",
    borderRadius: "8px",
    border: "1px solid #ced4da",
    boxSizing: "border-box",
  },
  // NEW: A wrapper to center the title
  titleContainer: {
    textAlign: "center",
    marginBottom: "2.5rem",
  },
  sectionTitle: {
    fontSize: "2rem",
    fontWeight: "bold",
    borderBottom: "3px solid #2a9d8f",
    paddingBottom: "0.5rem",
    display: "inline-block",
  },
  emptyState: {
    textAlign: "center",
    padding: "3rem",
    backgroundColor: "#fff",
    borderRadius: "8px",
    color: "#6c757d",
    border: "1px solid #e2e8f0",
  },
  turfContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "2rem", // Adjusted gap for a tighter look
    justifyContent: "center",
  },
  turfCardWrapper: {
    flex: "0 0 320px",
  },
};

const HomePage = () => {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchTurfs = async () => {
      setLoading(true);
      try {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          TURFS_COLLECTION_ID
        );
        setTurfs(response.documents);
      } catch (error) {
        console.error("Failed to fetch turfs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTurfs();
  }, []);

  const filteredTurfs = useMemo(() => {
    return turfs.filter(
      (turf) =>
        turf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turf.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [turfs, searchTerm]);

  if (loading)
    return (
      <p style={{ textAlign: "center", padding: "4rem" }}>Loading turfs...</p>
    );

  return (
    <div style={styles.pageContainer}>
      {/* --- Unified Header Section --- */}
      <div style={styles.headerContainer}>
        <div style={styles.heroSection}>
          <h1 style={styles.heroTitle}>Find & Book Your Perfect Turf</h1>
          <p style={styles.heroSubtitle}>
            {isAuthenticated ? (
              <>
                Welcome back, <span style={styles.userName}>{user.name}</span>!
              </>
            ) : (
              "Browse through the best turfs available in your area."
            )}
          </p>
        </div>
        <div style={styles.searchContainer}>
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Search by turf name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- Turf Listing Section --- */}
      <div>
        <div style={styles.titleContainer}>
          <h2 style={styles.sectionTitle}>Available Turfs</h2>
        </div>

        {filteredTurfs.length > 0 ? (
          <div style={styles.turfContainer}>
            {filteredTurfs.map((turf) => (
              <div key={turf.$id} style={styles.turfCardWrapper}>
                <TurfCard turf={turf} />
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <h4>No Turfs Found</h4>
            <p>
              We couldn't find any turfs matching your search. Try a different
              term.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;