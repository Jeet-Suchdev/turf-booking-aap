import { useContext } from "react";
// Make sure this line ends with .jsx
import { AuthContext } from "../context/AuthContext.jsx";

export const useAuth = () => {
  return useContext(AuthContext);
};
