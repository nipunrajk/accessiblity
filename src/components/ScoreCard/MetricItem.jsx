import { getScoreColor } from '../../utils/scoreUtils';

function MetricItem({ title, value, score }) {
  const displayValue =
    typeof value === 'object' ? value.displayValue || value.value : value;
  const displayScore = typeof value === 'object' ? value.score || 0 : score;

  return (
    <div className='flex items-center justify-between py-2'>
      <span className='text-sm text-gray-600'>{title}</span>
      <div className='flex items-center gap-3'>
        <span className='text-sm font-medium text-gray-900'>
          {typeof displayValue === 'number'
            ? Math.round(displayValue) + 'ms'
            : displayValue}
        </span>
        <div
          className='w-2 h-2 rounded-full'
          style={{ backgroundColor: getScoreColor(displayScore) }}
        />
      </div>
    </div>
  );
}

export default MetricItem;
