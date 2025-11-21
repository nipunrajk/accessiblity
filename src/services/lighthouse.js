import apiService from './api';
import { ERROR_MESSAGES } from '../constants';

export async function runLighthouseAnalysis(url, onProgress) {
  try {
    const response = await apiService.request('/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        url,
        includeAxe: true, // Enable Axe-Core analysis
        includeAI: true, // Keep AI analysis enabled
      }),
    });

    if (!response.ok) {
      throw new Error(ERROR_MESSAGES.ANALYSIS_FAILED);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = ''; // Buffer to handle incomplete chunks

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split on double newlines and process complete messages
      const lines = buffer.split('\n\n');
      // Keep the last potentially incomplete chunk in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() && line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6).trim();

            // Validate JSON structure
            if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
              console.error('Malformed JSON structure:', {
                starts_with: jsonStr.substring(0, 1),
                ends_with: jsonStr.substring(jsonStr.length - 1),
                length: jsonStr.length,
              });
              continue; // Skip this malformed chunk
            }

            const data = JSON.parse(jsonStr);

            if (data.error) {
              console.error('Backend error:', data.error);
              throw new Error(`Backend error: ${data.error}`);
            }

            if (data.done) {
              return {
                // Combined scores (if Axe is enabled)
                scores: data.scores || {
                  lighthouse: data.accessibility?.score || 0,
                  axe: 0,
                  combined: data.accessibility?.score || 0,
                  grade: 'F',
                },
                performance: {
                  score: data.performance?.score || 0,
                  issues: data.performance?.issues || [],
                  metrics: data.performance?.metrics || {},
                },
                accessibility: {
                  score:
                    data.accessibility?.score || data.scores?.combined || 0,
                  issues: data.accessibility?.issues || [],
                  violations: data.accessibility?.violations || [],
                  incomplete: data.accessibility?.incomplete || [],
                  passes: data.accessibility?.passes || [],
                  wcagCompliance: data.accessibility?.wcagCompliance || null,
                },
                bestPractices: {
                  score: data.bestPractices?.score || 0,
                  issues: data.bestPractices?.issues || [],
                },
                seo: {
                  score: data.seo?.score || 0,
                  issues: data.seo?.issues || [],
                },
                scanStats: {
                  pagesScanned: data.scanStats?.pagesScanned || 0,
                  totalPages: data.scanStats?.totalPages || 0,
                  scannedUrls: data.scanStats?.scannedUrls || [],
                },
                axeEnabled: data.axeEnabled || false,
              };
            }

            // Handle progress updates
            if (onProgress && data.pagesScanned !== undefined) {
              onProgress(data);
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
            if (e instanceof SyntaxError) {
              const jsonStr = line.slice(6);
              const errorPos = e.message.match(/position (\d+)/)?.[1];
              const pos = parseInt(errorPos) || 0;

              console.error('Error details:', {
                message: e.message,
                position: pos,
                totalLength: jsonStr.length,
                nearError: jsonStr.substring(
                  Math.max(0, pos - 100),
                  Math.min(jsonStr.length, pos + 100)
                ),
              });

              // Continue instead of throwing to handle partial updates
              continue;
            }
            throw e;
          }
        }
      }
    }
  } catch (error) {
    console.error('Lighthouse analysis failed:', error);
    throw new Error(`Failed to analyze website: ${error.message}`);
  }
}
