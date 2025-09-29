import { useState, useEffect } from 'react';
import aiProvider from '../services/aiProvider.js';

function AIProviderSettings({ onProviderChange }) {
  const [currentProvider, setCurrentProvider] = useState('openai');
  const [providerInfo, setProviderInfo] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const info = aiProvider.getProviderInfo();
    setProviderInfo(info);
    setCurrentProvider(info.provider);
  }, []);

  const providers = [
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'GPT models (GPT-3.5, GPT-4)',
      icon: '🤖',
      requiresKey: true,
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      description: 'Claude 3 models (Haiku, Sonnet, Opus)',
      icon: '🧠',
      requiresKey: true,
    },
    {
      id: 'google',
      name: 'Google Gemini',
      description: 'Gemini Pro and Ultra models',
      icon: '🔍',
      requiresKey: true,
    },
    {
      id: 'groq',
      name: 'Groq',
      description: 'Fast inference with Mixtral, Llama',
      icon: '⚡',
      requiresKey: true,
    },
    {
      id: 'ollama',
      name: 'Ollama (Local)',
      description: 'Run models locally (Llama, Mistral, etc.)',
      icon: '🏠',
      requiresKey: false,
    },
  ];

  const handleProviderSelect = (providerId) => {
    // Note: In a real implementation, you'd need to reload the page or
    // reinitialize the AI provider with new environment variables
    alert(
      `To switch to ${providerId}, please update your .env file with VITE_AI_PROVIDER=${providerId} and restart the application.`
    );
    setIsOpen(false);
  };

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors'
        title='AI Provider Settings'
      >
        <svg
          className='w-4 h-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M13 10V3L4 14h7v7l9-11h-7z'
          />
        </svg>
        <span className='text-sm font-medium'>
          {providerInfo ? providerInfo.provider : 'AI'}
        </span>
        <svg
          className={`w-3 h-3 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M19 9l-7 7-7-7'
          />
        </svg>
      </button>

      {isOpen && (
        <div className='absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50'>
          <div className='p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              AI Provider
            </h3>

            {providerInfo && (
              <div className='mb-6 p-4 bg-gray-50 rounded-xl'>
                <div className='text-sm text-gray-700'>
                  <div className='font-medium'>{providerInfo.provider}</div>
                  <div className='text-gray-500'>{providerInfo.model}</div>
                  {providerInfo.isLocal && (
                    <span className='inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full'>
                      Local
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className='space-y-3'>
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderSelect(provider.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    currentProvider === provider.id
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className='flex items-center gap-3'>
                    <span className='text-lg'>{provider.icon}</span>
                    <div className='flex-1'>
                      <div className='font-medium text-gray-900'>
                        {provider.name}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {provider.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className='mt-6 p-4 bg-amber-50 rounded-xl'>
              <div className='text-sm text-amber-800'>
                Update your .env file and restart to change providers.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIProviderSettings;
