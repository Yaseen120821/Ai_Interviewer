// client/src/components/dashboard/DashboardLoadingState.jsx
// Enterprise Skeleton Loading State matching Dashboard Layout Grid

import React from 'react';
import Sidebar from '../layout/Sidebar';

export default function DashboardLoadingState() {
  return (
    <div style={styles.layout}>
      <Sidebar />
      <main style={styles.main}>
        {/* Header Skeleton */}
        <div style={styles.headerSkeleton}>
          <div style={styles.avatarSkeleton} />
          <div style={styles.textSkeletonGroup}>
            <div style={{ ...styles.bone, width: '140px', height: '14px' }} />
            <div style={{ ...styles.bone, width: '220px', height: '26px' }} />
            <div style={{ ...styles.bone, width: '380px', height: '14px' }} />
          </div>
        </div>

        {/* 8 KPI Cards Skeleton Grid */}
        <div style={styles.kpiGridSkeleton}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={styles.kpiCardSkeleton}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ ...styles.bone, width: '100px', height: '14px' }} />
                <div style={{ ...styles.bone, width: '28px', height: '28px', borderRadius: '6px' }} />
              </div>
              <div style={{ ...styles.bone, width: '70px', height: '30px', margin: '14px 0 8px' }} />
              <div style={{ ...styles.bone, width: '130px', height: '12px' }} />
            </div>
          ))}
        </div>

        {/* Charts Row Skeleton */}
        <div style={styles.chartsRowSkeleton}>
          <div style={{ ...styles.chartSkeleton, flex: '1.6' }} />
          <div style={{ ...styles.chartSkeleton, flex: '1' }} />
        </div>
      </main>
    </div>
  );
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: '#F8FAFC',
  },
  main: {
    flex: 1,
    padding: '28px 32px',
    maxWidth: '1520px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    boxSizing: 'border-box',
  },
  bone: {
    background: '#E2E8F0',
    borderRadius: '4px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  headerSkeleton: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    padding: '24px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
  },
  avatarSkeleton: {
    width: '54px',
    height: '54px',
    borderRadius: '12px',
    background: '#E2E8F0',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  textSkeletonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  kpiGridSkeleton: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  kpiCardSkeleton: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '20px',
    minHeight: '136px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  chartsRowSkeleton: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  chartSkeleton: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    minHeight: '340px',
  },
};

