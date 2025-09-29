import { getScoreColor } from '../utils/scoreUtils';

function ScoreOverview({ results }) {
  const scoreItems = [
    {
      label: 'Performance',
      description: 'Speed & Optimization',
      score: results.performance.score,
    },
    {
      label: 'Accessibility',
      description: 'Inclusive Design',
      score: results.accessibility.score,
    },
    {
      label: 'Best Practices',
      description: 'Code Quality',
      score: results.bestPractices.score,
    },
    {
      label: 'SEO',
      description: 'Search Optimization',
      score: results.seo.score,
    },
  ];

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
      {scoreItems.map((item) => (
        <div key={item.label} className='text-center'>
          <div className='relative w-20 h-20 mx-auto mb-3'>
            <svg className='w-20 h-20 transform -rotate-90' viewBox='0 0 36 36'>
              <path
                d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                fill='none'
                stroke='#f3f4f6'
                strokeWidth='2'
              />
              <path
                d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                fill='none'
                stroke={getScoreColor(item.score)}
                strokeWidth='2'
                strokeDasharray={`${item.score}, 100`}
              />
            </svg>
            <div className='absolute inset-0 flex items-center justify-center'>
              <span className='text-lg font-bold text-gray-900'>
                {Math.round(item.score)}
              </span>
            </div>
          </div>
          <h3 className='font-semibold text-gray-900'>{item.label}</h3>
          <p className='text-sm text-gray-600'>{item.description}</p>
        </div>
      ))}
    </div>
  );
}

export default ScoreOverview;
