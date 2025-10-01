import MetricItem from './MetricItem';

function SEOMetrics({ data }) {
  if (!data.issues) return null;

  const findIssue = (keywords) => {
    return data.issues.find((i) =>
      keywords.some((keyword) => i.title.toLowerCase().includes(keyword))
    );
  };

  const metrics = [
    {
      key: 'metaDescription',
      label: 'Meta Description',
      keywords: ['meta description', 'meta'],
    },
    {
      key: 'titleTags',
      label: 'Title Tags',
      keywords: ['title tag', 'title element'],
    },
    {
      key: 'headingStructure',
      label: 'Heading Structure',
      keywords: ['heading', 'h1', 'h2', 'h3', 'header structure'],
    },
    {
      key: 'mobileOptimization',
      label: 'Mobile Optimization',
      keywords: ['mobile', 'viewport', 'responsive'],
    },
    {
      key: 'urlStructure',
      label: 'URL Structure',
      keywords: ['url', 'slug', 'permalink'],
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

export default SEOMetrics;
