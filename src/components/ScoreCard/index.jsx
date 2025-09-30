import { getScoreColor } from '../../utils/scoreUtils';
import PerformanceMetrics from './PerformanceMetrics';
import AccessibilityMetrics from './AccessibilityMetrics';
import SEOMetrics from './SEOMetrics';
import BestPracticesMetrics from './BestPracticesMetrics';

function ScoreCard({ label, data }) {
  if (!data) return null;

  const renderMetrics = () => {
    switch (label) {
      case 'Performance':
        return <PerformanceMetrics data={data} />;
      case 'Accessibility':
        return <AccessibilityMetrics data={data} />;
      case 'SEO':
        return <SEOMetrics data={data} />;
      case 'Best Practices':
        return <BestPracticesMetrics data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className='bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl p-6'>
      <div className='flex items-center justify-between mb-6'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-dark-text-primary'>
          {label}
        </h3>
        <div className='text-right'>
          <div className='text-2xl font-bold text-gray-900 dark:text-dark-text-primary'>
            {Math.round(data.score)}%
          </div>
          <div className='text-sm text-gray-500 dark:text-dark-text-muted'>
            Score
          </div>
        </div>
      </div>

      <div className='space-y-4'>{renderMetrics()}</div>
    </div>
  );
}

export default ScoreCard;
