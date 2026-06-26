import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScreenshots } from '../../hooks/useScreenshots';
import screenshotService from '../../services/screenshotService';

vi.mock('../../services/screenshotService', () => ({
  default: {
    captureIssueWiseScreenshots: vi.fn(),
    captureWithHighlights: vi.fn(),
    downloadScreenshot: vi.fn(),
  },
}));

describe('useScreenshots Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default states', () => {
    const { result } = renderHook(() => useScreenshots());
    expect(result.current.loading).toBe(false);
    expect(result.current.screenshots).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  describe('captureIssueScreenshots', () => {
    it('should successfully capture screenshots and update state', async () => {
      const mockResult = {
        success: true,
        screenshots: [{ screenshot: 'data:image/png;base64,123', filename: 'test.png' }],
      };
      screenshotService.captureIssueWiseScreenshots.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useScreenshots());

      let captureResult;
      await act(async () => {
        captureResult = await result.current.captureIssueScreenshots('https://example.com', []);
      });

      expect(screenshotService.captureIssueWiseScreenshots).toHaveBeenCalled();
      expect(result.current.screenshots).toEqual(mockResult.screenshots);
      expect(result.current.loading).toBe(false);
      expect(captureResult).toEqual(mockResult);
    });

    it('should handle failure and set error state', async () => {
      screenshotService.captureIssueWiseScreenshots.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useScreenshots());

      await act(async () => {
        await expect(
          result.current.captureIssueScreenshots('https://example.com', [])
        ).rejects.toThrow('API Error');
      });

      expect(result.current.error).toBe('API Error');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('captureWithHighlights', () => {
    it('should successfully capture highlighted screenshot', async () => {
      const mockResult = { success: true, screenshot: 'data:image/png;base64,123' };
      screenshotService.captureWithHighlights.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useScreenshots());

      let captureResult;
      await act(async () => {
        captureResult = await result.current.captureWithHighlights('https://example.com', []);
      });

      expect(screenshotService.captureWithHighlights).toHaveBeenCalled();
      expect(captureResult).toEqual(mockResult);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('download functions', () => {
    it('should call downloadScreenshot on service', () => {
      const { result } = renderHook(() => useScreenshots());
      const mockScreenshot = { screenshot: 'data123', filename: 'test.png' };

      act(() => {
        result.current.downloadScreenshot(mockScreenshot);
      });

      expect(screenshotService.downloadScreenshot).toHaveBeenCalledWith('data123', 'test.png');
    });

    it('should clear screenshots and error states', () => {
      const { result } = renderHook(() => useScreenshots());

      act(() => {
        result.current.clearScreenshots();
      });

      expect(result.current.screenshots).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });
});
