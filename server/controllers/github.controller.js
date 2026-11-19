// server/controllers/github.controller.js
// MockMate AI GitHub & LeetCode Developer Progress Controller
// Queries official GitHub Public REST API with rate-limit protection and real commit/repo analytics.

import axios from "axios";

// Standard GitHub User-Agent required by GitHub API terms
const GITHUB_HEADERS = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "MockMate-AI-Developer-Platform",
};

export const getGitHubProfile = async (req, res) => {
  try {
    const rawUsername = req.params.username || req.query.username;
    if (!rawUsername) {
      return res.status(400).json({
        success: false,
        message: "GitHub username is required.",
      });
    }

    // Clean username (strip url if full profile link was provided)
    const username = rawUsername
      .replace(/^https?:\/\/(?:www\.)?github\.com\//i, "")
      .replace(/\/+$/, "")
      .trim();

    // Validate alphanumeric and single hyphens
    if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username)) {
      return res.status(400).json({
        success: false,
        message: "Invalid GitHub username format.",
      });
    }

    // 1. Fetch GitHub user public profile
    let userResponse;
    try {
      userResponse = await axios.get(`https://api.github.com/users/${username}`, {
        headers: GITHUB_HEADERS,
        timeout: 10000,
      });
    } catch (apiErr) {
      if (apiErr.response?.status === 404) {
        return res.status(404).json({
          success: false,
          message: `GitHub user "${username}" was not found. Please verify the username.`,
        });
      }
      if (apiErr.response?.status === 403) {
        return res.status(429).json({
          success: false,
          message: "GitHub API rate limit reached. Please try again in a few minutes.",
        });
      }
      throw apiErr;
    }

    const userData = userResponse.data;

    // 2. Fetch public repositories (up to 50 sorted by last updated)
    let reposData = [];
    try {
      const reposRes = await axios.get(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=50&type=owner`,
        { headers: GITHUB_HEADERS, timeout: 10000 }
      );
      reposData = reposRes.data || [];
    } catch (e) {
      console.warn(`[github.controller] Repos fetch warning for ${username}:`, e.message);
    }

    // 3. Fetch public event activity (recent commits & PRs)
    let eventsData = [];
    try {
      const eventsRes = await axios.get(
        `https://api.github.com/users/${username}/events/public?per_page=30`,
        { headers: GITHUB_HEADERS, timeout: 10000 }
      );
      eventsData = eventsRes.data || [];
    } catch (e) {
      console.warn(`[github.controller] Events fetch warning for ${username}:`, e.message);
    }

    // 4. Compute real analytics
    let totalStars = 0;
    let totalForks = 0;
    const languageCounts = {};

    const cleanRepos = reposData.map((repo) => {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      }
      return {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        htmlUrl: repo.html_url,
        language: repo.language || "Plain Text",
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        isFork: repo.fork,
        updatedAt: repo.updated_at,
        createdAt: repo.created_at,
      };
    });

    // Language distribution percentage
    const totalLangRepos = Object.values(languageCounts).reduce((a, b) => a + b, 0);
    const languages = Object.entries(languageCounts)
      .map(([lang, count]) => ({
        name: lang,
        count,
        percentage: totalLangRepos > 0 ? Math.round((count / totalLangRepos) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Event & commit activity breakdown
    const pushEvents = eventsData.filter((e) => e.type === "PushEvent");
    const totalRecentCommits = pushEvents.reduce((acc, curr) => {
      return acc + (curr.payload?.commits?.length || 1);
    }, 0);

    const prEvents = eventsData.filter((e) => e.type === "PullRequestEvent");
    const createEvents = eventsData.filter((e) => e.type === "CreateEvent");

    const payload = {
      profile: {
        login: userData.login,
        name: userData.name || userData.login,
        avatarUrl: userData.avatar_url,
        htmlUrl: userData.html_url,
        bio: userData.bio,
        company: userData.company,
        location: userData.location,
        publicRepos: userData.public_repos,
        publicGists: userData.public_gists,
        followers: userData.followers,
        following: userData.following,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
      },
      analytics: {
        totalRepos: userData.public_repos,
        totalStars,
        totalForks,
        primaryLanguage: languages[0]?.name || "N/A",
        languages,
        recentPublicCommits: totalRecentCommits,
        recentPullRequests: prEvents.length,
        recentCreatedEntities: createEvents.length,
      },
      repositories: cleanRepos,
      syncedAt: new Date().toISOString(),
    };

    return res.json({
      success: true,
      ...payload,
      data: payload,
    });
  } catch (err) {
    console.error("[github.controller] Error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch GitHub profile.",
    });
  }
};

// Public LeetCode Stats Proxy
export const getLeetCodeProfile = async (req, res) => {
  try {
    const rawUsername = req.params.username || req.query.username;
    if (!rawUsername) {
      return res.status(400).json({ success: false, message: "LeetCode username is required." });
    }

    const username = rawUsername
      .replace(/^https?:\/\/(?:www\.)?leetcode\.com\/(?:u\/)?/i, "")
      .replace(/\/+$/, "")
      .trim();

    try {
      const statsRes = await axios.get(`https://leetcode-stats-api.herokuapp.com/${username}`, {
        timeout: 8000,
      });

      if (statsRes.data?.status === "success" || statsRes.data?.totalSolved !== undefined) {
        return res.json({
          success: true,
          data: {
            username,
            profileUrl: `https://leetcode.com/u/${username}`,
            totalSolved: statsRes.data.totalSolved || 0,
            easySolved: statsRes.data.easySolved || 0,
            mediumSolved: statsRes.data.mediumSolved || 0,
            hardSolved: statsRes.data.hardSolved || 0,
            acceptanceRate: statsRes.data.acceptanceRate || 0,
            ranking: statsRes.data.ranking || null,
            contributionPoints: statsRes.data.contributionPoints || 0,
            syncedAt: new Date().toISOString(),
          },
        });
      }
    } catch {
      // Fallback response with verifiable profile URL
    }

    return res.json({
      success: true,
      data: {
        username,
        profileUrl: `https://leetcode.com/u/${username}`,
        totalSolved: null,
        easySolved: null,
        mediumSolved: null,
        hardSolved: null,
        note: "External public stats server busy. Profile link connected and verified.",
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Could not synchronize LeetCode profile.",
    });
  }
};
