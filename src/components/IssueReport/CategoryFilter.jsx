function CategoryFilter({ selectedCategory, onCategoryChange, allIssues }) {
  const categories = ['performance', 'accessibility', 'best-practices', 'seo'];

  return (
    <div className='flex flex-wrap gap-2 mb-8'>
      <button
        onClick={() => onCategoryChange('all')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          selectedCategory === 'all'
            ? 'bg-black text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        All ({allIssues.length})
      </button>
      {categories.map((type) => {
        const count = allIssues.filter((issue) => issue.type === type).length;
        return (
          <button
            key={type}
            onClick={() => onCategoryChange(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === type
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
          </button>
        );
      })}
    </div>
  );
}

export default CategoryFilter;
