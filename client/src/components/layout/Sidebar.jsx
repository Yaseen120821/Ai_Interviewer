// src/components/layout/Sidebar.jsx
// Signature InterviewPilot sidebar navigation with full feature links and user profile.

import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import firebaseAuthService from '../../services/firebaseAuthService';
import Logo from '../Logo';
import {
  LayoutDashboard,
  FileText,
  ScanText,
  Mic,
  Code2,
  History,
  CreditCard,
  LogOut,
  Coins,
} from 'lucide-react';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard, exact: true },
  { to: '/interview/setup', label: 'Mock Interview', Icon: Mic, exact: false },
  { to: '/interview/coding', label: 'Coding Arena', Icon: Code2, exact: false },
  { to: '/resume/ats', label: 'ATS Analyzer', Icon: ScanText, exact: false },
  { to: '/resume', label: 'Resume Vault', Icon: FileText, exact: false },
  { to: '/interview/history', label: 'History', Icon: History, exact: false },
  { to: '/pricing', label: 'Credits & Plans', Icon: CreditCard, exact: false },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const user = useAuthStore((s) => s.user);

  const handleLogout = async () => {
    try {
      await firebaseAuthService.logout();
    } catch {
      /* ignore */
    }
    clearAuth();
    navigate('/login', { replace: true });
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Candidate';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside style={styles.aside}>
      {/* Brand Logo */}
      <div style={{ padding: '0 8px 24px' }}>
        <Logo to="/dashboard" />
      </div>

      {/* Credit Balance Badge */}
      <div style={styles.creditsCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Coins size={16} color="#FF5A1F" />
          <span style={styles.creditsLabel}>Available Credits</span>
        </div>
        <span style={styles.creditsValue}>{user?.credits ?? 100}</span>
      </div>

      {/* Navigation Links */}
      <nav style={styles.nav}>
        {NAV_LINKS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.linkActive : {}),
            })}
          >
            {({ isActive }) => {
              const IconComp = item.Icon;
              return (
                <>
                  <span style={{ ...styles.linkIcon, ...(isActive ? styles.linkIconActive : {}) }}>
                    <IconComp size={18} />
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isActive && <span style={styles.activeDot} />}
                </>
              );
            }}
          </NavLink>
        ))}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* User Profile & Logout */}
      <div style={styles.footer}>
        <div style={styles.userCard}>
          <div style={styles.avatar}>{initial}</div>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{displayName}</span>
            <span style={styles.userEmail}>{user?.email || 'Logged in'}</span>
          </div>
        </div>

        <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

const styles = {
  aside: {
    width: '260px',
    height: '100vh',
    position: 'sticky',
    top: 0,
    background: '#FFFFFF',
    borderRight: '1px solid #E3DED2',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    zIndex: 40,
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
  },
  creditsCard: {
    background: '#FBFAF7',
    border: '1px solid #E3DED2',
    borderRadius: '12px',
    padding: '10px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  creditsLabel: {
    fontSize: '12px',
    color: '#6B675F',
    fontWeight: '500',
  },
  creditsValue: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0A0A0A',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '12px',
    textDecoration: 'none',
    color: '#6B675F',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.15s ease',
  },
  linkActive: {
    background: '#0A0A0A',
    color: '#F2EEE6',
    fontWeight: '600',
  },
  linkIcon: {
    display: 'grid',
    placeItems: 'center',
    color: 'inherit',
  },
  linkIconActive: {
    color: '#F4CF63',
  },
  activeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#F4CF63',
  },
  footer: {
    borderTop: '1px solid #E3DED2',
    paddingTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '6px 4px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#F4CF63',
    color: '#0A0A0A',
    display: 'grid',
    placeItems: 'center',
    fontWeight: '700',
    fontSize: '14px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0A0A0A',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userEmail: {
    fontSize: '11px',
    color: '#6B675F',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid #E3DED2',
    background: '#FBFAF7',
    color: '#B3323F',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    width: '100%',
    justifyContent: 'center',
  },
};

export default Sidebar;
