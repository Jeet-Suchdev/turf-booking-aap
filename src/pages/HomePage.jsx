import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { databases, APPWRITE_DATABASE_ID, TURFS_COLLECTION_ID } from "../services/appwrite";
import TurfCard from "../components/TurfCard";

// --- Style Objects for a Clean and Professional Look ---
const styles = {
  pageContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
  },
  heroSection: {
    textAlign: 'center',
    padding: '3rem 1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '2rem',
  },
  heroTitle: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#333',
  },
  heroSubtitle: {
    fontSize: '1.2rem',
    color: '#6c757d',
    marginTop: '0.5rem',
  },
  userName: {
    color: '#2a9d8f',
    fontWeight: 'bold',
  },
  searchContainer: {
    marginBottom: '2rem',
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    borderRadius: '6px',
    border: '1px solid #ced4da',
  },
  sectionTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    borderBottom: '3px solid #2a9d8f',
    paddingBottom: '0.5rem',
    display: 'inline-block',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#fff',
    borderRadius: '8px',
    color: '#6c757d',
  }
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

  // Filter turfs based on search term using useMemo for performance
  const filteredTurfs = useMemo(() => {
    return turfs.filter(turf =>
      turf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      turf.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [turfs, searchTerm]);


  if (loading) return <p>Loading turfs...</p>;

  return (
    <div style={styles.pageContainer}>
      {/* --- Hero Section --- */}
      <div style={styles.heroSection}>
        <h1 style={styles.heroTitle}>Find & Book Your Perfect Turf</h1>
        <p style={styles.heroSubtitle}>
          {isAuthenticated ? 
            <>Welcome back, <span style={styles.userName}>{user.name}</span>!</> :
            "Browse through the best turfs available in your area."
          }
        </p>
      </div>

      {/* --- Search and Filter Section --- */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          style={styles.searchInput}
          placeholder="Search by turf name or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* --- Turf Listing Section --- */}
      <div>
        <h2 style={styles.sectionTitle}>Available Turfs</h2>
        {filteredTurfs.length > 0 ? (
          <div className="turf-grid">
            {filteredTurfs.map((turf) => (
              <TurfCard key={turf.$id} turf={turf} />
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <h4>No Turfs Found</h4>
            <p>We couldn't find any turfs matching your search. Try a different term.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;