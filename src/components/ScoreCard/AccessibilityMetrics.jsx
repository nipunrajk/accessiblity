import MetricItem from './MetricItem';

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
    <div className='mt-4 border rounded-lg overflow-hidden bg-gray-50'>
      {metrics.map(({ key, label, keywords }) => {
        const issue = findIssue(keywords);
        return (
          <MetricItem
            key={key}
            title={label}
            value={issue ? `${issue.items?.length || 0} issues` : 'Pass'}
            score={issue ? issue.score : 100}
          />
        );
      })}
    </div>
  );
}

export default AccessibilityMetrics;
