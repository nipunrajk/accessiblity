function AccessibilityMetrics({ data }) {
  if (!data.issues) return null;

  const findIssue = (keywords) => {
    return data.issues.find((i) =>
      keywords.some((keyword) => i.title.toLowerCase().includes(keyword))
    );
  };

  const metrics = [
    {
      key: 'colorContrast',
      label: 'Color Contrast',
      keywords: ['contrast', 'color'],
    },
    {
      key: 'headings',
      label: 'Headings',
      keywords: ['heading', 'h1', 'h2', 'h3', 'header'],
    },
    {
      key: 'aria',
      label: 'ARIA',
      keywords: ['aria', 'accessible name', 'role'],
    },
    {
      key: 'imageAlts',
      label: 'Image Alts',
      keywords: ['image', 'alt', 'img'],
    },
    {
      key: 'linkNames',
      label: 'Link Names',
      keywords: ['link', 'anchor', 'href'],
    },
  ];

  return (
    <div className='space-y-3'>
      {metrics.map(({ key, label, keywords }) => {
        const issue = findIssue(keywords);
        const hasIssues = issue && issue.items?.length > 0;

        return (
          <div
            key={key}
            className='flex items-center justify-between py-3 px-4 rounded-lg bg-gray-50 dark:bg-gray-800/50'
          >
            <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              {label}
            </span>
            <div className='flex items-center gap-2'>
              {hasIssues ? (
                <>
                  <span className='text-sm text-red-600 dark:text-red-400'>
                    {issue.items.length} issue
                    {issue.items.length !== 1 ? 's' : ''}
                  </span>
                  <div className='w-2 h-2 rounded-full bg-red-500'></div>
                </>
              ) : (
                <>
                  <span className='text-sm text-green-600 dark:text-green-400'>
                    Pass
                  </span>
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
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AccessibilityMetrics;
