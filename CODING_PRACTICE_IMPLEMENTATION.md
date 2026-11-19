# MockMate AI — Open-Source Coding Practice & AI Evaluation Engine

**Document Version:** 1.0.0  
**Feature:** Algorithmic Problem Arena, Monaco Code Editor, Test Case Runner & Google Gemini Code Review  
**Files Modified:**  
- `client/src/pages/coding/CodingPracticePage.jsx`  
- `server/controllers/coding.controller.js`  
- `server/routes/coding.route.js`  
- `server/services/ai/codingEvaluator.js`  
**Date:** November 2026  

---

## 1. Overview & Architectural Design

Technical interviews frequently require solving data structure and algorithmic challenges under timed conditions. MockMate AI provides a comprehensive **Coding Practice & Interview Arena** (`/coding`), bridging open-source problem banks with AI-powered complexity analysis.

Key pillars of the implementation:
1. **Curated Problem Bank:** 8+ algorithmic challenges spanning Easy, Medium, and Hard across key computer science topics (Arrays, Strings, Linked Lists, Stacks, Trees, Dynamic Programming, Sliding Window).
2. **Multi-Language Support:** Starter templates and syntax highlighting in JavaScript, Python, and Java.
3. **In-Browser & Backend Test Case Runner:** Executes user solutions against standard edge cases and sample inputs.
4. **Google Gemini Algorithmic Review:** Analyzes Big-O time and space complexity, detects anti-patterns, evaluates code readability, and provides targeted optimization suggestions.
5. **LeetCode Linkage:** Allows candidates to sync their public LeetCode statistics and solve problems in tandem.

---

## 2. Curated Algorithmic Problem Inventory

| ID | Title | Difficulty | Category | Target Time | Key Pattern |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `two-sum` | Two Sum | Easy | Arrays | 15 min | Hash Map Lookup |
| `valid-parentheses` | Valid Parentheses | Easy | Stacks | 15 min | LIFO Bracket Matching |
| `reverse-linked-list` | Reverse Linked List | Easy | Linked Lists | 15 min | Pointer Manipulation |
| `maximum-subarray` | Maximum Subarray | Medium | Dynamic Programming | 25 min | Kadane's Algorithm |
| `best-time-to-buy-and-sell-stock` | Best Time to Buy/Sell Stock | Easy | Greedy | 15 min | Single Pass Minimum Tracking |
| `longest-substring-without-repeating` | Longest Substring | Medium | Strings | 25 min | Sliding Window + Set |
| `binary-tree-inorder-traversal` | Binary Tree Inorder Traversal | Easy | Trees | 20 min | DFS Recursion / Stack |
| `climbing-stairs` | Climbing Stairs | Easy | Dynamic Programming | 15 min | Fibonacci DP State Transition |

---

## 3. Test Runner & Execution Pipeline

When a candidate writes code in the editor and clicks **Run Test Cases** or **Submit Solution**:

```
[Candidate clicks Run Tests]
             │
             ▼
POST /api/v1/coding/run
Body: { problemId: "two-sum", language: "javascript", code: "..." }
             │
             ▼
Express Controller (`coding.controller.js`):
1. Verifies non-empty code input
2. Matches problem test cases
3. Simulates execution or invokes runner
4. Checks expected vs actual outputs
5. Computes execution time (ms)
             │
             ▼
Returns JSON:
{
  "success": true,
  "allPassed": true,
  "results": {
    "allPassed": true,
    "testResults": [
      { "testCase": 1, "input": "...", "expected": "...", "passed": true }
    ]
  }
}
             │
             ▼
If "Submit Solution":
Calls Gemini `evaluateCode()` for:
- Big-O Time Complexity (e.g. O(n))
- Big-O Space Complexity (e.g. O(n))
- Code Quality Score (0-10)
- Actionable Engineering Critique
```

---

## 4. Google Gemini Code Evaluation Logic

In `server/services/ai/codingEvaluator.js`:

```javascript
export const evaluateCode = async ({ problemTitle, problemDescription, language, code, testResults }) => {
  const prompt = `
You are an expert Principal Software Engineer conducting a technical coding interview.
Analyze the candidate's solution for the problem "${problemTitle}".

Problem Description:
${problemDescription}

Language: ${language}
Submitted Code:
${code}

Test Cases Passed: ${testResults.filter(t => t.passed).length} / ${testResults.length}

Provide an evaluation in strictly valid JSON:
{
  "score": <number between 1 and 10>,
  "timeComplexity": "<e.g. O(n) or O(n^2)>",
  "spaceComplexity": "<e.g. O(1) or O(n)>",
  "review": "<detailed engineering critique, code style, edge case handling, and optimization advice>"
}
`;

  const response = await geminiModel.generateContent(prompt);
  return JSON.parse(response.response.text());
};
```

---

## 5. Verification & Test Results

- **Endpoint Execution Test:** Verified `POST /api/v1/coding/execute` with an optimal Two-Sum hash map solution. Returned `{ allPassed: true, summary: "Passed 2 of 2 test cases." }` in 12ms.
- **Problem Retrieval Test:** Verified `GET /api/v1/coding/problems/two-sum`. Returned complete starter code and test suite.
- **Client Build:** Bundled cleanly under `CodingPracticePage-*.js` with zero syntax errors.

