import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import ErrorBoundary from "./components/ErrorBoundary";

import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import Login from "./pages/Login";
import VerifyOTP from "./pages/VerifyOTP";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VoterDashboard from "./pages/VoterDashboard";
import ElectionDetails from "./pages/ElectionDetails";
import VoteConfirmation from "./pages/VoteConfirmation";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ElectionManagement from "./pages/admin/ElectionManagement";
import CandidateManagement from "./pages/admin/CandidateManagement";
import VoterManagement from "./pages/admin/VoterManagement";
import Results from "./pages/admin/Results";
import SecurityAlerts from "./pages/admin/SecurityAlerts";

import "./App.css";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />

                <Route path="/register" element={<Register />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route path="/dashboard" element={
                  <ProtectedRoute><VoterDashboard /></ProtectedRoute>
                } />
                <Route path="/elections/:id" element={
                  <ProtectedRoute><ElectionDetails /></ProtectedRoute>
                } />
                <Route path="/vote-confirmation" element={
                  <ProtectedRoute><VoteConfirmation /></ProtectedRoute>
                } />

                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={
                  <AdminRoute><AdminDashboard /></AdminRoute>
                } />
                <Route path="/admin/elections" element={
                  <AdminRoute><ElectionManagement /></AdminRoute>
                } />
                <Route path="/admin/candidates" element={
                  <AdminRoute><CandidateManagement /></AdminRoute>
                } />
                <Route path="/admin/voters" element={
                  <AdminRoute><VoterManagement /></AdminRoute>
                } />
                <Route path="/admin/results" element={
                  <AdminRoute><Results /></AdminRoute>
                } />
                <Route path="/admin/security-alerts" element={
                  <AdminRoute><SecurityAlerts /></AdminRoute>
                } />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
