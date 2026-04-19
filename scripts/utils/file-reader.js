/**
 * file-reader.js
 * ──────────────────────────────────────────────────────────────────
 * Manages the data pipeline between the UI and the compression engines.
 * Safely reads files into memory as ArrayBuffers.
 * * Assigned to: Lavisha (Data Pipeline & Routing)
 * ──────────────────────────────────────────────────────────────────
 */

export class FileProcessor {
    
    /**
     * Safely reads a File object into an ArrayBuffer for manipulation.
     * @param {File} file - The uploaded file object
     * @returns {Promise<ArrayBuffer>} - The raw binary data of the file
     */
    static async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Error reading file into memory."));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Fallback router for decompression.
     * Identifies the file type and passes the raw buffer back for formats
     * that do not require complex algorithmic reconstruction (like Audio/PNG).
     * * @param {File} file - The file to route
     * @returns {Promise<Object>} - The buffer and metadata
     */
    static async routeDecompression(file) {
        const buffer = await this.readFile(file);
        
        // Extract the extension safely, defaulting to bin if none exists
        const parts = file.name.split('.');
        const extension = parts.length > 1 ? parts.pop().toLowerCase() : 'bin';

        console.log(`[FileProcessor] Routing decompression fallback for: .${extension}`);

        switch (extension) {
            case 'txt':
            case 'csv':
            case 'gz':
                return { data: buffer, type: 'text', method: 'Pako' };
            case 'png':
                return { data: buffer, type: 'image/png', method: 'UPNG.js (Pass-through)' };
            case 'jpg':
            case 'jpeg':
                return { data: buffer, type: 'image/jpeg', method: 'JPEG-js' };
            case 'mp3':
            case 'wav':
                return { data: buffer, type: 'audio', method: 'LameJS (Pass-through)' };
            case 'mp4':
                return { data: buffer, type: 'video', method: 'FFmpeg' };
            default:
                throw new Error(`Format (.${extension}) not supported for decompression.`);
        }
    }
}