import {
  SCORE_THRESHOLDS,
  SCORE_COLORS,
  IMPACT_THRESHOLDS,
  IMPACT_LEVELS,
  ISSUE_CATEGORIES,
} from '../constants';

export const getScoreColor = (score) => {
  if (typeof score !== 'number' || isNaN(score)) return SCORE_COLORS.POOR;

  if (score >= SCORE_THRESHOLDS.EXCELLENT) return SCORE_COLORS.EXCELLENT;
  if (score >= SCORE_THRESHOLDS.GOOD) return SCORE_COLORS.GOOD;
  return SCORE_COLORS.POOR;
};

export const getImpactLabel = (impact, type) => {
  const impactNum = parseFloat(impact);
  const categoryThresholds =
    IMPACT_THRESHOLDS[type] || IMPACT_THRESHOLDS[ISSUE_CATEGORIES.PERFORMANCE];

  if (impactNum >= categoryThresholds[IMPACT_LEVELS.CRITICAL])
    return 'Critical';
  if (impactNum >= categoryThresholds[IMPACT_LEVELS.HIGH]) return 'High';
  if (impactNum >= categoryThresholds[IMPACT_LEVELS.MEDIUM]) return 'Medium';
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
