import IssueItem from './IssueItem';

function IssueList({ issues }) {
  if (issues.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <svg
            className='w-8 h-8 text-green-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M5 13l4 4L19 7'
            />
          </svg>
        </div>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
          No Issues Found
        </h3>
        <p className='text-gray-600'>
          Great! No issues were found in this category.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {issues.map((issue, index) => (
        <IssueItem key={index} issue={issue} />
      ))}
    </div>
  );
}

export default IssueList;
