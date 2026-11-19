// src/components/layout/Sidebar.jsx
// Signature MockMate AI collapsible responsive sidebar navigation.
// Features: Smooth width animation, tooltip mode when collapsed, mobile drawer, persisted user preference.

import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import firebaseAuthService from '../../services/firebaseAuthService';
import Logo from '../Logo';
import GithubIcon from '../icons/GithubIcon';
import {
  LayoutDashboard,
  Mic,
  Code2,
  History,
  FileSpreadsheet,
  FileText,
  User,
  Settings,
  CreditCard,
  LogOut,
  Coins,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard, exact: true },
  { to: '/interview/setup', label: 'Interview Practice', Icon: Mic, exact: false },
  { to: '/interview/history', label: 'Interview History', Icon: History, exact: false },
  { to: '/history', label: 'Reports', Icon: FileSpreadsheet, exact: false },
  { to: '/coding', label: 'Coding Practice', Icon: Code2, exact: false },
  { to: '/github', label: 'GitHub Progress', Icon: GithubIcon, exact: false },
  { to: '/profile', label: 'My Profile', Icon: User, exact: false },
  { to: '/resume', label: 'Resume Vault', Icon: FileText, exact: false },
  { to: '/pricing', label: 'Credits & Plans', Icon: CreditCard, exact: false },
  { to: '/settings', label: 'Settings', Icon: Settings, exact: false },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const user = useAuthStore((s) => s.user);

  // Read initial collapsed state from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('mockmate_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mockmate_sidebar_collapsed', String(next));
      } catch { /* ignore */ }
      return next;
    });
  };

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

  const asideWidth = isCollapsed ? '76px' : '260px';

  return (
    <>
      {/* Mobile Drawer Hamburger Button */}
      <div style={styles.mobileBar}>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          style={styles.mobileHamburgerBtn}
          aria-label="Open navigation menu"
        >
          <Menu size={20} color="#0A0A0A" />
        </button>
        <Logo to="/dashboard" />
        <div style={{ width: '36px' }} />
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={styles.backdrop}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        style={{
          ...styles.aside,
          width: asideWidth,
          transform: mobileOpen ? 'translateX(0)' : undefined,
        }}
        className={`mockmate-sidebar ${mobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Top Header: Brand Logo + Collapse Toggle */}
        <div style={{
          ...styles.topHeader,
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: isCollapsed ? '0 0 20px' : '0 4px 20px',
        }}>
          {!isCollapsed ? (
            <Logo to="/dashboard" />
          ) : (
            <NavLink to="/dashboard" title="MockMate AI Dashboard" style={{ textDecoration: 'none' }}>
              <div style={styles.collapsedIconLogo}>
                <svg viewBox="0 0 44 44" style={{ width: '36px', height: '36px' }}>
                  <rect x="3" y="3" width="38" height="38" rx="10" fill="#FF5A1F" stroke="#0A0A0A" strokeWidth="3" />
                  <rect x="8" y="12" width="28" height="22" rx="8" fill="#0A0A0A" />
                  <path d="M14 24 Q17 19 20 24 M24 24 Q27 19 30 24" fill="none" stroke="#F2EEE6" strokeWidth="2.6" strokeLinecap="round" />
                  <circle cx="12.5" cy="29" r="1.8" fill="#F4CF63" />
                  <circle cx="31.5" cy="29" r="1.8" fill="#F4CF63" />
                </svg>
              </div>
            </NavLink>
          )}

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleCollapse}
            style={styles.collapseToggleBtn}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Credit Balance Badge */}
        {!isCollapsed ? (
          <div style={styles.creditsCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coins size={16} color="#FF5A1F" />
              <span style={styles.creditsLabel}>Credits</span>
            </div>
            <span style={styles.creditsValue}>{user?.credits ?? 100}</span>
          </div>
        ) : (
          <div style={styles.creditsCardCollapsed} title={`Available Credits: ${user?.credits ?? 100}`}>
            <Coins size={18} color="#FF5A1F" />
            <span style={styles.creditsValueCollapsed}>{user?.credits ?? 100}</span>
          </div>
        )}

        {/* Navigation Links */}
        <nav style={styles.nav}>
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              title={isCollapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                ...styles.link,
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '10px 0' : '10px 14px',
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
                    {!isCollapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                    {isActive && (
                      <span
                        style={isCollapsed ? styles.activeDotCollapsed : styles.activeDot}
                      />
                    )}
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
          {!isCollapsed ? (
            <>
              <NavLink to="/profile" style={styles.userCardLink} title="View My Profile">
                <div style={styles.userCard}>
                  <div style={styles.avatar}>{initial}</div>
                  <div style={styles.userInfo}>
                    <span style={styles.userName}>{displayName}</span>
                    <span style={styles.userEmail}>{user?.email || 'Logged in'}</span>
                  </div>
                </div>
              </NavLink>

              <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <NavLink to="/profile" title={`Profile: ${displayName}`}>
                <div style={styles.avatar}>{initial}</div>
              </NavLink>
              <button onClick={handleLogout} style={styles.logoutBtnCollapsed} title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

const styles = {
  aside: {
    height: '100vh',
    position: 'sticky',
    top: 0,
    background: '#FFFFFF',
    borderRight: '1px solid #E2E8F0',
    padding: '20px 14px',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    zIndex: 40,
    fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
    transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1), padding 0.2s ease',
  },
  topHeader: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },
  collapsedIconLogo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapseToggleBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    background: '#F8FAFC',
    color: '#0F172A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  creditsCard: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '9px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    transition: 'border-color 0.15s ease',
  },
  creditsCardCollapsed: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '6px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    gap: '3px',
  },
  creditsLabel: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: '500',
  },
  creditsValue: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  creditsValueCollapsed: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#0F172A',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    overflowY: 'auto',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#64748B',
    fontSize: '13.5px',
    fontWeight: '500',
    transition: 'all 0.15s ease',
    position: 'relative',
  },
  linkActive: {
    background: '#0F172A',
    color: '#FFFFFF',
    fontWeight: '600',
  },
  linkIcon: {
    display: 'grid',
    placeItems: 'center',
    color: 'inherit',
    flexShrink: 0,
  },
  linkIconActive: {
    color: '#FF5A1F',
  },
  activeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#FF5A1F',
  },
  activeDotCollapsed: {
    position: 'absolute',
    right: '6px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: '#FF5A1F',
  },
  footer: {
    borderTop: '1px solid #E2E8F0',
    paddingTop: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  userCardLink: {
    textDecoration: 'none',
    color: 'inherit',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 8px',
    borderRadius: '8px',
    transition: 'background 0.15s ease',
    cursor: 'pointer',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: '#0F172A',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '14px',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
  },
  userName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0F172A',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userEmail: {
    fontSize: '11.5px',
    color: '#64748B',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    color: '#64748B',
    fontSize: '12.5px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  logoutBtnCollapsed: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    color: '#64748B',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
  },
  mobileBar: {
    display: 'none',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    position: 'sticky',
    top: 0,
    zIndex: 35,
  },
  mobileHamburgerBtn: {
    background: 'none',
    border: 'none',
    padding: '6px',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(2px)',
    zIndex: 39,
  },
};
