import PropTypes from 'prop-types';
import { getScoreColor } from '../utils/scoreUtils';

/**
 * AxeScoreCard Component
 * Displays combined Lighthouse + Axe-Core accessibility scores
 */
function AxeScoreCard({ scores, wcagCompliance }) {
  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A':
        return 'text-green-600 dark:text-green-400';
      case 'B':
        return 'text-blue-600 dark:text-blue-400';
      case 'C':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'D':
        return 'text-orange-600 dark:text-orange-400';
      case 'F':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getComplianceIcon = (compliant) => {
    return compliant ? (
      <svg
        className='w-5 h-5 text-green-500'
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
    ) : (
      <svg
        className='w-5 h-5 text-red-500'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
        />
      </svg>
    );
  };

  if (!scores) {
    return null;
  }

  return (
    <div className='bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-lg p-6 border border-blue-200 dark:border-blue-800'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center'>
          <svg
            className='w-6 h-6 text-blue-600 dark:text-blue-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
            />
          </svg>
        </div>
        <div>
          <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
            Combined Accessibility Score
          </h3>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            Lighthouse + Axe-Core Analysis
          </p>
        </div>
      </div>

      {/* Score Display */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        {/* Combined Score */}
        <div className='bg-white dark:bg-gray-800 rounded-lg p-4 text-center'>
          <div className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
            Combined Score
          </div>
          <div
            className={`text-4xl font-bold mb-1 ${getGradeColor(scores.grade)}`}
          >
            {scores.combined}
          </div>
          <div className={`text-2xl font-bold ${getGradeColor(scores.grade)}`}>
            Grade {scores.grade}
          </div>
        </div>

        {/* Lighthouse Score */}
        <div className='bg-white dark:bg-gray-800 rounded-lg p-4 text-center'>
          <div className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
            Lighthouse
          </div>
          <div
            className='text-3xl font-bold'
            style={{ color: getScoreColor(scores.lighthouse) }}
          >
            {scores.lighthouse}
          </div>
          <div className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
            ~40% WCAG Coverage
          </div>
        </div>

        {/* Axe Score */}
        <div className='bg-white dark:bg-gray-800 rounded-lg p-4 text-center'>
          <div className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
            Axe-Core
          </div>
          <div
            className='text-3xl font-bold'
            style={{ color: getScoreColor(scores.axe) }}
          >
            {scores.axe}
          </div>
          <div className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
            ~57% WCAG Coverage
          </div>
        </div>
      </div>

      {/* WCAG Compliance */}
      {wcagCompliance && (
        <div className='bg-white dark:bg-gray-800 rounded-lg p-4'>
          <h4 className='font-semibold text-gray-900 dark:text-white mb-3'>
            WCAG Compliance Status
          </h4>
          <div className='space-y-2'>
            {/* Level A */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                {getComplianceIcon(wcagCompliance.A?.compliant)}
                <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  WCAG 2.1 Level A
                </span>
              </div>
              <span className='text-sm text-gray-600 dark:text-gray-400'>
                {wcagCompliance.A?.violations || 0} violations
              </span>
            </div>

            {/* Level AA */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                {getComplianceIcon(wcagCompliance.AA?.compliant)}
                <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  WCAG 2.1 Level AA
                </span>
              </div>
              <span className='text-sm text-gray-600 dark:text-gray-400'>
                {wcagCompliance.AA?.violations || 0} violations
              </span>
            </div>

            {/* Level AAA */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                {getComplianceIcon(wcagCompliance.AAA?.compliant)}
                <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  WCAG 2.1 Level AAA
                </span>
              </div>
              <span className='text-sm text-gray-600 dark:text-gray-400'>
                {wcagCompliance.AAA?.violations || 0} violations
              </span>
            </div>

            {/* Overall Compliance */}
            <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
              <div className='flex items-center justify-between'>
                <span className='font-semibold text-gray-900 dark:text-white'>
                  Overall Compliance:
                </span>
                <span
                  className={`font-bold ${
                    wcagCompliance.overall?.compliantLevel === 'AAA'
                      ? 'text-green-600 dark:text-green-400'
                      : wcagCompliance.overall?.compliantLevel === 'AA'
                      ? 'text-blue-600 dark:text-blue-400'
                      : wcagCompliance.overall?.compliantLevel === 'A'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {wcagCompliance.overall?.compliantLevel || 'Non-compliant'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className='mt-4 pt-4 border-t border-blue-200 dark:border-blue-800'>
        <p className='text-xs text-gray-600 dark:text-gray-400'>
          <strong>Combined Analysis:</strong> This score combines Lighthouse's
          performance-focused accessibility checks with Axe-Core's comprehensive
          WCAG 2.1 validation, providing ~75% total WCAG coverage.
        </p>
      </div>
    </div>
  );
}

AxeScoreCard.propTypes = {
  scores: PropTypes.shape({
    lighthouse: PropTypes.number,
    axe: PropTypes.number,
    combined: PropTypes.number,
    grade: PropTypes.string,
  }),
  wcagCompliance: PropTypes.shape({
    A: PropTypes.shape({
      violations: PropTypes.number,
      compliant: PropTypes.bool,
    }),
    AA: PropTypes.shape({
      violations: PropTypes.number,
      compliant: PropTypes.bool,
    }),
    AAA: PropTypes.shape({
      violations: PropTypes.number,
      compliant: PropTypes.bool,
    }),
    overall: PropTypes.shape({
      compliantLevel: PropTypes.string,
    }),
  }),
};

export default AxeScoreCard;
