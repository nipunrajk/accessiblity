export const getScoreColor = (score) => {
  if (typeof score !== 'number' || isNaN(score)) return '#ef4444';
  return score >= 90 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
};

export const getImpactLabel = (impact, type) => {
  const impactNum = parseFloat(impact);
  const thresholds = {
    performance: {
      critical: 25,
      high: 15,
      medium: 8,
    },
    accessibility: {
      critical: 15,
      high: 10,
      medium: 5,
    },
    'best-practices': {
      critical: 20,
      high: 12,
      medium: 6,
    },
    seo: {
      critical: 18,
      high: 10,
      medium: 5,
    },
  };

  const categoryThresholds = thresholds[type] || thresholds.performance;
  if (impactNum >= categoryThresholds.critical) return 'Critical';
  if (impactNum >= categoryThresholds.high) return 'High';
  if (impactNum >= categoryThresholds.medium) return 'Medium';
  return 'Low';
};

export const getTypeColor = (type) => {
  switch (type) {
    case 'performance':
      return 'text-blue-600';
    case 'accessibility':
      return 'text-green-600';
    case 'best-practices':
      return 'text-purple-600';
    case 'seo':
      return 'text-orange-600';
    default:
      return 'text-gray-600';
  }
};

export const getImpactColor = (impact, type) => {
  const label = getImpactLabel(impact, type);
  switch (label) {
    case 'Critical':
      return 'bg-red-100 text-red-800';
    case 'High':
      return 'bg-orange-100 text-orange-800';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-green-100 text-green-800';
  }
};
