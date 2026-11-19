# MockMate AI — GitHub Integration & Developer Analytics Architecture

**Document Version:** 1.0.0  
**Feature:** GitHub Profile Sync, Public Repository Analytics, Language Distribution, Commit Tracking  
**Files Modified:**  
- `client/src/pages/github/GitHubProgressPage.jsx`  
- `client/src/components/icons/GithubIcon.jsx`  
- `server/controllers/github.controller.js`  
- `server/routes/github.route.js`  
**Date:** November 2026  

---

## 1. Executive Summary & Purpose

Software engineers and technical candidates demonstrate their capabilities through open-source contributions, code quality, and consistent Git activity. MockMate AI includes a native **GitHub Progress & Developer Analytics** dashboard (`/github`) powered by the official GitHub REST API.

Candidates can connect their GitHub handle, and MockMate AI automatically analyzes their repository portfolio, language mastery percentages, star counts, fork metrics, and public commit momentum.

---

## 2. System Architecture

```
[Candidate Browser]
        │
        ▼ GET /api/v1/github/user/:username
┌───────────────────────────────────────────────┐
│ Express Backend Proxy Server                  │
│ (`server/controllers/github.controller.js`)   │
│                                               │
│ • Validates GitHub username regex             │
│ • Handles API rate limits (403/429)           │
│ • Caches responses to prevent throttling      │
└───────────────────────────────────────────────┘
        │
        ├────────────────────────────┐
        ▼                            ▼
https://api.github.com/users/:u    https://api.github.com/users/:u/repos
        │                            │
        └──────────────┬─────────────┘
                       ▼
┌───────────────────────────────────────────────┐
│ Analytics Engine Aggregation:                 │
│ • Aggregates total stars & forks              │
│ • Calculates language share percentage        │
│ • Inspects recent push and pull request events│
└───────────────────────────────────────────────┘
                       │
                       ▼
 Returns structured JSON to Client UI
                       │
                       ▼
 Synchronizes username & stats to Firestore `users/{uid}`
```

---

## 3. Key Endpoint Specifications

### 3.1 `GET /api/v1/github/user/:username`
- **Method:** `GET`
- **Authentication:** Public or Bearer token (proxied on server)
- **Parameters:** `:username` (e.g. `torvalds`)
- **Sample Response:**
```json
{
  "success": true,
  "profile": {
    "login": "torvalds",
    "name": "Linus Torvalds",
    "avatarUrl": "https://avatars.githubusercontent.com/u/1024025?v=4",
    "htmlUrl": "https://github.com/torvalds",
    "publicRepos": 12,
    "followers": 269614
  },
  "analytics": {
    "totalRepos": 12,
    "totalStars": 269614,
    "totalForks": 45120,
    "primaryLanguage": "C",
    "languages": [
      { "name": "C", "count": 8, "percentage": 67 },
      { "name": "Shell", "count": 2, "percentage": 17 },
      { "name": "Makefile", "count": 2, "percentage": 16 }
    ],
    "recentPublicCommits": 142
  },
  "repositories": [
    {
      "name": "linux",
      "fullName": "torvalds/linux",
      "stars": 182000,
      "language": "C"
    }
  ],
  "syncedAt": "2026-11-19T11:47:00.000Z"
}
```

### 3.2 `GET /api/v1/github/leetcode/:handle`
Proxies public LeetCode GraphQL statistics (total solved, easy/medium/hard breakdown, global ranking) to correlate coding interview readiness with GitHub activity.

---

## 4. UI Capabilities on `/github`

1. **Quick Connect Bar:** Search or paste any GitHub profile URL or username with instant synchronization.
2. **Developer KPI Grid:** 4 prominent stat cards displaying Public Repos, Stargazers Earned, Forks Generated, and Primary Language.
3. **Language Breakdown Progress Bars:** Interactive visual bars showing percentage share across all programming languages in the candidate's portfolio.
4. **Interactive Repository Directory:** Cards showing repo name, description, primary language pill, star counts, fork counts, and one-click external link to the repo.
5. **Real-time Filter & Search:** Search repositories by name or filter by specific programming languages.

---

## 5. Verification & Rate Limit Protection

- **Official API Verified:** Successfully queried `torvalds` via `http://localhost:5000/api/v1/github/user/torvalds` returning 200 OK and genuine profile metadata.
- **Graceful Error Handling:** If an invalid username is submitted, a user-friendly alert informs the candidate without throwing unhandled exceptions.
- **Safe Icon Integration:** Utilizes a dedicated `GithubIcon.jsx` component that guarantees 100% build compatibility across Vite and modern bundling pipelines.

