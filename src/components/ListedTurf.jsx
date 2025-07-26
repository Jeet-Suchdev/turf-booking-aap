import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  databases,
  APPWRITE_DATABASE_ID,
  TURFS_COLLECTION_ID,
} from "../services/appwrite";
import { Query } from "appwrite";

const ListedTurfs = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [myTurfs, setMyTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchTurfs();
  }, [user]);

  const fetchTurfs = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        TURFS_COLLECTION_ID,
        [Query.equal("ownerId", user.$id)]
      );
      setMyTurfs(response.documents);
    } catch (error) {
      console.error("Failed to fetch turfs:", error);
      setError("Failed to load turfs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelistTurf = async (turfId) => {
    if (!window.confirm("Are you sure you want to delist this turf?")) return;
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        TURFS_COLLECTION_ID,
        turfId
      );
      setMyTurfs((prev) => prev.filter((turf) => turf.$id !== turfId));
    } catch (err) {
      console.error("Error delisting turf:", err);
      setError("Failed to delist turf. Please try again.");
    }
  };

  const handleViewTurf = (turfId) => {
    navigate(`/turf/${turfId}`);
  };

  const handleUpdateTurf = (turfId) => {
    navigate(`/update-turf/${turfId}`);
  };

  return (
    <div style={styles.pageContainer}>
      <h2 style={styles.sectionTitle}>Your Listed Turfs</h2>
      {error && <p style={styles.errorText}>{error}</p>}
      {loading ? (
        <p style={styles.loadingText}>Loading your turfs...</p>
      ) : myTurfs.length === 0 ? (
        <p style={styles.emptyStateText}>You have not listed any turfs yet.</p>
      ) : (
        <div style={styles.turfsContainer}>
          {myTurfs.map((turf) => (
            <div key={turf.$id} style={styles.turfCard}>
              <div style={styles.turfInfo}>
                <h4 style={styles.turfName}>{turf.name}</h4>
                <p style={styles.turfDetail}>
                  {turf.location} - ₹{turf.pricePerHour}/hour
                </p>
                <p style={styles.turfDetail}>Contact: {turf.ownerPhone}</p>
              </div>
              <div style={styles.buttonGroup}>
                <button
                  style={styles.viewButton}
                  onClick={() => handleViewTurf(turf.$id)}
                >
                  View
                </button>
                <button
                  style={styles.updateButton}
                  onClick={() => handleUpdateTurf(turf.$id)}
                >
                  Update
                </button>
                {isAdmin && (
                  <button
                    style={styles.delistButton}
                    onClick={() => handleDelistTurf(turf.$id)}
                  >
                    Delist
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  pageContainer: {
    padding: "1rem",
    maxWidth: "800px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },
  sectionTitle: {
    marginBottom: "2rem",
    textAlign: "center",
  },
  errorText: {
    color: "#ef4444",
    textAlign: "center",
    marginBottom: "1rem",
    fontSize: "0.9rem",
  },
  loadingText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: "0.9rem",
  },
  emptyStateText: {
    textAlign: "center",
    color: "#64748b",
    fontStyle: "italic",
    fontSize: "0.9rem",
  },
  turfsContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "justify",
    gap: "1rem",
  },
  turfCard: {
    background: "white",
    borderRadius: "8px",
    padding: "1rem",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    display: "flex",
    flexDirection: "column",
    maxWidth: "1000px",
    margin: "0 auto",
    gap: "1rem",
    "@media (min-width: 600px)": {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
  },
  turfInfo: {
    flex: 1,
  },
  turfName: {
    margin: 0,
    color: "#2d3748",
    fontWeight: "600",
    fontSize: "1.5rem",
  },
  turfDetail: {
    margin: "0.5rem 0 0",
    color: "#718096",
    fontSize: "1rem",
  },
  buttonGroup: {
    display: "flex",
    gap: "0.8rem",
    flexWrap: "wrap",
    "@media (min-width: 600px)": {
      flexWrap: "nowrap",
    },
  },
  viewButton: {
    background: "#3b82f6",
    color: "white",
    border: "none",
    padding: "0.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "all 0.2s ease",
    fontSize: "0.8rem",
    flex: 1,
    maxWidth: "90px",
    minWidth: "70px",
    "&:hover": {
      background: "#2563eb",
    },
  },
  updateButton: {
    background: "#10b981",
    color: "white",
    border: "none",
    padding: "0.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "all 0.2s ease",
    fontSize: "0.8rem",
    flex: 1,
    maxWidth: "90px",
    minWidth: "70px",
    "&:hover": {
      background: "#059669",
    },
  },
  delistButton: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "0.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "all 0.2s ease",
    fontSize: "0.8rem",
    flex: 1,
    maxWidth: "90px",
    minWidth: "70px",
    "&:hover": {
      background: "#dc2626",
    },
  },
};

export default ListedTurfs;
