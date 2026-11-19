// src/pages/DashboardPage.jsx
// MockMate AI Premium Enterprise SaaS Dashboard
// Redesigned with Linear/Stripe aesthetic, structured 3-part layout, 8 KPI cards,
// interactive SVG performance trend, skill diagnostics, data table, format distribution, activity feed, and recommendations.

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import firestoreService from '../services/firestoreService';
import { resumeService } from '../services/resumeService';

// Modular Dashboard Components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardKpiGrid from '../components/dashboard/DashboardKpiGrid';
import InterviewScoreTrend from '../components/dashboard/InterviewScoreTrend';
import SkillDiagnostics from '../components/dashboard/SkillDiagnostics';
import RecentInterviewsTable from '../components/dashboard/RecentInterviewsTable';
import InterviewDistribution from '../components/dashboard/InterviewDistribution';
import RecentActivityFeed from '../components/dashboard/RecentActivityFeed';
import RecommendedActions from '../components/dashboard/RecommendedActions';
import DashboardEmptyState from '../components/dashboard/DashboardEmptyState';
import DashboardLoadingState from '../components/dashboard/DashboardLoadingState';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [activeResume, setActiveResume] = useState(null);
  const [trendRange, setTrendRange] = useState('all'); // '7d' | '30d' | '90d' | 'all'

  // 1. Fetch data from backend and Firestore
  const loadDashboardData = async () => {
    try {
      const [interviewsRes, resumeRes] = await Promise.allSettled([
        api.get('/interviews'),
        resumeService.getActive(),
      ]);

      let backendList = [];
      if (interviewsRes.status === 'fulfilled') {
        backendList = interviewsRes.value.data?.data || interviewsRes.value.data || [];
        if (!Array.isArray(backendList)) backendList = [];
      }

      if (resumeRes.status === 'fulfilled' && resumeRes.value?.data?.data) {
        setActiveResume(resumeRes.value.data.data);
      }

      // Merge with Firestore records
      const uid = user?.id || user?.uid;
      let firestoreList = [];
      if (uid) {
        try {
          firestoreList = await firestoreService.getUserInterviews(uid);
        } catch { /* ignore */ }
      }

      // Deduplicate sessions by ID
      const mergedMap = new Map();
      [...firestoreList, ...backendList].forEach((item) => {
        if (!item || !item.id) return;
        const existing = mergedMap.get(item.id);
        if (!existing) {
          mergedMap.set(item.id, item);
        } else {
          mergedMap.set(item.id, {
            ...existing,
            ...item,
            overallScore: item.overallScore ?? existing.overallScore,
            interviewStatus: item.interviewStatus || item.status || existing.interviewStatus,
            report: item.report || existing.report,
          });
        }
      });

      const mergedList = Array.from(mergedMap.values()).sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setInterviews(mergedList);
    } catch (err) {
      console.warn('[DashboardPage] Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Realtime Firestore subscription
    const uid = user?.id || user?.uid;
    let unsubInterviews = () => {};
    let unsubProfile = () => {};

    if (uid) {
      unsubInterviews = firestoreService.subscribeToUserInterviews(uid, (fbList) => {
        if (fbList && Array.isArray(fbList)) {
          setInterviews((prev) => {
            const map = new Map();
            [...fbList, ...prev].forEach((item) => {
              if (item && item.id) {
                const ex = map.get(item.id);
                map.set(item.id, ex ? { ...ex, ...item } : item);
              }
            });
            return Array.from(map.values()).sort((a, b) => {
              const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
              const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
              return timeB - timeA;
            });
          });
        }
      });

      unsubProfile = firestoreService.subscribeToUserProfile(uid, (profile) => {
        if (profile) {
          updateUser({
            name: profile.name || profile.displayName || user?.name,
            credits: profile.credits !== undefined ? profile.credits : user?.credits,
            profileImage: profile.photoURL || user?.profileImage,
          });
        }
      });
    }

    return () => {
      unsubInterviews();
      unsubProfile();
    };
  }, [user?.id, user?.uid]);

  // 2. Computed Real Metrics from Authenticated User Records
  const analytics = useMemo(() => {
    const total = interviews.length;
    const completedList = interviews.filter(
      (i) => i.interviewStatus === 'completed' || i.status === 'completed'
    );
    const inProgressList = interviews.filter(
      (i) => i.interviewStatus === 'in-progress' || i.status === 'in-progress'
    );

    // Strictly filter genuine evaluated scores (numerical, not NaN)
    const evaluatedScores = completedList
      .map((i) => i.overallScore ?? i.report?.overallScore)
      .filter((s) => typeof s === 'number' && !isNaN(s));

    const avgScore = evaluatedScores.length
      ? Number((evaluatedScores.reduce((a, b) => a + b, 0) / evaluatedScores.length).toFixed(1))
      : 0;

    const highestScore = evaluatedScores.length ? Math.max(...evaluatedScores) : 0;

    // Total practice time calculated from questions answered * question timeLimit
    const totalMinutes = completedList.reduce((acc, curr) => {
      const qCount = curr.totalQuestions || curr.questionCount || 5;
      const limitSec = curr.timeLimitPerQuestion || curr.timeLimit || 90;
      return acc + Math.round((qCount * limitSec) / 60);
    }, 0);

    const completionRate = total > 0 ? Math.round((completedList.length / total) * 100) : 0;

    // Improvement calculation: compare earliest evaluated score with latest evaluated score
    let scoreImprovement = null;
    if (evaluatedScores.length >= 2) {
      const chronological = [...completedList]
        .reverse()
        .map((i) => i.overallScore ?? i.report?.overallScore)
        .filter((s) => typeof s === 'number' && !isNaN(s));
      if (chronological.length >= 2) {
        const first = chronological[0];
        const latest = chronological[chronological.length - 1];
        const diff = Number((latest - first).toFixed(1));
        scoreImprovement = diff >= 0 ? `+${diff}` : `${diff}`;
      }
    }

    // Interview Types breakdown
    const typeCounts = {
      resume: interviews.filter((i) => i.resumeId || i.mode === 'resume').length,
      jd: interviews.filter((i) => i.jobDescription || i.mode === 'jd').length,
      role: interviews.filter((i) => !i.resumeId && !i.jobDescription).length,
    };

    // Skill rubrics extracted from completed reports
    const skillAverages = {
      technical: 0,
      communication: 0,
      confidence: 0,
      problemSolving: 0,
      understanding: 0,
    };

    let skillCount = 0;
    completedList.forEach((item) => {
      const rep = item.report;
      if (rep && rep.evaluated !== false) {
        if (rep.correctnessScore || rep.technicalAccuracy) {
          skillAverages.technical += Number(rep.correctnessScore || rep.technicalAccuracy || 0);
        }
        if (rep.communicationScore || rep.communicationClarity) {
          skillAverages.communication += Number(rep.communicationScore || rep.communicationClarity || 0);
        }
        if (rep.confidenceScore) {
          skillAverages.confidence += Number(rep.confidenceScore || 0);
        }
        if (rep.depthScore || rep.completeness) {
          skillAverages.problemSolving += Number(rep.depthScore || rep.completeness || 0);
        }
        if (rep.understandingScore) {
          skillAverages.understanding += Number(rep.understandingScore || 0);
        }
        skillCount++;
      }
    });

    if (skillCount > 0) {
      Object.keys(skillAverages).forEach((k) => {
        skillAverages[k] = Number((skillAverages[k] / skillCount).toFixed(1));
      });
    }

    return {
      total,
      completed: completedList.length,
      inProgress: inProgressList.length,
      avgScore,
      highestScore,
      totalMinutes,
      completionRate,
      scoreImprovement,
      typeCounts,
      skillAverages,
      hasEvaluationData: evaluatedScores.length > 0,
      inProgressSession: inProgressList[0] || null,
    };
  }, [interviews]);

  // Filter trend scores by date range
  const trendData = useMemo(() => {
    const completed = interviews
      .filter((i) => i.interviewStatus === 'completed' || i.status === 'completed')
      .map((i) => {
        const rawDate = i.createdAt?.toDate ? i.createdAt.toDate() : new Date(i.createdAt || Date.now());
        const score = i.overallScore ?? i.report?.overallScore;
        return {
          id: i.id,
          date: rawDate,
          score: typeof score === 'number' && !isNaN(score) ? score : null,
          role: i.jobRole || i.roleTarget || 'Candidate',
        };
      })
      .filter((i) => i.score !== null)
      .reverse();

    if (trendRange === 'all') return completed;

    const now = Date.now();
    const daysLimit = trendRange === '7d' ? 7 : trendRange === '30d' ? 30 : 90;
    const cutoff = now - daysLimit * 24 * 60 * 60 * 1000;
    return completed.filter((i) => i.date.getTime() >= cutoff);
  }, [interviews, trendRange]);

  // Dynamic recommendations based on actual evaluation scores
  const recommendations = useMemo(() => {
    const list = [];
    if (analytics.completed === 0) {
      list.push({
        title: 'Complete Your First Mock Interview',
        desc: 'Choose a target role or paste a job description to calibrate your baseline interview readiness.',
        action: 'Start Interview Now',
        href: '/interview/setup',
        tag: 'High Priority',
        tagColor: '#FF5A1F',
      });
      list.push({
        title: 'Upload Your Resume for ATS Analysis',
        desc: 'MockMate extracts projects and skills from your resume for personalized questions.',
        action: 'Upload Resume',
        href: '/resume',
        tag: 'Recommended',
        tagColor: '#0F172A',
      });
      list.push({
        title: 'Practice Algorithmic Challenges',
        desc: 'Solve curated technical problems in the Coding Arena with live test cases.',
        action: 'Open Coding Arena',
        href: '/coding',
        tag: 'Technical Skills',
        tagColor: '#2563EB',
      });
    } else {
      if (analytics.skillAverages.technical > 0 && analytics.skillAverages.technical < 7.0) {
        list.push({
          title: 'Strengthen Technical Depth & Edge Cases',
          desc: 'Your technical accuracy average is below 7.0. Practice explaining time/space trade-offs in depth.',
          action: 'Practice Technical Sprint',
          href: '/interview/setup',
          tag: 'Focus Area',
          tagColor: '#EF4444',
        });
      }
      if (analytics.skillAverages.communication > 0 && analytics.skillAverages.communication < 7.5) {
        list.push({
          title: 'Structure Answers with the STAR Method',
          desc: 'Structure your project experiences using Situation, Task, Action, and Measurable Result.',
          action: 'Practice Behavioral Round',
          href: '/interview/setup',
          tag: 'Communication',
          tagColor: '#F59E0B',
        });
      }
      list.push({
        title: 'Review Recent Evaluation Reports',
        desc: 'Inspect detailed question feedback, ideal answers, and AI critiques from your completed sessions.',
        action: 'Open Reports Vault',
        href: '/history',
        tag: 'Insights',
        tagColor: '#10B981',
      });
      list.push({
        title: 'Practice Coding Questions in Arena',
        desc: 'Sharpen algorithmic problem solving across Arrays, Strings, and Trees with live test cases.',
        action: 'Open Coding Arena',
        href: '/coding',
        tag: 'Coding Skills',
        tagColor: '#2563EB',
      });
    }
    return list;
  }, [analytics]);

  if (loading) {
    return <DashboardLoadingState />;
  }

  return (
    <div style={styles.layout}>
      {/* ── A. SIDEBAR NAVIGATION ── */}
      <Sidebar />

      {/* ── B. MAIN DASHBOARD CONTENT ── */}
      <main style={styles.main}>
        {/* 1. Executive Dashboard Header */}
        <DashboardHeader
          user={user}
          analytics={analytics}
          onNavigateSession={(id) => navigate(`/interview/${id}`)}
        />

        {/* 2. Onboarding Banner for Fresh Accounts */}
        {analytics.total === 0 && (
          <DashboardEmptyState
            onStartInterview={() => navigate('/interview/setup')}
          />
        )}

        {/* 3. 8 KPI Metrics Grid */}
        <DashboardKpiGrid analytics={analytics} />

        {/* 4. Analytics & Performance Section (Two-Column Layout) */}
        <section style={styles.analyticsSection}>
          <div style={styles.trendCol}>
            <InterviewScoreTrend
              trendData={trendData}
              trendRange={trendRange}
              onRangeChange={setTrendRange}
            />
          </div>
          <div style={styles.skillsCol}>
            <SkillDiagnostics
              skillAverages={analytics.skillAverages}
              hasEvaluationData={analytics.hasEvaluationData}
            />
          </div>
        </section>

        {/* 5. Recent Interviews & Distribution Row */}
        <section style={styles.dualSection}>
          <div style={styles.tableCol}>
            <RecentInterviewsTable interviews={interviews} />
          </div>
          <div style={styles.distCol}>
            <InterviewDistribution
              typeCounts={analytics.typeCounts}
              total={analytics.total}
            />
          </div>
        </section>

        {/* 6. Activity Feed & Recommendations Row */}
        <section style={styles.dualSection}>
          <div style={styles.halfCol}>
            <RecentActivityFeed
              interviews={interviews}
              activeResume={activeResume}
              user={user}
            />
          </div>
          <div style={styles.halfCol}>
            <RecommendedActions recommendations={recommendations} />
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: '#F8FAFC',
    color: '#0F172A',
    fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
  },
  main: {
    flex: 1,
    minWidth: 0,
    padding: 'clamp(20px, 2.5vw, 32px)',
    maxWidth: '1520px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  analyticsSection: {
    display: 'flex',
    gap: '20px',
    width: '100%',
    flexWrap: 'wrap',
  },
  trendCol: {
    flex: '1.6 1 480px',
    minWidth: '320px',
  },
  skillsCol: {
    flex: '1 1 320px',
    minWidth: '280px',
  },
  dualSection: {
    display: 'flex',
    gap: '20px',
    width: '100%',
    flexWrap: 'wrap',
  },
  tableCol: {
    flex: '1.7 1 520px',
    minWidth: '320px',
  },
  distCol: {
    flex: '1 1 300px',
    minWidth: '260px',
  },
  halfCol: {
    flex: '1 1 380px',
    minWidth: '300px',
  },
};
