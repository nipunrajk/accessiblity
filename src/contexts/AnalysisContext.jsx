import { createContext, useContext, useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import { STORAGE_KEYS } from '../constants';

// Analysis state reducer
const analysisReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_RESULTS':
      return { ...state, results: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_AI_ANALYSIS':
      return { ...state, aiAnalysis: action.payload };
    case 'SET_AI_LOADING':
      return { ...state, aiLoading: action.payload };
    case 'SET_SCAN_STATS':
      return { ...state, scanStats: action.payload };
    case 'SET_SCANNED_ELEMENTS':
      return { ...state, scannedElements: action.payload };
    case 'SET_ELEMENT_ISSUES':
      return { ...state, elementIssues: action.payload };
    case 'SET_AI_FIXES':
      return { ...state, aiFixes: action.payload };
    case 'SET_WEBSITE_URL':
      return { ...state, websiteUrl: action.payload };
    case 'CLEAR_ALL':
      return {
        ...initialState,
        loading: false,
        aiLoading: false,
      };
    case 'LOAD_PERSISTED_DATA':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const initialState = {
  loading: false,
  results: null,
  error: null,
  aiAnalysis: null,
  aiLoading: false,
  scanStats: {
    pagesScanned: 0,
    totalPages: 0,
    scannedUrls: [],
  },
  scannedElements: [],
  elementIssues: [],
  aiFixes: null,
  websiteUrl: '',
};

const AnalysisContext = createContext();

export function AnalysisProvider({ children }) {
  const [state, dispatch] = useReducer(analysisReducer, initialState);

  // Load persisted data on mount (unless it's a fresh login)
  useEffect(() => {
    const loadPersistedData = () => {
      // Check if this is a fresh login - if so, don't load old data
      const isFreshLogin = sessionStorage.getItem('freshLogin');
      if (isFreshLogin) {
        sessionStorage.removeItem('freshLogin'); // Clear the flag
        console.log('🔄 Fresh login detected - starting with clean state');
        return; // Don't load persisted data
      }

      try {
        const persistedData = {};

        const savedResults = localStorage.getItem(
          STORAGE_KEYS.ANALYSIS_RESULTS
        );
        const savedAiAnalysis = localStorage.getItem(STORAGE_KEYS.AI_ANALYSIS);
        const savedAiFixes = localStorage.getItem(STORAGE_KEYS.AI_FIXES);
        const savedScanStats = localStorage.getItem(STORAGE_KEYS.SCAN_STATS);
        const savedScannedElements = localStorage.getItem(
          STORAGE_KEYS.SCANNED_ELEMENTS
        );
        const savedElementIssues = localStorage.getItem(
          STORAGE_KEYS.ELEMENT_ISSUES
        );
        const savedWebsiteUrl = localStorage.getItem(STORAGE_KEYS.WEBSITE_URL);

        if (savedResults) persistedData.results = JSON.parse(savedResults);
        if (savedAiAnalysis)
          persistedData.aiAnalysis = JSON.parse(savedAiAnalysis);
        if (savedAiFixes) persistedData.aiFixes = JSON.parse(savedAiFixes);
        if (savedScanStats)
          persistedData.scanStats = JSON.parse(savedScanStats);
        if (savedScannedElements)
          persistedData.scannedElements = JSON.parse(savedScannedElements);
        if (savedElementIssues)
          persistedData.elementIssues = JSON.parse(savedElementIssues);
        if (savedWebsiteUrl) persistedData.websiteUrl = savedWebsiteUrl;

        if (Object.keys(persistedData).length > 0) {
          dispatch({ type: 'LOAD_PERSISTED_DATA', payload: persistedData });
          console.log('📊 Restored previous analysis data');
        }
      } catch (error) {
        console.error('Error loading persisted data:', error);
        // Clear corrupted data
        clearPersistedData();
      }
    };

    loadPersistedData();
  }, []);

  // Helper function to persist data
  const persistData = (key, data) => {
    try {
      if (data !== null && data !== undefined) {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (error) {
      console.error(`Error persisting ${key}:`, error);
    }
  };

  // Helper function to clear all persisted data
  const clearPersistedData = () => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  };

  // Auto-persist data when state changes
  useEffect(() => {
    if (state.results)
      persistData(STORAGE_KEYS.ANALYSIS_RESULTS, state.results);
  }, [state.results]);

  useEffect(() => {
    if (state.aiAnalysis)
      persistData(STORAGE_KEYS.AI_ANALYSIS, state.aiAnalysis);
  }, [state.aiAnalysis]);

  useEffect(() => {
    if (state.aiFixes) persistData(STORAGE_KEYS.AI_FIXES, state.aiFixes);
  }, [state.aiFixes]);

  useEffect(() => {
    if (state.scanStats) persistData(STORAGE_KEYS.SCAN_STATS, state.scanStats);
  }, [state.scanStats]);

  useEffect(() => {
    if (state.scannedElements)
      persistData(STORAGE_KEYS.SCANNED_ELEMENTS, state.scannedElements);
  }, [state.scannedElements]);

  useEffect(() => {
    if (state.elementIssues)
      persistData(STORAGE_KEYS.ELEMENT_ISSUES, state.elementIssues);
  }, [state.elementIssues]);

  useEffect(() => {
    if (state.websiteUrl)
      localStorage.setItem(STORAGE_KEYS.WEBSITE_URL, state.websiteUrl);
  }, [state.websiteUrl]);

  // Method to clear all analysis data (useful for logout/login)
  const clearAllAnalysisData = () => {
    dispatch({ type: 'CLEAR_ALL' });
    clearPersistedData();
  };

  const contextValue = {
    ...state,
    dispatch,
    clearPersistedData,
    clearAllAnalysisData,
  };

  return (
    <AnalysisContext.Provider value={contextValue}>
      {children}
    </AnalysisContext.Provider>
  );
}

AnalysisProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAnalysisContext() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error(
      'useAnalysisContext must be used within an AnalysisProvider'
    );
  }
  return context;
}
