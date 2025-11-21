function CategoryFilter({ selectedCategory, onCategoryChange, allIssues }) {
  const categories = [
    { key: 'performance', label: 'Performance' },
    { key: 'accessibility', label: 'Accessibility' },
    { key: 'best-practices', label: 'Best Practices' },
    { key: 'seo', label: 'SEO' },
    { key: 'keyboard', label: 'Keyboard' },
  ];

  return (
    <div className='flex flex-wrap gap-2 mb-8'>
      <button
        onClick={() => onCategoryChange('all')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          selectedCategory === 'all'
            ? 'bg-black dark:bg-white text-white dark:text-black'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        All ({allIssues.length})
      </button>
      {categories.map(({ key, label }) => {
        const count = allIssues.filter((issue) => issue.type === key).length;
        // Only show category if it has issues
        if (count === 0) return null;

        return (
          <button
            key={key}
            onClick={() => onCategoryChange(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === key
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {label} ({count})
          </button>
        );
      })}
    </div>
  );
}

export default CategoryFilter;
