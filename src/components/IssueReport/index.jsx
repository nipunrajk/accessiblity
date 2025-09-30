import { useState } from 'react';
import CategoryFilter from './CategoryFilter';
import IssueList from './IssueList';

function IssueReport({ results, websiteUrl }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const allIssues = [
    ...(results.performance?.issues || []),
    ...(results.accessibility?.issues || []),
    ...(results.bestPractices?.issues || []),
    ...(results.seo?.issues || []),
  ].sort((a, b) => parseFloat(b.impact) - parseFloat(a.impact));

  const filteredIssues =
    selectedCategory === 'all'
      ? allIssues
      : allIssues.filter((issue) => issue.type === selectedCategory);

  return (
    <div className='bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl p-8'>
      <div className='flex items-center justify-between mb-8'>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-dark-text-primary'>
          Issues Found
        </h2>
        <span className='text-sm text-gray-500 dark:text-dark-text-muted'>
          {filteredIssues.length} issues
        </span>
      </div>

      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        allIssues={allIssues}
      />

      <IssueList issues={filteredIssues} websiteUrl={websiteUrl} />
    </div>
  );
}

export default IssueReport;
