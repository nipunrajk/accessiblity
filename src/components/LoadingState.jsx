function LoadingState({ scanStats = {} }) {
  const { pagesScanned = 0, totalPages = 0 } = scanStats;

  return (
    <div className='max-w-2xl mx-auto'>
      <div className='bg-white border border-gray-200 rounded-2xl p-8 text-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4'></div>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
          {pagesScanned > 0 ? 'Analyzing Website' : 'Loading...'}
        </h3>
        {pagesScanned > 0 && (
          <>
            <p className='text-gray-600 mb-4'>
              Scanning {pagesScanned} of {totalPages || '?'} pages
            </p>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-black h-2 rounded-full transition-all duration-300'
                style={{
                  width: `${
                    totalPages ? (pagesScanned / totalPages) * 100 : 0
                  }%`,
                }}
              ></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default LoadingState;
