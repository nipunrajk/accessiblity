function IssueItem({ issue }) {
  const getTypeColorClass = (type) => {
    switch (type) {
      case 'performance':
        return 'bg-blue-100 text-blue-700';
      case 'accessibility':
        return 'bg-green-100 text-green-700';
      case 'best-practices':
        return 'bg-purple-100 text-purple-700';
      case 'seo':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className='border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors'>
      <div className='flex items-start justify-between mb-4'>
        <div className='flex-1'>
          <div className='flex items-center gap-3 mb-2'>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColorClass(
                issue.type
              )}`}
            >
              {issue.type.charAt(0).toUpperCase() + issue.type.slice(1)}
            </span>
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            {issue.title}
          </h3>
          <p className='text-gray-600 leading-relaxed'>{issue.description}</p>
        </div>
      </div>
    </div>
  );
}

export default IssueItem;
