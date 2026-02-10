import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Set PDF worker source (using CDN for simplicity in Vite without ejecting config)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const extractTextFromDocument = async (file: File): Promise<string> => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    try {
        // 1. Images (OCR)
        if (fileType.startsWith('image/')) {
            return await extractTextFromImage(file);
        }

        // 2. PDF
        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            return await extractTextFromPDF(file);
        }

        // 3. Word (.docx)
        if (
            fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            fileName.endsWith('.docx')
        ) {
            return await extractTextFromWord(file);
        }

        // 4. Excel (.xlsx, .xls)
        if (
            fileType.includes('spreadsheet') ||
            fileType.includes('excel') ||
            fileName.endsWith('.xlsx') ||
            fileName.endsWith('.xls')
        ) {
            return await extractTextFromExcel(file);
        }

        return `[Unsupported file format: ${fileName}]`;

    } catch (error) {
        console.error("Error parsing file:", error);
        return `[Error extracting text from ${fileName}: ${(error as Error).message}]`;
    }
};

const extractTextFromImage = async (file: File): Promise<string> => {
    const { data: { text } } = await Tesseract.recognize(
        file,
        'eng',
        {
            logger: m => console.log(m) // Optional: log progress
        }
    );
    return text.trim();
};

const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            // @ts-ignore - 'str' exists on TextItem
            .map((item: any) => item.str)
            .join(' ');
        fullText += pageText + '\n';
    }

    return fullText.trim();
};

const extractTextFromWord = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
};

const extractTextFromExcel = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    let fullText = '';
    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        // Convert sheet to text (tab separated mostly)
        const sheetText = XLSX.utils.sheet_to_txt(sheet);
        fullText += `[Sheet: ${sheetName}]\n${sheetText}\n`;
    });

    return fullText.trim();
};
