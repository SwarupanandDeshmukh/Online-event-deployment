import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HiOutlineCalendar, HiOutlineLogout, HiOutlineLogin, HiOutlineUserAdd, HiOutlineViewGrid, HiOutlineCog } from "react-icons/hi";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <HiOutlineCalendar className="navbar-brand-icon" />
          <span>EventHub</span>
        </Link>

        <div className="navbar-links">
          {user ? (
            <>
              {user.role === "admin" ? (
                <Link to="/admin" className={`nav-link ${isActive("/admin") ? "active" : ""}`}>
                  <HiOutlineCog />
                  <span>Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
                    <HiOutlineViewGrid />
                    <span>Events</span>
                  </Link>
                  <Link to="/dashboard" className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}>
                    <HiOutlineViewGrid />
                    <span>My Events</span>
                  </Link>
                </>
              )}

              <div className="nav-user-section">
                <span className="nav-user-name">{user.name}</span>
                <span className="nav-user-badge">{user.role === "admin" ? "Admin" : "User"}</span>
                <button onClick={handleLogout} className="nav-link logout-btn">
                  <HiOutlineLogout />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className={`nav-link ${isActive("/login") ? "active" : ""}`}>
                <HiOutlineLogin />
                <span>Login</span>
              </Link>
              <Link to="/signup" className={`nav-link signup-link ${isActive("/signup") ? "active" : ""}`}>
                <HiOutlineUserAdd />
                <span>Sign Up</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
