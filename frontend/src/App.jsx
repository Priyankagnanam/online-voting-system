import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/AdminLayout";
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
import ApprovedVoters from "./pages/admin/ApprovedVoters";

import "./App.css";

const isAdminAreaPath = (pathname) =>
  pathname.startsWith("/admin/") && pathname !== "/admin/login";

const Shell = () => {
  const location = useLocation();
  const isAdminArea = isAdminAreaPath(location.pathname);

  return (
    <div className={`app ${isAdminArea ? "app-admin" : ""}`}>
      {!isAdminArea && <Navbar />}
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
            <AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>
          } />
          <Route path="/admin/elections" element={
            <AdminRoute><AdminLayout><ElectionManagement /></AdminLayout></AdminRoute>
          } />
          <Route path="/admin/candidates" element={
            <AdminRoute><AdminLayout><CandidateManagement /></AdminLayout></AdminRoute>
          } />
          <Route path="/admin/voters" element={
            <AdminRoute><AdminLayout><VoterManagement /></AdminLayout></AdminRoute>
          } />
          <Route path="/admin/results" element={
            <AdminRoute><AdminLayout><Results /></AdminLayout></AdminRoute>
          } />
          <Route path="/admin/security-alerts" element={
            <AdminRoute><AdminLayout><SecurityAlerts /></AdminLayout></AdminRoute>
          } />
          <Route path="/admin/approved-voters" element={
            <AdminRoute><AdminLayout><ApprovedVoters /></AdminLayout></AdminRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Shell />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
