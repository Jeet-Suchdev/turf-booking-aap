import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  databases,
  APPWRITE_DATABASE_ID,
  TURFS_COLLECTION_ID,
} from "../services/appwrite";
import { Query } from "appwrite";

const ListedTurfs = () => {
  const { user, isAdmin } = useAuth();
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

  return (
    <div style={styles.pageContainer}>
      <h2 style={styles.sectionTitle}>Your Listed Turfs</h2>
      {error && <p style={styles.errorText}>{error}</p>}
      {loading ? (
        <p style={styles.loadingText}>Loading your turfs...</p>
      ) : myTurfs.length === 0 ? (
        <p style={styles.emptyStateText}>You have not listed any turfs yet.</p>
      ) : (
        <div>
          {myTurfs.map((turf) => (
            <div key={turf.$id} style={styles.turfCard}>
              <div>
                <h4 style={{ margin: 0, color: "#2d3748", fontWeight: "600" }}>
                  {turf.name}
                </h4>
                <p
                  style={{
                    margin: "0.5rem 0 0",
                    color: "#718096",
                    fontSize: "0.95rem",
                  }}
                >
                  {turf.location} - ₹{turf.pricePerHour}/hour
                </p>
                <p
                  style={{
                    margin: "0.5rem 0 0",
                    color: "#718096",
                    fontSize: "0.95rem",
                  }}
                >
                  Contact: {turf.ownerPhone}
                </p>
              </div>
              {isAdmin && (
                <button
                  style={styles.delistButton}
                  onClick={() => handleDelistTurf(turf.$id)}
                >
                  Delist
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  pageContainer: {
    padding: "2rem",
    maxWidth: "800px",
    margin: "0 auto",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    marginBottom: "1.5rem",
    color: "#2d3748",
    textAlign: "center",
  },
  errorText: {
    color: "#ef4444",
    textAlign: "center",
    marginBottom: "1rem",
  },
  loadingText: {
    textAlign: "center",
    color: "#64748b",
  },
  emptyStateText: {
    textAlign: "center",
    color: "#64748b",
    fontStyle: "italic",
  },
  turfCard: {
    background: "white",
    borderRadius: "8px",
    padding: "1.5rem",
    marginBottom: "1rem",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "all 0.2s ease",
    "&:hover": {
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
  },
  delistButton: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "all 0.2s ease",
    "&:hover": {
      background: "#dc2626",
    },
  },
};

export default ListedTurfs;
