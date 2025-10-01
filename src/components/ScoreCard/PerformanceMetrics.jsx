import MetricItem from './MetricItem';

function PerformanceMetrics({ data }) {
  if (!data.metrics) return null;

  const metrics = [
    { key: 'fcp', label: 'First Contentful Paint' },
    { key: 'lcp', label: 'Largest Contentful Paint' },
    { key: 'tbt', label: 'Total Blocking Time' },
    { key: 'cls', label: 'Cumulative Layout Shift' },
    { key: 'si', label: 'Speed Index' },
    { key: 'tti', label: 'Time to Interactive' },
  ];

  const getPerformanceStatus = (value) => {
    if (!value || typeof value !== 'object') return 'unknown';
    const score = value.score || 0;
    if (score >= 90) return 'good';
    if (score >= 50) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'good':
        return 'text-green-600 dark:text-green-400';
      case 'needs-improvement':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'poor':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good':
        return (
          <svg
            className='w-4 h-4 text-green-500'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
              clipRule='evenodd'
            />
          </svg>
        );
      case 'needs-improvement':
        return <div className='w-2 h-2 rounded-full bg-yellow-500'></div>;
      case 'poor':
        return <div className='w-2 h-2 rounded-full bg-red-500'></div>;
      default:
        return <div className='w-2 h-2 rounded-full bg-gray-400'></div>;
    }
  };

  return (
    <div className='space-y-3'>
      {metrics.map(({ key, label }) => {
        const metric = data.metrics[key];
        if (!metric) return null;

        const status = getPerformanceStatus(metric);
        const displayValue =
          typeof metric === 'object'
            ? metric.displayValue || metric.value || 'N/A'
            : metric;

        return (
          <div
            key={key}
            className='flex items-center justify-between py-3 px-4 rounded-lg bg-gray-50 dark:bg-gray-800/50'
          >
            <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              {label}
            </span>
            <div className='flex items-center gap-2'>
              <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                {typeof displayValue === 'number'
                  ? `${Math.round(displayValue)}ms`
                  : displayValue}
              </span>
              {getStatusIcon(status)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PerformanceMetrics;
