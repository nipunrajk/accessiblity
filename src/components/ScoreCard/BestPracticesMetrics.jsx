function BestPracticesMetrics({ data }) {
  if (!data.issues) return null;

  const findIssue = (keywords) => {
    return data.issues.find((i) =>
      keywords.some((keyword) => i.title.toLowerCase().includes(keyword))
    );
  };

  const metrics = [
    {
      key: 'https',
      label: 'HTTPS Usage',
      keywords: ['https', 'ssl', 'secure'],
    },
    {
      key: 'doctype',
      label: 'Valid Doctype',
      keywords: ['doctype', 'html5', 'document type'],
    },
    {
      key: 'javascriptErrors',
      label: 'No JavaScript Errors',
      keywords: ['javascript', 'error', 'console'],
    },
    {
      key: 'mobileFriendly',
      label: 'Mobile Friendly',
      keywords: ['mobile', 'viewport', 'responsive'],
    },
    {
      key: 'browserCompatibility',
      label: 'Browser Compatibility',
      keywords: ['browser', 'compatibility', 'support'],
    },
  ];

  return (
    <div className='mt-4 border rounded-lg overflow-hidden bg-gray-50'>
      {metrics.map(({ key, label, keywords }) => {
        const issue = findIssue(keywords);
        const symbol = !issue ? '✓' : '✗';
        const symbolColor = !issue ? 'text-green-600' : 'text-red-600';

        return (
          <div
            key={key}
            className='flex items-center justify-between p-2 border-b border-gray-100 last:border-0'
          >
            <span className='text-sm font-medium text-gray-600'>{label}</span>
            <div className='flex items-center'>
              <span className={`text-2xl font-bold ${symbolColor}`}>
                {symbol}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default BestPracticesMetrics;
