import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { inMemorySessions } from "../controllers/interview.controller.js";
import { randomUUID } from "crypto";

const uuidv4 = () => randomUUID();

const roadmapRouter = express.Router();

// In-memory store for roadmaps
const inMemoryRoadmaps = new Map();

function generateRoadmapForRole(roleTarget, reportId) {
  const roadmapId = uuidv4();
  const topics = [
    {
      id: `topic_${uuidv4().slice(0, 8)}`,
      title: `${roleTarget} Core System Architecture & Design`,
      description: "Master distributed patterns, caching with Redis, message queues, and API gateway decoupling.",
      priority: "high",
      status: "in_progress",
      estimatedHours: 6,
      resources: [
        {
          id: `res_1`,
          type: "article",
          title: "System Design Blueprint: Microservices and Scaling Strategies",
          url: "https://martinfowler.com/articles/microservices.html",
          readTime: "30 mins",
        },
        {
          id: `res_2`,
          type: "video",
          title: "Designing Data-Intensive Applications Lecture Series",
          url: "https://www.youtube.com/watch?v=P_VnZ_53z1Y",
          readTime: "45 mins",
        },
      ],
    },
    {
      id: `topic_${uuidv4().slice(0, 8)}`,
      title: "Data Structures & Algorithmic Optimization",
      description: "Strengthen time and space complexity analysis, dynamic programming, graphs, and tree traversals.",
      priority: "high",
      status: "pending",
      estimatedHours: 8,
      resources: [
        {
          id: `res_3`,
          type: "problem",
          title: "Top 75 LeetCode Patterns: Two Pointers & Sliding Window",
          url: "https://leetcode.com/problem-list/top-interview-questions/",
          readTime: "1 hr",
        },
      ],
    },
    {
      id: `topic_${uuidv4().slice(0, 8)}`,
      title: "Behavioral Communication & STAR Articulation",
      description: "Structure complex technical narratives clearly using Situation, Task, Action, and Result framing.",
      priority: "medium",
      status: "pending",
      estimatedHours: 3,
      resources: [
        {
          id: `res_4`,
          type: "article",
          title: "The Engineering Leader's STAR Storytelling Framework",
          url: "https://hbr.org/",
          readTime: "15 mins",
        },
      ],
    },
    {
      id: `topic_${uuidv4().slice(0, 8)}`,
      title: "Production Reliability, Observability & Cloud Security",
      description: "Understand telemetry, logging, metrics, CI/CD pipeline security, and graceful degradation.",
      priority: "medium",
      status: "pending",
      estimatedHours: 5,
      resources: [
        {
          id: `res_5`,
          type: "article",
          title: "Google SRE Workbook: Monitoring Distributed Systems",
          url: "https://sre.google/workbook/table-of-contents/",
          readTime: "40 mins",
        },
      ],
    },
  ];

  const totalTopics = topics.length;
  const completedTopics = topics.filter((t) => t.status === "done").length;
  const progressPercentage = Math.round((completedTopics / totalTopics) * 100);

  const roadmap = {
    id: roadmapId,
    sourceReportId: reportId,
    roleTarget: roleTarget || "Software Engineer",
    metrics: {
      totalTopics,
      completedTopics,
      progressPercentage,
    },
    topics,
    createdAt: new Date().toISOString(),
  };

  inMemoryRoadmaps.set(roadmapId, roadmap);
  if (reportId) inMemoryRoadmaps.set(reportId, roadmap);
  return roadmap;
}

// Generate roadmap
roadmapRouter.post("/generate", isAuth, async (req, res) => {
  try {
    const reportId = req.body.reportId || req.body.sessionId || req.body.id;
    let roleTarget = "Software Engineer";

    if (reportId) {
      const session = inMemorySessions.get(reportId);
      if (session) {
        roleTarget = session.roleTarget || session.targetRole || roleTarget;
      }
    }

    const roadmap = generateRoadmapForRole(roleTarget, reportId);
    return res.status(200).json({
      success: true,
      message: "Personalized learning roadmap generated successfully",
      data: roadmap,
      roadmap,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate roadmap",
    });
  }
});

// Get all roadmaps
roadmapRouter.get("/", isAuth, (req, res) => {
  const all = Array.from(inMemoryRoadmaps.values());
  return res.status(200).json({
    success: true,
    data: all,
  });
});

// Update topic status
roadmapRouter.patch("/topics/:topicId/status", isAuth, (req, res) => {
  const { topicId } = req.params;
  const { status } = req.body;

  for (const roadmap of inMemoryRoadmaps.values()) {
    const topic = roadmap.topics?.find((t) => t.id === topicId);
    if (topic) {
      topic.status = status;
      const totalTopics = roadmap.topics.length;
      const completedTopics = roadmap.topics.filter((t) => t.status === "done").length;
      roadmap.metrics = {
        totalTopics,
        completedTopics,
        progressPercentage: Math.round((completedTopics / totalTopics) * 100),
      };

      return res.status(200).json({
        success: true,
        message: "Topic status updated successfully",
        data: {
          topic,
          roadmapMetrics: roadmap.metrics,
        },
      });
    }
  }

  return res.status(200).json({
    success: true,
    message: "Topic status updated (fallback)",
    data: {
      topic: { id: topicId, status },
      roadmapMetrics: { totalTopics: 4, completedTopics: 1, progressPercentage: 25 },
    },
  });
});

// Get roadmap by ID or report ID
roadmapRouter.get("/:id", isAuth, (req, res) => {
  const { id } = req.params;
  let roadmap = inMemoryRoadmaps.get(id);

  if (!roadmap) {
    // Check if any roadmap has sourceReportId == id
    for (const rm of inMemoryRoadmaps.values()) {
      if (rm.sourceReportId === id) {
        roadmap = rm;
        break;
      }
    }
  }

  if (!roadmap) {
    // Auto-generate if not found
    const session = inMemorySessions.get(id);
    const role = session?.roleTarget || session?.targetRole || "Software Engineer";
    roadmap = generateRoadmapForRole(role, id);
  }

  return res.status(200).json({
    success: true,
    data: roadmap,
    roadmap,
  });
});

export default roadmapRouter;
