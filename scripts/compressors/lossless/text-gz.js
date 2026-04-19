import { computeSHA256, verifySHA256 } from '../../utils/crypto-hash.js';
import { getCompressionRatio, getSpaceSavings, formatBytes } from '../../utils/metrics.js';

/**
 * Resolve the pako library from the global scope.
 * pako is loaded as a <script> tag in popup.html before this module runs.
 */
function getPako() {
    if (typeof window !== 'undefined' && window.pako) return window.pako;
    throw new Error('pako library not found. Ensure lib/pako.min.js is loaded via a <script> tag.');
}

/**
 * Compress a text file using pako gzip (DEFLATE dictionary-based compression).
 * @param   {File}  file  – A text file (.txt, .csv)
 * @returns {Promise<object>} result blob, metrics, and original hash
 */
export async function compressText(file) {
    const pako = getPako();

    // 1. Read file into raw bytes
    const arrayBuffer = await file.arrayBuffer();
    const inputBytes = new Uint8Array(arrayBuffer);
    const originalSize = inputBytes.length;

    // 2. Compute pre-compression SHA-256 hash for lossless verification later
    const originalHash = await computeSHA256(inputBytes);

    // 3. DEFLATE compression via gzip (level 9 = maximum compression)
    const compressed = pako.gzip(inputBytes, { level: 9 });
    const compressedSize = compressed.length;

    return {
        blob: new Blob([compressed], { type: 'application/gzip' }),
        originalHash: originalHash,
        metrics: {
            originalSize: formatBytes(originalSize),
            compressedSize: formatBytes(compressedSize),
            ratio: getCompressionRatio(originalSize, compressedSize),
            savings: getSpaceSavings(originalSize, compressedSize)
        }
    };
}

/**
 * Decompress a gzip-compressed file and verify lossless rebuild via SHA-256.
 * @param   {File}    file          – A gzip-compressed file (.gz)
 * @param   {string}  [expectedHash]  – Optional SHA-256 hash of the original file.
 * @returns {Promise<object>} result blob, metrics, and verification status
 */
export async function decompressText(file, expectedHash = null) {
    const pako = getPako();

    // 1. Read gzipped file
    const arrayBuffer = await file.arrayBuffer();
    const compressedBytes = new Uint8Array(arrayBuffer);
    const compressedSize = compressedBytes.length;

    // 2. Inflate (decompress) via pako.ungzip
    const decompressed = pako.ungzip(compressedBytes);
    const decompressedSize = decompressed.length;

    // 3. SHA-256 verification
    let verification = null;
    if (expectedHash) {
        // We have the hash from the compression step! Verify it perfectly matches.
        verification = await verifySHA256(decompressed, expectedHash);
    } else {
        // If a user uploaded a random .gz file, just compute the hash anyway for their info
        const computedHash = await computeSHA256(decompressed);
        verification = { match: null, computed: computedHash, expected: null };
    }

    // 4. Attempt to detect original filename format
    let outputType = 'text/plain';
    const fileName = file.name || '';
    if (fileName.endsWith('.csv.gz')) {
        outputType = 'text/csv';
    }

    return {
        blob: new Blob([decompressed], { type: outputType }),
        verification: verification,
        metrics: {
            originalSize: formatBytes(compressedSize),     // For decompression, original is the compressed file
            compressedSize: formatBytes(decompressedSize), // And the result is the uncompressed size
            ratio: getCompressionRatio(decompressedSize, compressedSize), 
            savings: getSpaceSavings(decompressedSize, compressedSize)
        }
    };
}