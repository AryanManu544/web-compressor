import { getCompressionRatio, getSpaceSavings, formatBytes } from '../../utils/metrics.js';

// Safe getter for the global UPNG object
function getUPNG() {
    const lib = window.UPNG || window.upng;
    if (!lib) {
        throw new Error('UPNG library not found. Ensure lib/upng.min.js is loaded in popup.html before dom-handler.js.');
    }
    return lib;
}

/**
 * Compresses a PNG buffer losslessly using UPNG.js.
 * @param {File} file - The original PNG File object from the UI
 * @returns {Promise<Object>} - The blob and metrics for the UI
 */
export async function compressLosslessPNG(file) {
  try {
    const upng = getUPNG(); // Use the safe getter
    
    const arrayBuffer = await file.arrayBuffer();
    
    // Decode the initial array buffer
    const decodedImg = upng.decode(arrayBuffer);

    // Extract dimensions
    const width = decodedImg.width;
    const height = decodedImg.height;

    // Extract all RGBA pixel frames
    const frames = upng.toRGBA8(decodedImg);

    // Re-encode the frames losslessly (0 is strictly required for lossless)
    const compressedBuffer = upng.encode(frames, width, height, 0);
    
    // Wrap in a Blob for the download link
    const blob = new Blob([compressedBuffer], { type: 'image/png' });

    // Return the standard object your dom-handler.js expects
    return {
      blob: blob,
      metrics: {
        originalSize: formatBytes(file.size),
        compressedSize: formatBytes(blob.size),
        ratio: getCompressionRatio(file.size, blob.size),
        savings: getSpaceSavings(file.size, blob.size)
      }
    };
  } catch (error) {
    console.error('Failed to compress PNG losslessly:', error);
    throw error;
  }
}