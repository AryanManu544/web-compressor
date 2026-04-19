export class FileProcessor {
    static async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Error reading file into memory."));
            reader.readAsArrayBuffer(file);
        });
    }

    static async routeDecompression(file) {
        const buffer = await this.readFile(file);

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
            case 'pdf':
                return { data: buffer, type: 'application/pdf', method: 'Pass-through' };
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