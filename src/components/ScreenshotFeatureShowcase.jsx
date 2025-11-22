import { useState } from 'react';
import IssueScreenshot from './IssueScreenshot';
import BeforeAfterComparison from './BeforeAfterComparison';

function ScreenshotFeatureShowcase({ websiteUrl }) {
  const [activeDemo, setActiveDemo] = useState('screenshot');

  const demoIssue = {
    title: 'Missing alt text for images',
    type: 'accessibility',
    selector: 'img.hero-image',
    description:
      'Images on the homepage lack descriptive alt text, making them inaccessible to screen readers.',
  };

  return (
    <div className='bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-8'>
      <div className='text-center mb-6'>
        <h3 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
          🎯 Visual Issue Detection
        </h3>
        <p className='text-gray-600 dark:text-gray-300'>
          See exactly where issues exist on your website with highlighted
          screenshots and before/after comparisons
        </p>
      </div>

      {/* Demo Toggle */}
      <div className='flex justify-center mb-6'>
        <div className='bg-white dark:bg-gray-800 rounded-lg p-1 flex'>
          <button
            onClick={() => setActiveDemo('screenshot')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeDemo === 'screenshot'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            📸 Issue Screenshot
          </button>
          <button
            onClick={() => setActiveDemo('comparison')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeDemo === 'comparison'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            🔄 Before/After
          </button>
        </div>
      </div>

      {/* Demo Content */}
      <div className='max-w-2xl mx-auto'>
        {activeDemo === 'screenshot' ? (
          <IssueScreenshot
            issue={demoIssue}
            websiteUrl={websiteUrl || 'https://example.com'}
          />
        ) : (
          <BeforeAfterComparison title='Fix: Missing alt text for images' />
        )}
      </div>

      {/* Feature Benefits */}
      <div className='mt-8 grid md:grid-cols-3 gap-4 text-center'>
        <div className='bg-white dark:bg-gray-800/50 rounded-lg p-4'>
          <div className='text-2xl mb-2'>🎯</div>
          <h4 className='font-semibold text-gray-900 dark:text-white mb-1'>
            Precise Location
          </h4>
          <p className='text-sm text-gray-600 dark:text-gray-300'>
            See exactly where issues exist
          </p>
        </div>
        <div className='bg-white dark:bg-gray-800/50 rounded-lg p-4'>
          <div className='text-2xl mb-2'>📊</div>
          <h4 className='font-semibold text-gray-900 dark:text-white mb-1'>
            Visual Proof
          </h4>
          <p className='text-sm text-gray-600 dark:text-gray-300'>
            Before/after comparisons
          </p>
        </div>
        <div className='bg-white dark:bg-gray-800/50 rounded-lg p-4'>
          <div className='text-2xl mb-2'>⚡</div>
          <h4 className='font-semibold text-gray-900 dark:text-white mb-1'>
            Faster Fixes
          </h4>
          <p className='text-sm text-gray-600 dark:text-gray-300'>
            No guessing what to fix
          </p>
        </div>
      </div>
    </div>
  );
}

export default ScreenshotFeatureShowcase;
