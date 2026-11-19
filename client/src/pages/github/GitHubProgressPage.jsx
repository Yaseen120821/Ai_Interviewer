// src/pages/github/GitHubProgressPage.jsx
// MockMate AI GitHub Profile Integration & Developer Analytics
// Connects to public GitHub profile, tracks repository statistics, language distribution, and commit activity.

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import GithubIcon from '../../components/icons/GithubIcon';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import firestoreService from '../../services/firestoreService';
import {
  Star,
  GitFork,
  BookOpen,
  Users,
  Code2,
  Calendar,
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  GitCommit,
  GitPullRequest,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function GitHubProgressPage() {
  const user = useAuthStore((s) => s.user);

  const [inputUsername, setInputUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [langFilter, setLangFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Load saved GitHub username from user profile
  useEffect(() => {
    const loadSavedConnection = async () => {
      const uid = user?.id || user?.uid;
      if (!uid) return;

      try {
        const profile = await firestoreService.getUserProfile(uid);
        const savedUsername = profile?.githubUsername || profile?.github;
        if (savedUsername) {
          const clean = savedUsername.replace(/^https?:\/\/(?:www\.)?github\.com\//i, '').replace(/\/+$/, '');
          setInputUsername(clean);
          fetchGitHubData(clean, false);
        }
      } catch (err) {
        console.warn('[GitHubProgressPage] Failed to load saved profile:', err);
      }
    };

    loadSavedConnection();
  }, [user?.id, user?.uid]);

  // 2. Fetch GitHub data via backend proxy endpoint
  const fetchGitHubData = async (usernameToFetch, saveToProfile = true) => {
    const clean = (usernameToFetch || inputUsername)
      .replace(/^https?:\/\/(?:www\.)?github\.com\//i, '')
      .replace(/\/+$/, '')
      .trim();

    if (!clean) {
      setError('Please enter a GitHub username or profile link.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.get(`/github/user/${clean}`);
      const resData = res.data?.data || res.data;
      setData(resData);
      setSuccessMsg(`Successfully synchronized GitHub profile for @${resData.profile.login}`);

      // Persist to user Firestore profile
      if (saveToProfile) {
        const uid = user?.id || user?.uid;
        if (uid) {
          await firestoreService.updateUserProfile(uid, {
            githubUsername: resData.profile.login,
            github: resData.profile.htmlUrl,
          });
        }
      }
    } catch (err) {
      console.error('[GitHubProgressPage] Fetch error:', err);
      setError(
        err?.response?.data?.message ||
        'Could not synchronize GitHub profile. Please check the username or try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSubmit = (e) => {
    if (e) e.preventDefault();
    fetchGitHubData(inputUsername, true);
  };

  // Filter repositories
  const filteredRepos = useMemo(() => {
    if (!data?.repositories) return [];
    return data.repositories.filter((repo) => {
      const matchesSearch =
        (repo.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (repo.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLang = langFilter === 'All' || repo.language === langFilter;
      return matchesSearch && matchesLang;
    });
  }, [data?.repositories, searchQuery, langFilter]);

  const uniqueLanguages = useMemo(() => {
    if (!data?.repositories) return ['All'];
    const set = new Set();
    data.repositories.forEach((r) => {
      if (r.language && r.language !== 'Plain Text') set.add(r.language);
    });
    return ['All', ...Array.from(set)];
  }, [data?.repositories]);

  return (
    <div style={styles.layout}>
      <Sidebar />

      <main style={styles.main}>
        {/* Top Header Card */}
        <section style={styles.headerCard}>
          <div style={styles.headerLeft}>
            <div style={styles.iconCircle}>
              <GithubIcon size={28} color="#0A0A0A" />
            </div>
            <div>
              <div style={styles.badgeRow}>
                <span style={styles.headerPill}>Developer Analytics</span>
                <span style={styles.syncBadge}>Official GitHub REST API</span>
              </div>
              <h1 style={styles.title}>GitHub Progress &amp; Activity</h1>
              <p style={styles.subtitle}>
                Track your open-source projects, programming languages, and public commit momentum.
              </p>
            </div>
          </div>

          {/* Quick Connect / Sync Form */}
          <form onSubmit={handleSyncSubmit} style={styles.connectForm}>
            <div style={styles.inputWrap}>
              <GithubIcon size={16} color="#6B675F" style={styles.inputIcon} />
              <input
                type="text"
                placeholder="github username or profile url..."
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                style={styles.usernameInput}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={styles.syncBtn}
            >
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              <span>{loading ? 'Syncing...' : 'Sync Profile'}</span>
            </button>
          </form>
        </section>

        {/* Notifications */}
        {error && (
          <div style={styles.errorBanner}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div style={styles.successBanner}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {data ? (
          <>
            {/* Profile Overview Card */}
            <section style={styles.profileCard}>
              <div style={styles.profileLeft}>
                <img
                  src={data.profile.avatarUrl}
                  alt={data.profile.name}
                  style={styles.avatarImg}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={styles.profileName}>{data.profile.name}</h2>
                    <span style={styles.profileLogin}>@{data.profile.login}</span>
                  </div>
                  {data.profile.bio && <p style={styles.profileBio}>{data.profile.bio}</p>}
                  <div style={styles.metaRow}>
                    {data.profile.company && (
                      <span style={styles.metaItem}>💼 {data.profile.company}</span>
                    )}
                    {data.profile.location && (
                      <span style={styles.metaItem}>📍 {data.profile.location}</span>
                    )}
                    <span style={styles.metaItem}>
                      <Users size={13} /> {data.profile.followers} followers • {data.profile.following} following
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.profileRight}>
                <span style={styles.lastSyncText}>
                  Synced: {new Date(data.syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <a
                  href={data.profile.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.openGithubBtn}
                >
                  <span>Open GitHub</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </section>

            {/* Analytics KPI Row */}
            <section style={styles.kpiGrid}>
              <div style={styles.kpiCard}>
                <span style={styles.kpiLabel}>Public Repos</span>
                <div style={styles.kpiVal}>{data.analytics.totalRepos}</div>
                <span style={styles.kpiSub}>Active Repositories</span>
              </div>
              <div style={styles.kpiCard}>
                <span style={styles.kpiLabel}>Total Stars</span>
                <div style={styles.kpiVal}>
                  <Star size={18} color="#D97706" style={{ fill: '#D97706', marginRight: '6px' }} />
                  {data.analytics.totalStars}
                </div>
                <span style={styles.kpiSub}>Community Stargazers</span>
              </div>
              <div style={styles.kpiCard}>
                <span style={styles.kpiLabel}>Total Forks</span>
                <div style={styles.kpiVal}>
                  <GitFork size={18} color="#2563EB" style={{ marginRight: '6px' }} />
                  {data.analytics.totalForks}
                </div>
                <span style={styles.kpiSub}>Repository Clones</span>
              </div>
              <div style={styles.kpiCard}>
                <span style={styles.kpiLabel}>Recent Commits</span>
                <div style={styles.kpiVal}>
                  <GitCommit size={18} color="#1E7E34" style={{ marginRight: '6px' }} />
                  {data.analytics.recentPublicCommits}
                </div>
                <span style={styles.kpiSub}>Public Event Activity</span>
              </div>
              <div style={styles.kpiCard}>
                <span style={styles.kpiLabel}>Primary Language</span>
                <div style={styles.kpiVal}>{data.analytics.primaryLanguage}</div>
                <span style={styles.kpiSub}>Most Used Stack</span>
              </div>
            </section>

            {/* Language Breakdown Bar */}
            {data.analytics.languages?.length > 0 && (
              <section style={styles.langCard}>
                <h3 style={styles.sectionTitle}>Language Distribution</h3>
                <p style={styles.sectionSub}>Breakdown of technologies across all public repositories.</p>

                {/* Progress bar */}
                <div style={styles.langProgressBar}>
                  {data.analytics.languages.map((l, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${l.percentage}%`,
                        background: getLanguageColor(l.name),
                        height: '100%',
                      }}
                      title={`${l.name}: ${l.percentage}% (${l.count} repos)`}
                    />
                  ))}
                </div>

                {/* Language Chips */}
                <div style={styles.langChipsRow}>
                  {data.analytics.languages.slice(0, 8).map((l, idx) => (
                    <div key={idx} style={styles.langChip}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getLanguageColor(l.name) }} />
                      <span style={{ fontWeight: '600' }}>{l.name}</span>
                      <span style={{ color: '#6B675F' }}>{l.percentage}%</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Repositories Explorer */}
            <section style={styles.reposSection}>
              <div style={styles.reposHeader}>
                <div>
                  <h3 style={styles.sectionTitle}>Repositories Explorer ({filteredRepos.length})</h3>
                  <p style={styles.sectionSub}>Inspect projects and public source code repositories.</p>
                </div>

                <div style={styles.searchFilterRow}>
                  {/* Search input */}
                  <div style={styles.searchBox}>
                    <Search size={14} color="#6B675F" />
                    <input
                      type="text"
                      placeholder="Search repositories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={styles.searchInput}
                    />
                  </div>

                  {/* Language filter pills */}
                  <div style={styles.filterPills}>
                    {uniqueLanguages.slice(0, 6).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setLangFilter(lang)}
                        style={{
                          ...styles.langPill,
                          ...(langFilter === lang ? styles.langPillActive : {}),
                        }}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Repositories Grid */}
              <div style={styles.reposGrid}>
                {filteredRepos.map((repo) => (
                  <div key={repo.id} style={styles.repoCard}>
                    <div style={styles.repoCardTop}>
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.repoNameLink}
                      >
                        <BookOpen size={16} color="#FF5A1F" />
                        <span>{repo.name}</span>
                        <ExternalLink size={12} color="#6B675F" />
                      </a>
                      <span style={styles.visibilityBadge}>Public</span>
                    </div>

                    <p style={styles.repoDesc}>
                      {repo.description || 'No description provided for this repository.'}
                    </p>

                    <div style={styles.repoFoot}>
                      <div style={styles.repoFootLeft}>
                        <span style={styles.langIndicator}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getLanguageColor(repo.language) }} />
                          <span>{repo.language}</span>
                        </span>
                        {repo.stars > 0 && (
                          <span style={styles.statCount}>
                            <Star size={13} /> {repo.stars}
                          </span>
                        )}
                        {repo.forks > 0 && (
                          <span style={styles.statCount}>
                            <GitFork size={13} /> {repo.forks}
                          </span>
                        )}
                      </div>

                      <span style={styles.updatedDate}>
                        Updated {new Date(repo.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          /* Empty Initial State */
          <section style={styles.emptyCard}>
            <GithubIcon size={48} color="#0A0A0A" />
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '16px 0 6px' }}>
              Connect Your GitHub Account
            </h2>
            <p style={{ color: '#6B675F', fontSize: '14px', maxWidth: '440px', lineHeight: '1.5', margin: '0 0 20px' }}>
              Track your open-source projects, repository stars, language depth, and public commit cadence directly within MockMate AI.
            </p>
            <div style={styles.emptyConnectWrap}>
              <input
                type="text"
                placeholder="Enter GitHub username (e.g. torvalds, gaearon)..."
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                style={styles.emptyInput}
              />
              <button
                type="button"
                onClick={() => fetchGitHubData(inputUsername, true)}
                disabled={loading}
                style={styles.emptyBtn}
              >
                {loading ? 'Connecting...' : 'Connect GitHub'}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// Language color mapper
function getLanguageColor(lang) {
  const map = {
    JavaScript: '#F7DF1E',
    TypeScript: '#3178C6',
    Python: '#3572A5',
    Java: '#B07219',
    HTML: '#E34C26',
    CSS: '#563D7C',
    C: '#555555',
    'C++': '#F34B7D',
    'C#': '#178600',
    Go: '#00ADD8',
    Rust: '#DEA584',
    PHP: '#4F5D95',
    Ruby: '#701516',
    Shell: '#89E051',
    Dart: '#00B4AB',
    Kotlin: '#A97BFF',
    Swift: '#F05138',
  };
  return map[lang] || '#0A0A0A';
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: '#F2EEE6',
    color: '#0A0A0A',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
  },
  main: {
    flex: 1,
    minWidth: 0,
    padding: 'clamp(20px, 3vw, 36px)',
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  headerCard: {
    background: '#FFFFFF',
    border: '1px solid #E3DED2',
    borderRadius: '20px',
    padding: '24px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
  },
  iconCircle: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    background: '#FBFAF7',
    border: '1px solid #E3DED2',
    display: 'grid',
    placeItems: 'center',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  headerPill: {
    background: '#FFF9E6',
    border: '1px solid #F4CF63',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#856404',
    textTransform: 'uppercase',
  },
  syncBadge: {
    background: '#EBF7EE',
    color: '#1E7E34',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 2px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6B675F',
    margin: 0,
  },
  connectForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
  },
  usernameInput: {
    height: '42px',
    paddingLeft: '36px',
    paddingRight: '14px',
    borderRadius: '10px',
    border: '1px solid #E3DED2',
    background: '#FBFAF7',
    fontSize: '13.5px',
    fontFamily: 'inherit',
    color: '#0A0A0A',
    outline: 'none',
    width: '240px',
  },
  syncBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    height: '42px',
    padding: '0 18px',
    borderRadius: '999px',
    background: '#0A0A0A',
    color: '#F2EEE6',
    border: 'none',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  errorBanner: {
    padding: '12px 16px',
    borderRadius: '10px',
    background: '#FBEBED',
    color: '#EC4F5F',
    fontSize: '13.5px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  successBanner: {
    padding: '12px 16px',
    borderRadius: '10px',
    background: '#EBF7EE',
    color: '#1E7E34',
    fontSize: '13.5px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  profileCard: {
    background: '#FFFFFF',
    border: '1px solid #E3DED2',
    borderRadius: '20px',
    padding: '24px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  profileLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
  },
  avatarImg: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    border: '2px solid #E3DED2',
  },
  profileName: {
    fontSize: '20px',
    fontWeight: '700',
    margin: 0,
  },
  profileLogin: {
    fontSize: '14px',
    color: '#6B675F',
  },
  profileBio: {
    fontSize: '13.5px',
    color: '#6B675F',
    margin: '4px 0 6px',
    maxWidth: '550px',
  },
  metaRow: {
    display: 'flex',
    gap: '14px',
    fontSize: '12.5px',
    color: '#6B675F',
    flexWrap: 'wrap',
  },
  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  profileRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '10px',
  },
  lastSyncText: {
    fontSize: '12px',
    color: '#6B675F',
  },
  openGithubBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '999px',
    background: '#FBFAF7',
    border: '1px solid #E3DED2',
    color: '#0A0A0A',
    fontSize: '13px',
    fontWeight: '600',
    textDecoration: 'none',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
  },
  kpiCard: {
    background: '#FFFFFF',
    border: '1px solid #E3DED2',
    borderRadius: '16px',
    padding: '18px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  },
  kpiLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6B675F',
    textTransform: 'uppercase',
  },
  kpiVal: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '6px 0 2px',
    display: 'flex',
    alignItems: 'center',
  },
  kpiSub: {
    fontSize: '11.5px',
    color: '#6B675F',
  },
  langCard: {
    background: '#FFFFFF',
    border: '1px solid #E3DED2',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  sectionTitle: {
    fontSize: '17px',
    fontWeight: '700',
    margin: 0,
  },
  sectionSub: {
    fontSize: '13px',
    color: '#6B675F',
    margin: '4px 0 16px',
  },
  langProgressBar: {
    height: '10px',
    borderRadius: '999px',
    overflow: 'hidden',
    display: 'flex',
    background: '#E3DED2',
    marginBottom: '14px',
  },
  langChipsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  langChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12.5px',
  },
  reposSection: {
    background: '#FFFFFF',
    border: '1px solid #E3DED2',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  reposHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '20px',
  },
  searchFilterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    height: '38px',
    padding: '0 12px',
    borderRadius: '10px',
    border: '1px solid #E3DED2',
    background: '#FBFAF7',
  },
  searchInput: {
    border: 'none',
    background: 'none',
    outline: 'none',
    fontSize: '13px',
    fontFamily: 'inherit',
    width: '180px',
  },
  filterPills: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  langPill: {
    background: '#FBFAF7',
    border: '1px solid #E3DED2',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#6B675F',
    cursor: 'pointer',
  },
  langPillActive: {
    background: '#0A0A0A',
    color: '#F2EEE6',
    fontWeight: '600',
  },
  reposGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px',
  },
  repoCard: {
    background: '#FBFAF7',
    border: '1px solid #E3DED2',
    borderRadius: '14px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '10px',
    transition: 'border-color 0.15s ease',
  },
  repoCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repoNameLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#0A0A0A',
    textDecoration: 'none',
  },
  visibilityBadge: {
    fontSize: '10.5px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '999px',
    border: '1px solid #E3DED2',
    color: '#6B675F',
  },
  repoDesc: {
    fontSize: '12.5px',
    color: '#6B675F',
    margin: 0,
    lineHeight: '1.4',
    flex: 1,
  },
  repoFoot: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11.5px',
    color: '#6B675F',
    borderTop: '1px solid #E3DED2',
    paddingTop: '10px',
  },
  repoFootLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  langIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: '500',
  },
  statCount: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
  },
  updatedDate: {
    fontSize: '11px',
  },
  emptyCard: {
    background: '#FFFFFF',
    border: '1px solid #E3DED2',
    borderRadius: '20px',
    padding: '48px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  emptyConnectWrap: {
    display: 'flex',
    gap: '10px',
    maxWidth: '440px',
    width: '100%',
    flexWrap: 'wrap',
  },
  emptyInput: {
    flex: 1,
    height: '46px',
    padding: '0 14px',
    borderRadius: '10px',
    border: '1px solid #E3DED2',
    background: '#FBFAF7',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
  },
  emptyBtn: {
    height: '46px',
    padding: '0 22px',
    borderRadius: '999px',
    background: '#0A0A0A',
    color: '#F2EEE6',
    border: 'none',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};
