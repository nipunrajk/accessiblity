import { useState } from 'react';
import PropTypes from 'prop-types';
import { getScoreColor } from '../utils/scoreUtils';
import MetricsModal from './MetricsModal';

function ScoreOverview({ results }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedData, setSelectedData] = useState(null);

  const scoreItems = [
    {
      label: 'Performance',
      description: 'Speed & Optimization',
      score: results.performance.score,
      data: results.performance,
    },
    {
      label: 'Accessibility',
      description: 'Inclusive Design',
      score: results.accessibility.score,
      data: results.accessibility,
    },
    {
      label: 'Best Practices',
      description: 'Code Quality',
      score: results.bestPractices.score,
      data: results.bestPractices,
    },
    {
      label: 'SEO',
      description: 'Search Optimization',
      score: results.seo.score,
      data: results.seo,
    },
  ];

  const handleInfoClick = (item) => {
    setSelectedCategory(item.label);
    setSelectedData(item.data);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCategory(null);
    setSelectedData(null);
  };

  return (
    <>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
        {scoreItems.map((item) => (
          <div
            key={item.label}
            className='bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-6 text-center'
          >
            <div className='flex items-center justify-center gap-2 mb-2'>
              <h3 className='font-semibold text-gray-900 dark:text-dark-text-primary'>
                {item.label}
              </h3>
              <button
                onClick={() => handleInfoClick(item)}
                className='p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors'
                title={`View ${item.label} details`}
              >
                <svg
                  className='w-4 h-4 text-gray-500 dark:text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </button>
            </div>
            <div className='text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-1'>
              {Math.round(item.score)}/100
            </div>
          </div>
        ))}
      </div>

      <MetricsModal
        isOpen={modalOpen}
        onClose={closeModal}
        category={selectedCategory}
        data={selectedData}
      />
    </>
  );
}

ScoreOverview.propTypes = {
  results: PropTypes.shape({
    performance: PropTypes.shape({
      score: PropTypes.number.isRequired,
    }).isRequired,
    accessibility: PropTypes.shape({
      score: PropTypes.number.isRequired,
    }).isRequired,
    bestPractices: PropTypes.shape({
      score: PropTypes.number.isRequired,
    }).isRequired,
    seo: PropTypes.shape({
      score: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
};

export default ScoreOverview;
