// src/pages/AtsResumePage.jsx
// Complete ATS Resume Analyzer & PDF Exporter in InterviewPilot design system.

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import api from '../services/api';
import { resumeService } from '../services/resumeService';
import jsPDF from 'jspdf';
import {
  ScanText,
  Upload,
  CheckCircle2,
  XCircle,
  Sparkles,
  Download,
  FileText,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';

export default function AtsResumePage() {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const res = await resumeService.getAll();
        const list = res.data?.data || res.data || [];
        setResumes(list);
        const active = list.find((r) => r.isActive);
        if (active) setSelectedResumeId(active.id);
        else if (list.length > 0) setSelectedResumeId(list[0].id);
      } catch {
        /* ignore */
      }
    };
    fetchResumes();
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!targetRole.trim()) {
      return setError('Please provide a target job role.');
    }
    setError('');
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('targetRole', targetRole.trim());
      if (jobDescription.trim()) formData.append('jobDescription', jobDescription.trim());

      if (uploadedFile) {
        formData.append('resume', uploadedFile);
      } else if (selectedResumeId) {
        formData.append('resumeId', selectedResumeId);
      }

      const res = await api.post('/ats/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data?.data || res.data;
      setAnalysisResult(data);
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to complete ATS analysis.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Export Optimized Resume as clean ATS-compliant PDF
  const handleDownloadOptimizedPdf = () => {
    if (!analysisResult) return;

    const doc = new jsPDF();
    const margin = 20;
    let y = 24;

    // Header
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(`ATS-OPTIMIZED RESUME`, margin, y);
    y += 8;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Target Role: ${targetRole} | ATS Readiness Score: ${analysisResult.atsScore}/100`, margin, y);
    y += 14;

    doc.setDrawColor(200);
    doc.line(margin, y, 190, y);
    y += 10;

    // Body text
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(20);

    const fullText = analysisResult.optimizedResumeText || 'Optimized text not generated.';
    const lines = doc.splitTextToSize(fullText, 170);

    lines.forEach((line) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 6;
    });

    doc.save(`${targetRole.replace(/\s+/g, '_')}_ATS_Optimized_Resume.pdf`);
  };

  return (
    <div style={layoutStyle}>
      <Sidebar />

      <main style={mainContentStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={badgePillStyle}>
            <ScanText size={14} color="#FF5A1F" />
            <span>AI RESUME SCANNER</span>
          </div>
          <h1 style={titleStyle}>ATS Resume Matcher & Optimizer</h1>
          <p style={subtitleStyle}>
            Audit your resume keyword match, detect missing qualifications, and generate an ATS-optimized export.
          </p>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        <div style={gridStyle}>
          {/* LEFT: Upload & Configuration Form */}
          <section style={cardStyle}>
            <h3 style={cardTitleStyle}>Scan Configuration</h3>

            <form onSubmit={handleAnalyze}>
              {/* Target Role */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Target Job Role *</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              {/* Resume Source */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Select Resume</label>
                {resumes.length > 0 && !uploadedFile && (
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    style={inputStyle}
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.fileName} {r.isActive ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                )}

                <div style={{ marginTop: '8px' }}>
                  <label style={uploadAreaStyle}>
                    <Upload size={18} color="#FF5A1F" />
                    <span>{uploadedFile ? uploadedFile.name : 'Or upload a new PDF resume'}</span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setUploadedFile(e.target.files[0]);
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* Optional Job Description */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Job Description (Optional)</label>
                <textarea
                  rows={4}
                  placeholder="Paste specific JD requirements or bullet points for keyword matching..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  style={textareaStyle}
                />
              </div>

              <button
                type="submit"
                disabled={analyzing}
                style={analyzeBtnStyle}
              >
                <Sparkles size={16} />
                <span>{analyzing ? 'Scanning Resume via Gemini...' : 'Analyze ATS Score →'}</span>
              </button>
            </form>
          </section>

          {/* RIGHT: Analysis Results Display */}
          <section style={cardStyle}>
            <h3 style={cardTitleStyle}>ATS Analysis Scorecard</h3>

            {analysisResult ? (
              <div>
                {/* Score Ring Header */}
                <div style={scoreHeaderStyle}>
                  <div style={scoreRingBoxStyle}>
                    <span style={scoreNumStyle}>{analysisResult.atsScore}</span>
                    <span style={scoreMaxStyle}>/ 100</span>
                  </div>
                  <div>
                    <span style={readinessBadgeStyle(analysisResult.atsScore)}>
                      {analysisResult.atsScore >= 80 ? 'High ATS Match' : analysisResult.atsScore >= 60 ? 'Moderate Match' : 'Action Required'}
                    </span>
                    <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#6B675F' }}>
                      Resume scanned against {analysisResult.targetRole}
                    </p>
                  </div>
                </div>

                {/* Keywords Analysis */}
                <div style={sectionBoxStyle}>
                  <h4 style={sectionHeaderStyle}>Keywords Detected ({analysisResult.matchingKeywords?.length || 0})</h4>
                  <div style={chipsWrapStyle}>
                    {analysisResult.matchingKeywords?.map((kw, i) => (
                      <span key={i} style={greenChipStyle}>✓ {kw}</span>
                    ))}
                  </div>

                  <h4 style={{ ...sectionHeaderStyle, marginTop: '14px' }}>
                    Missing Keywords ({analysisResult.missingKeywords?.length || 0})
                  </h4>
                  <div style={chipsWrapStyle}>
                    {analysisResult.missingKeywords?.map((kw, i) => (
                      <span key={i} style={redChipStyle}>+ {kw}</span>
                    ))}
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
                  <div style={miniCardStyle}>
                    <b style={{ fontSize: '13px', color: '#16A34A' }}>Key Strengths</b>
                    <ul style={{ margin: '6px 0 0', paddingLeft: '16px', fontSize: '12px' }}>
                      {analysisResult.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>

                  <div style={miniCardStyle}>
                    <b style={{ fontSize: '13px', color: '#EC4F5F' }}>Improvement Areas</b>
                    <ul style={{ margin: '6px 0 0', paddingLeft: '16px', fontSize: '12px' }}>
                      {analysisResult.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Export Action */}
                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                  <button
                    onClick={handleDownloadOptimizedPdf}
                    style={downloadBtnStyle}
                  >
                    <Download size={16} />
                    <span>Download ATS-Optimized Resume (PDF)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={placeholderStyle}>
                <ScanText size={48} color="#C3C8C3" />
                <p style={{ margin: '14px 0 0', color: '#6B675F', fontSize: '14px' }}>
                  Upload or select a resume and click "Analyze ATS Score" to review match scores and keyword suggestions.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

// ─── Inline Styles adhering to InterviewPilot Palette ────────────────────────
const layoutStyle = {
  display: 'flex',
  minHeight: '100vh',
  background: '#F2EEE6',
  color: '#0A0A0A',
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
};

const mainContentStyle = {
  flex: 1,
  minWidth: 0,
  padding: 'clamp(20px, 3vw, 40px)',
  maxWidth: '1600px',
  width: '100%',
  margin: '0 auto',
  boxSizing: 'border-box',
};

const headerStyle = {
  marginBottom: '28px',
};

const badgePillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: '#FFFFFF',
  border: '1px solid #E3DED2',
  padding: '6px 12px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '700',
  marginBottom: '10px',
};

const titleStyle = {
  fontFamily: "'Anton', Impact, sans-serif",
  fontSize: 'clamp(32px, 4vw, 44px)',
  fontWeight: '400',
  textTransform: 'uppercase',
  margin: '0 0 8px',
  letterSpacing: '0.02em',
};

const subtitleStyle = {
  fontSize: '15px',
  color: '#6B675F',
  margin: 0,
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(340px, 440px) 1fr',
  gap: '24px',
  alignItems: 'start',
};

const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E3DED2',
  borderRadius: '20px',
  padding: '26px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
};

const cardTitleStyle = {
  fontSize: '18px',
  fontWeight: '700',
  margin: '0 0 18px',
};

const fieldGroupStyle = {
  marginBottom: '16px',
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  height: '46px',
  padding: '0 14px',
  borderRadius: '12px',
  border: '1px solid #E3DED2',
  background: '#FBFAF7',
  font: 'inherit',
  fontSize: '14px',
  color: '#0A0A0A',
  boxSizing: 'border-box',
  outline: 'none',
};

const textareaStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid #E3DED2',
  background: '#FBFAF7',
  font: 'inherit',
  fontSize: '14px',
  color: '#0A0A0A',
  boxSizing: 'border-box',
  outline: 'none',
  resize: 'vertical',
};

const uploadAreaStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px',
  borderRadius: '12px',
  border: '1px dashed #E3DED2',
  background: '#FBFAF7',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '500',
};

const analyzeBtnStyle = {
  width: '100%',
  height: '48px',
  borderRadius: '999px',
  background: '#0A0A0A',
  color: '#F2EEE6',
  border: 'none',
  font: 'inherit',
  fontSize: '14px',
  fontWeight: '700',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  marginTop: '10px',
};

const scoreHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  paddingBottom: '20px',
  borderBottom: '1px solid #E3DED2',
  marginBottom: '16px',
};

const scoreRingBoxStyle = {
  width: '74px',
  height: '74px',
  borderRadius: '50%',
  background: '#F4CF63',
  display: 'grid',
  placeItems: 'center',
  color: '#0A0A0A',
  boxShadow: '0 4px 14px rgba(244, 207, 99, 0.4)',
};

const scoreNumStyle = {
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
  fontSize: '26px',
  fontWeight: '700',
  lineHeight: 1,
};

const scoreMaxStyle = {
  fontSize: '10px',
  fontWeight: '700',
  color: '#6B675F',
};

const readinessBadgeStyle = (score) => ({
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '700',
  background: score >= 80 ? '#F0FDF4' : score >= 60 ? '#FFFBEB' : '#FBEBED',
  color: score >= 80 ? '#16A34A' : score >= 60 ? '#D97706' : '#EC4F5F',
});

const sectionBoxStyle = {
  background: '#FBFAF7',
  border: '1px solid #E3DED2',
  borderRadius: '14px',
  padding: '16px',
};

const sectionHeaderStyle = {
  margin: '0 0 8px',
  fontSize: '12px',
  fontWeight: '700',
  textTransform: 'uppercase',
  color: '#6B675F',
};

const chipsWrapStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
};

const greenChipStyle = {
  background: '#F0FDF4',
  border: '1px solid #DCFCE7',
  color: '#16A34A',
  padding: '4px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '600',
};

const redChipStyle = {
  background: '#FBEBED',
  border: '1px solid #FCD34D',
  color: '#EC4F5F',
  padding: '4px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '600',
};

const miniCardStyle = {
  background: '#FBFAF7',
  border: '1px solid #E3DED2',
  borderRadius: '12px',
  padding: '12px',
};

const downloadBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '14px 28px',
  borderRadius: '999px',
  background: '#F4CF63',
  color: '#0A0A0A',
  border: 'none',
  font: 'inherit',
  fontSize: '14px',
  fontWeight: '700',
  cursor: 'pointer',
  boxShadow: '0 4px 16px rgba(244, 207, 99, 0.3)',
};

const placeholderStyle = {
  minHeight: '280px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: '32px',
};

const errorStyle = {
  padding: '12px 16px',
  borderRadius: '10px',
  background: '#FBEBED',
  color: '#EC4F5F',
  fontSize: '13px',
  fontWeight: '600',
  marginBottom: '16px',
};

