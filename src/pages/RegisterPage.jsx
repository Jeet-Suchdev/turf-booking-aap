import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { account, AppwriteID } from "../services/appwrite";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // Add phone state
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("player"); // Default role is 'player'
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { checkSession } = useAuth(); // We'll use checkSession to refresh data

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // 1. Create the user account in Appwrite
      await account.create(AppwriteID.unique(), email, password, name);

      // 2. Log the user in to create a session
      await account.createEmailPasswordSession(email, password);

      // 3. Update the user's preferences with the selected role and phone
      const prefs = { role };
      if (phone) prefs.phone = phone;
      await account.updatePrefs(prefs);

      // 4. Refresh the AuthContext with the new user data
      await checkSession();

      // 5. Redirect to the appropriate dashboard
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="form-container">
      <h2>Create an Account</h2>
      <form onSubmit={handleRegister}>
        {error && <p className="error">{error}</p>}
        <div>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password (min. 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* --- Role Selection Added Here --- */}
        <div style={{ marginBottom: "1rem" }}>
          <p>I am a:</p>
          <label style={{ marginRight: "1.5rem" }}>
            <input
              type="radio"
              value="player"
              checked={role === "player"}
              onChange={(e) => setRole(e.target.value)}
            />{" "}
            Player
          </label>
          <label>
            <input
              type="radio"
              value="admin"
              checked={role === "admin"}
              onChange={(e) => setRole(e.target.value)}
            />{" "}
            Turf Owner (Admin)
          </label>
        </div>
        {/* --- End of Role Selection --- */}

        <button type="submit">Sign Up</button>
      </form>
      <p style={{ textAlign: "center", marginTop: "1rem" }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
