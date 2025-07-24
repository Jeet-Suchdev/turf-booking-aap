import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  databases,
  APPWRITE_DATABASE_ID,
  TURFS_COLLECTION_ID,
} from "../services/appwrite";
import TurfCard from "../components/TurfCard";

const HomePage = () => {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchTurfs = async () => {
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

  if (loading) return <p>Loading turfs...</p>;

  return (
    <div>
      <div>
        {isAuthenticated ? <h3>Welcome, <span style={{ color: '#2a9d8f' }}>{user.name}</span></h3> : <div></div>}
      </div>
      <h1 style={{ marginTop: '2rem' }}>Available Turfs</h1>
      <div className="turf-grid">
        {turfs.map((turf) => (
          <TurfCard key={turf.$id} turf={turf} />
        ))}
      </div>
    </div>
  );
};

export default HomePage;