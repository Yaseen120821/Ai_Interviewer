// Ai_Interviewer - User Controller
import prisma from "../config/prisma.js";

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          credits: true,
          profileImage: true,
          instantUserId: true,
          createdAt: true,
        },
      });
    } catch (_) {}

    if (!user) {
      user = {
        id: userId,
        name: req.user?.name || "Candidate",
        email: req.user?.email || "candidate@mockmate.ai",
        credits: 100,
      };
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: `Failed to get current user: ${error.message}` });
  }
};

export const getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.userId;

    let user = null;
    let completedSessions = [];
    let recentSessions = [];
    let activeResume = null;

    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, credits: true },
      });

      completedSessions = await prisma.interviewSession.findMany({
        where: { userId, status: "completed" },
        include: { report: true },
      });

      recentSessions = await prisma.interviewSession.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { report: true },
      });

      activeResume = await prisma.resume.findFirst({
        where: { userId, isActive: true },
        select: { id: true, fileName: true, isActive: true, createdAt: true },
      });
    } catch (_) {}

    const totalCompleted = completedSessions.length;
    const scores = completedSessions
      .map((s) => s.report?.overallScore)
      .filter((sc) => typeof sc === "number");

    const averageScore = scores.length
      ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
      : 0;
    const bestScore = scores.length ? Math.max(...scores) : 0;

    return res.status(200).json({
      success: true,
      data: {
        user: user || {
          name: req.user?.name || "Candidate",
          email: req.user?.email || "candidate@mockmate.ai",
          credits: 100,
        },
        stats: {
          totalCompleted,
          averageScore,
          bestScore,
          prepProgress: Math.min(100, totalCompleted * 20),
        },
        recentSessions: recentSessions.map((s) => ({
          id: s.id,
          roleTarget: s.roleTarget,
          difficulty: s.difficulty,
          status: s.status,
          createdAt: s.createdAt,
          overallScore: s.report?.overallScore || null,
        })),
        activeResume,
        metrics: {
          totalCompleted,
          totalSessions: completedSessions.length + recentSessions.length,
          avgScore: averageScore,
          bestScore,
          roadmapProgress: Math.min(100, totalCompleted * 20),
          atsCount: 0,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to fetch dashboard metrics: ${error.message}`,
    });
  }
};

export default {
  getCurrentUser,
  getDashboardMetrics,
};
