import PropTypes from 'prop-types';

function AccessibilityIssues({ issues }) {
  // Don't render anything if there are no accessibility issues
  // The main IssueReport component will handle showing all issues
  if (!issues || issues.length === 0) {
    return null;
  }

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className='bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden'>
      <div className='px-6 py-4 border-b border-gray-200 dark:border-dark-border'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-dark-text-primary'>
          Accessibility Issues
        </h3>
      </div>

      <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead className='bg-gray-50 dark:bg-dark-bg'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider'>
                Issue
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider'>
                Severity
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider'>
                Location
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider'>
                Description
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 dark:divide-dark-border'>
            {issues.map((issue, index) => (
              <tr
                key={index}
                className='hover:bg-gray-50 dark:hover:bg-dark-bg/50'
              >
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-dark-text-primary'>
                  {issue.title || issue.issue || 'Accessibility Issue'}
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(
                      issue.severity
                    )}`}
                  >
                    {issue.severity || 'Medium'}
                  </span>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-dark-text-secondary'>
                  {issue.location || issue.selector || 'Various elements'}
                </td>
                <td className='px-6 py-4 text-sm text-gray-600 dark:text-dark-text-secondary'>
                  {issue.description ||
                    issue.help ||
                    'Please review this accessibility concern.'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

AccessibilityIssues.propTypes = {
  issues: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      issue: PropTypes.string,
      severity: PropTypes.string,
      location: PropTypes.string,
      selector: PropTypes.string,
      description: PropTypes.string,
      help: PropTypes.string,
    })
  ),
};

AccessibilityIssues.defaultProps = {
  issues: [],
};

export default AccessibilityIssues;
