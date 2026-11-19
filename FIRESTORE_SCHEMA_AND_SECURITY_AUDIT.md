# MockMate AI — Cloud Firestore Data Architecture & Security Audit

**Document Version:** 1.0.0  
**Feature:** Schema Definition, User Isolation, Spark Free-Plan Compliance & Firestore Security Rules  
**Files Audited:**  
- `client/src/services/firestoreService.js`  
- `client/src/config/firebase.js`  
- `server/config/firebaseAdmin.js`  
**Date:** November 2026  

---

## 1. Executive Summary & Zero-Cost Spark Plan Principles

MockMate AI runs entirely on Google Firebase's **Spark Free Tier**, requiring zero credit cards or billing accounts. To maintain 100% compliance without hitting quota boundaries:

1. **Zero Firebase Storage:** PDF resumes and attachments are hosted strictly on the local Express disk storage. No calls to `firebase/storage` or Google Cloud Storage buckets exist in the application.
2. **Lean Document Schemas:** Redundant nested arrays are minimized to keep document sizes small, ensuring lightning-fast reads and writes within the daily free 50,000 reads / 20,000 writes quota.
3. **Optimized Real-Time Listeners:** Firestore snapshot listeners are attached exclusively on active mounted screens (e.g. active interview session, live dashboard) and cleanly detached during `useEffect` cleanup.

---

## 2. Cloud Firestore Collections & Document Schemas

### 2.1 Collection: `users`
Keyed by immutable Firebase User UID (`users/{uid}`).

```json
{
  "_id": "uid_abc123xyz",
  "email": "candidate@example.com",
  "name": "Alex Candidate",
  "role": "Full Stack Engineer",
  "targetRole": "Senior Full Stack Engineer",
  "targetIndustry": "Fintech / Cloud Infrastructure",
  "yearsOfExperience": 4,
  "skills": [
    { "name": "React", "level": "Expert" },
    { "name": "Node.js", "level": "Advanced" },
    { "name": "System Design", "level": "Intermediate" }
  ],
  "github": "https://github.com/torvalds",
  "githubUsername": "torvalds",
  "linkedin": "https://linkedin.com/in/alexcandidate",
  "leetcode": "alex_codes",
  "portfolio": "https://alexcandidate.dev",
  "resumeFileName": "Alex_Candidate_Resume.pdf",
  "resumeUrl": "http://localhost:5000/uploads/resumes/Alex_Candidate_Resume.pdf",
  "resumeUploadedAt": "2026-11-19T10:15:00.000Z",
  "createdAt": "2026-11-19T08:00:00.000Z",
  "updatedAt": "2026-11-19T11:30:00.000Z"
}
```

### 2.2 Collection: `interviews`
Keyed by unique interview ID (`interviews/{interviewId}`).

```json
{
  "_id": "int_789456123",
  "userId": "uid_abc123xyz",
  "company": "Google",
  "jobTitle": "Staff Software Engineer",
  "jobDescription": "Full stack architecture, distributed systems, high throughput microservices...",
  "roundFormat": "Technical Round",
  "difficulty": "Hard",
  "status": "COMPLETED",
  "questions": [
    {
      "id": 1,
      "text": "How do you handle consensus in distributed systems when network partitions occur?",
      "round": "Technical Round",
      "expectedAnswer": "CAP theorem, Paxos/Raft, leader election, quorum reads/writes..."
    }
  ],
  "answers": [
    {
      "questionId": 1,
      "userAnswer": "In distributed consensus, Raft or Paxos achieves quorum by...",
      "score": 9,
      "feedback": "Comprehensive explanation of quorum and log replication.",
      "submittedAt": "2026-11-19T10:20:00.000Z"
    }
  ],
  "feedback": {
    "overallScore": 88,
    "strengths": ["Clear communication", "Strong distributed systems fundamentals"],
    "improvements": ["Elaborate on network split-brain recovery procedures"],
    "summary": "Excellent technical performance indicating readiness for Senior/Staff roles."
  },
  "metrics": {
    "totalTimeSeconds": 1420,
    "questionsAnswered": 5,
    "accuracyRate": 88
  },
  "createdAt": "2026-11-19T10:15:00.000Z",
  "completedAt": "2026-11-19T10:38:40.000Z"
}
```

### 2.3 Collection: `coding_submissions`
Keyed by submission ID (`coding_submissions/{submissionId}`).

```json
{
  "_id": "sub_44556677",
  "userId": "uid_abc123xyz",
  "problemId": "two-sum",
  "language": "javascript",
  "code": "function twoSum(nums, target) { ... }",
  "testResults": [
    { "testCase": 1, "passed": true },
    { "testCase": 2, "passed": true }
  ],
  "aiEvaluation": {
    "score": 9.5,
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(n)",
    "review": "Optimal one-pass hash map implementation."
  },
  "createdAt": "2026-11-19T11:45:00.000Z"
}
```

---

## 3. Recommended Production Security Rules

To ensure strict tenant isolation where no candidate can read or modify another candidate's private interview data or resume records, configure the following rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // User Profile Documents
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Mock Interview Records
    match /interviews/{interviewId} {
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    // Coding Practice Submissions
    match /coding_submissions/{submissionId} {
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 4. Verification Check

- [x] All client Firestore queries use `where("userId", "==", user.uid)`.
- [x] All listeners clean up automatically on component unmount.
- [x] Database completely functions within the daily Spark plan quotas.

