// client/src/components/dashboard/DashboardKpiGrid.jsx
// 8 Balanced Metric Cards in Responsive 4x2 Grid

import React from 'react';
import KpiCard from './KpiCard';
import {
  Layers,
  CheckCircle2,
  Clock,
  Award,
  Flame,
  Hourglass,
  CheckSquare,
  TrendingUp,
} from 'lucide-react';

export default function DashboardKpiGrid({ analytics }) {
  const hasData = analytics?.total > 0;
  const hasEval = analytics?.hasEvaluationData;

  const cards = [
    {
      id: 'total',
      title: 'Total Interviews',
      value: analytics?.total ?? 0,
      description: 'Lifetime mock sessions created',
      icon: Layers,
      iconColor: '#0F172A',
      iconBg: '#F1F5F9',
    },
    {
      id: 'completed',
      title: 'Completed Interviews',
      value: analytics?.completed ?? 0,
      description: 'Fully evaluated with report',
      icon: CheckCircle2,
      iconColor: '#10B981',
      iconBg: '#ECFDF5',
    },
    {
      id: 'inprogress',
      title: 'In-Progress Interviews',
      value: analytics?.inProgress ?? 0,
      description: 'Sessions awaiting completion',
      icon: Clock,
      iconColor: '#F59E0B',
      iconBg: '#FFFBEB',
    },
    {
      id: 'avgScore',
      title: 'Average Interview Score',
      value: hasEval && analytics?.avgScore > 0 ? analytics.avgScore : '—',
      unit: hasEval && analytics?.avgScore > 0 ? '/ 10' : undefined,
      description: 'Gemini AI evaluated mean',
      icon: Award,
      iconColor: '#2563EB',
      iconBg: '#EFF6FF',
    },
    {
      id: 'highestScore',
      title: 'Highest Interview Score',
      value: hasEval && analytics?.highestScore > 0 ? analytics.highestScore : '—',
      unit: hasEval && analytics?.highestScore > 0 ? '/ 10' : undefined,
      description: 'Personal best performance',
      icon: Flame,
      iconColor: '#EA580C',
      iconBg: '#FFF7ED',
    },
    {
      id: 'practiceTime',
      title: 'Total Practice Time',
      value: analytics?.totalMinutes ? (
        analytics.totalMinutes >= 60
          ? `${(analytics.totalMinutes / 60).toFixed(1)}`
          : analytics.totalMinutes
      ) : 0,
      unit: analytics?.totalMinutes >= 60 ? 'hrs' : 'mins',
      description: 'Focused interview simulation',
      icon: Hourglass,
      iconColor: '#8B5CF6',
      iconBg: '#F5F3FF',
    },
    {
      id: 'completionRate',
      title: 'Completion Rate',
      value: hasData ? `${analytics?.completionRate ?? 0}%` : '—',
      description: 'Finished vs abandoned rounds',
      icon: CheckSquare,
      iconColor: '#059669',
      iconBg: '#ECFDF5',
    },
    {
      id: 'improvement',
      title: 'Performance Improvement',
      value: analytics?.scoreImprovement ? analytics.scoreImprovement : '—',
      unit: analytics?.scoreImprovement ? 'pts' : undefined,
      trend: analytics?.scoreImprovement?.startsWith('+') ? 'Improving' : undefined,
      trendType: analytics?.scoreImprovement?.startsWith('+') ? 'positive' : 'neutral',
      description: 'Score delta: initial to latest',
      icon: TrendingUp,
      iconColor: '#0284C7',
      iconBg: '#F0F9FF',
    },
  ];

  return (
    <section style={styles.gridSection}>
      {cards.map((card) => (
        <KpiCard
          key={card.id}
          title={card.title}
          value={card.value}
          unit={card.unit}
          description={card.description}
          icon={card.icon}
          iconColor={card.iconColor}
          iconBg={card.iconBg}
          trend={card.trend}
          trendType={card.trendType}
        />
      ))}
    </section>
  );
}

const styles = {
  gridSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    width: '100%',
    boxSizing: 'border-box',
  },
};

