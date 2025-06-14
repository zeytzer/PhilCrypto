import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";

function AuthRedirect({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    fetchUser();
  }, []);

  if (user === undefined) {
    return null; // loading
  }

  return user ? <Navigate to="/" /> : children;
}

export default AuthRedirect;
