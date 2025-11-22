import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * AxeViolations Component
 * Displays Axe-Core accessibility violations with detailed information
 */
function AxeViolations({ violations, incomplete, passes, showPasses = false }) {
  const [selectedTab, setSelectedTab] = useState('violations');
  const [expandedViolation, setExpandedViolation] = useState(null);

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'serious':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'minor':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    }
  };

  const getWCAGLevelColor = (level) => {
    switch (level) {
      case 'A':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'AA':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'AAA':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const toggleViolation = (id) => {
    setExpandedViolation(expandedViolation === id ? null : id);
  };

  const renderViolationsList = (items, type = 'violation') => {
    if (!items || items.length === 0) {
      return (
        <div className='text-center py-8 text-gray-500 dark:text-gray-400'>
          <svg
            className='w-12 h-12 mx-auto mb-3 text-green-500'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          <p className='font-medium'>
            {type === 'violation'
              ? 'No violations found!'
              : type === 'incomplete'
              ? 'No items need manual review'
              : 'No passing checks'}
          </p>
        </div>
      );
    }

    // Group items by rule ID to avoid showing duplicates
    const groupedItems = items.reduce((acc, item) => {
      const key = item.id || item.title;
      if (!acc[key]) {
        acc[key] = {
          ...item,
          totalNodes: item.nodeCount || item.nodes?.length || 1,
          allNodes: item.nodes || [],
        };
      } else {
        // Merge nodes if we have multiple instances of the same rule
        acc[key].totalNodes += item.nodeCount || item.nodes?.length || 1;
        if (item.nodes) {
          acc[key].allNodes = [...acc[key].allNodes, ...item.nodes];
        }
      }
      return acc;
    }, {});

    const uniqueItems = Object.values(groupedItems);

    return (
      <div className='space-y-4'>
        {uniqueItems.map((item) => (
          <div
            key={item.id}
            className='border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'
          >
            {/* Violation Header */}
            <div
              className='p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
              onClick={() => toggleViolation(item.id)}
            >
              <div className='flex items-start justify-between gap-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-2'>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getImpactColor(
                        item.impact
                      )}`}
                    >
                      {item.impact?.toUpperCase()}
                    </span>
                    {item.wcagLevel && (
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getWCAGLevelColor(
                          item.wcagLevel
                        )}`}
                      >
                        WCAG {item.wcagLevel}
                      </span>
                    )}
                    {item.totalNodes && (
                      <span className='text-xs text-gray-500 dark:text-gray-400'>
                        {item.totalNodes}{' '}
                        {item.totalNodes === 1 ? 'element' : 'elements'}
                      </span>
                    )}
                  </div>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-1'>
                    {item.help || item.title}
                  </h3>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    {item.description}
                  </p>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedViolation === item.id ? 'transform rotate-180' : ''
                  }`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedViolation === item.id && (
              <div className='border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4'>
                {/* WCAG Criteria */}
                {item.wcagCriteria && item.wcagCriteria.length > 0 && (
                  <div className='mb-4'>
                    <h4 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                      WCAG Success Criteria:
                    </h4>
                    <div className='flex flex-wrap gap-2'>
                      {item.wcagCriteria.map((criteria) => (
                        <span
                          key={criteria}
                          className='px-2 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-sm text-xs'
                        >
                          {criteria}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Affected Elements */}
                {item.allNodes && item.allNodes.length > 0 && (
                  <div className='mb-4'>
                    <h4 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                      Affected Elements ({item.allNodes.length}):
                    </h4>
                    <div className='space-y-3'>
                      {item.allNodes.slice(0, 5).map((node, idx) => (
                        <div
                          key={idx}
                          className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-sm p-3'
                        >
                          {node.target && (
                            <div className='mb-2'>
                              <span className='text-xs font-mono text-blue-600 dark:text-blue-400'>
                                {node.target[0]}
                              </span>
                            </div>
                          )}
                          {node.html && (
                            <pre className='text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded-sm overflow-x-auto'>
                              <code>{node.html}</code>
                            </pre>
                          )}
                          {node.failureSummary && (
                            <p className='text-xs text-gray-600 dark:text-gray-400 mt-2'>
                              {node.failureSummary}
                            </p>
                          )}
                        </div>
                      ))}
                      {item.allNodes.length > 5 && (
                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                          ... and {item.allNodes.length - 5} more elements
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Learn More */}
                {item.helpUrl && (
                  <a
                    href={item.helpUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline'
                  >
                    Learn more about this issue
                    <svg
                      className='w-4 h-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                      />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className='bg-white dark:bg-dark-surface rounded-xl shadow-lg p-6'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
          Axe-Core Accessibility Analysis
        </h2>
        <div className='flex items-center gap-2'>
          <span className='text-sm text-gray-500 dark:text-gray-400'>
            Powered by
          </span>
          <span className='font-semibold text-blue-600 dark:text-blue-400'>
            Deque Axe
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className='flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700'>
        <button
          onClick={() => setSelectedTab('violations')}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedTab === 'violations'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Violations ({violations?.length || 0})
        </button>
        <button
          onClick={() => setSelectedTab('incomplete')}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedTab === 'incomplete'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Needs Review ({incomplete?.length || 0})
        </button>
        {showPasses && (
          <button
            onClick={() => setSelectedTab('passes')}
            className={`px-4 py-2 font-medium transition-colors ${
              selectedTab === 'passes'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Passed ({passes?.length || 0})
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div>
        {selectedTab === 'violations' &&
          renderViolationsList(violations, 'violation')}
        {selectedTab === 'incomplete' &&
          renderViolationsList(incomplete, 'incomplete')}
        {selectedTab === 'passes' && renderViolationsList(passes, 'pass')}
      </div>
    </div>
  );
}

AxeViolations.propTypes = {
  violations: PropTypes.array,
  incomplete: PropTypes.array,
  passes: PropTypes.array,
  showPasses: PropTypes.bool,
};

export default AxeViolations;
