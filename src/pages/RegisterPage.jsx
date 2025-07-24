import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { account, AppwriteID } from "../services/appwrite";

// --- Style Objects with the new color scheme ---
const styles = {
  formContainer: {
    maxWidth: '450px',
    margin: '2rem auto',
    padding: '2rem',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  inputGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '1rem',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#2a9d8f', // Changed color
    color: 'white',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  linkText: {
    textAlign: 'center',
    marginTop: '1rem',
    color: '#4b5563',
  },
  error: {
    color: '#ef4444',
    marginBottom: '1rem',
    textAlign: 'center',
  },
};

// --- A dedicated component for selecting the user role ---
const RoleSelector = ({ selectedRole, onRoleChange }) => {
  const roleOptionStyle = {
    flex: 1,
    padding: '1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '6px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
  };

  const selectedStyle = {
    ...roleOptionStyle,
    borderColor: '#2a9d8f', // Changed color
    backgroundColor: '#e9f5f4', // Changed to complementary light color
    fontWeight: 'bold',
  };

  return (
    <div style={styles.inputGroup}>
      <label style={styles.label}>Select Your Role</label>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div
          style={selectedRole === 'player' ? selectedStyle : roleOptionStyle}
          onClick={() => onRoleChange('player')}
        >
          👤 Player
        </div>
        <div
          style={selectedRole === 'admin' ? selectedStyle : roleOptionStyle}
          onClick={() => onRoleChange('admin')}
        >
          🏟️ Turf Owner
        </div>
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "player",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { checkSession } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { name, email, password, phone, role } = formData;
    try {
      await account.create(AppwriteID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password);
      await account.updatePrefs({ role, phone });
      await checkSession();
      navigate(role === "admin" ? "/admin/dashboard" : "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.formContainer}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Create an Account</h2>
      <form onSubmit={handleRegister}>
        {error && <p style={styles.error}>{error}</p>}
        
        <div style={styles.inputGroup}>
          <label htmlFor="name" style={styles.label}>Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            style={styles.input}
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="email" style={styles.label}>Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            style={styles.input}
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="phone" style={styles.label}>Phone Number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            style={styles.input}
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="password" style={styles.label}>Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Minimum 8 characters"
            style={styles.input}
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        
        <RoleSelector
          selectedRole={formData.role}
          onRoleChange={(role) => setFormData(prev => ({ ...prev, role }))}
        />

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
      <p style={styles.linkText}>
        Already have an account? <Link to="/login" style={{ color: '#2a9d8f' }}>Login</Link>
      </p>
    </div>
  );
};

export default RegisterPage;