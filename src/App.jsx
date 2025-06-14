import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Toasts from "./components/Toast";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import Portfolio from "./pages/Portfolio";
import CoinDetail from "./pages/CoinDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/password" element={<ChangePassword />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/coin/:id" element={<CoinDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toasts />
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
