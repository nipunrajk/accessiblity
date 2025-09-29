function ErrorState({ error }) {
  return (
    <div className='max-w-2xl mx-auto'>
      <div className='bg-red-50 border border-red-200 rounded-2xl p-6'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 bg-red-100 rounded-full flex items-center justify-center'>
            <svg
              className='w-4 h-4 text-red-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <p className='text-red-800 font-medium'>{error}</p>
        </div>
      </div>
    </div>
  );
}

export default ErrorState;
