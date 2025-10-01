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

  return (
    <div className='space-y-1'>
      {metrics.map(
        ({ key, label }) =>
          data.metrics[key] && (
            <MetricItem key={key} title={label} value={data.metrics[key]} />
          )
      )}
    </div>
  );
}

export default PerformanceMetrics;
