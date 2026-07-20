import Tesseract from 'tesseract.js';

const metricMatchers = {
  ph: [
    /(?:^|[^a-z])p\s*\.?\s*h(?:\s*(?:value|level))?\s*[:-]?\s*([0-9]+(?:\.[0-9]+)?)/i,
    /(?:^|\s)ph\s*[:-]?\s*([0-9]+(?:\.[0-9]+)?)/i,
  ],
  nitrogen: [
    /(?:nitrogen|available\s*n|\bn\b)\s*[:-]?\s*([0-9]+(?:\.[0-9]+)?)/i,
  ],
  phosphorus: [
    /(?:phosphorus|available\s*p|\bp\b)\s*[:-]?\s*([0-9]+(?:\.[0-9]+)?)/i,
  ],
  potassium: [
    /(?:potassium|available\s*k|\bk\b)\s*[:-]?\s*([0-9]+(?:\.[0-9]+)?)/i,
  ],
  organic_carbon: [
    /(?:organic\s*carbon|organic\s*c|\boc\b)\s*[:-]?\s*([0-9]+(?:\.[0-9]+)?)/i,
  ],
  ec: [/(?:electrical\s*conductivity|\bec\b)\s*[:-]?\s*([0-9]+(?:\.[0-9]+)?)/i],
  sulfur: [/(?:sulphur|sulfur|\bs\b)\s*[:-]?\s*([0-9]+(?:\.[0-9]+)?)/i],
  zinc: [/(?:zinc|\bzn\b)\s*[:-]?\s*([0-9]+(?:\.[0-9]+)?)/i],
  iron: [/(?:iron|\bfe\b)\s*[:-]?\s*([0-9]+(?:\.[0-9]+)?)/i],
  copper: [/(?:copper|\bcu\b)\s*[:-]?\s*([0-9]+(?:\.[0-9]+)?)/i],
  manganese: [/(?:manganese|\bmn\b)\s*[:-]?\s*([0-9]+(?:\.[0-9]+)?)/i],
  boron: [/(?:boron|\bb\b)\s*[:-]?\s*([0-9]+(?:\.[0-9]+)?)/i],
};

const normalizeText = (text) => text.replace(/[|]/g, ' ').replace(/\s+/g, ' ').trim();

const emitProgress = (onProgress, update) => {
  if (typeof onProgress === 'function') {
    onProgress(update);
  }
};

const extractValue = (text, regexes) => {
  for (const regex of regexes) {
    const match = text.match(regex);
    if (match?.[1]) {
      const parsed = Number.parseFloat(match[1]);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

const parseSoilValues = (rawText) => {
  const text = normalizeText(rawText).toLowerCase();

  const values = Object.fromEntries(Object.entries(metricMatchers).map(([key, matchers]) => [key, extractValue(text, matchers)]));
  const confidence = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value === null ? 0 : 0.6]));
  return { ...values, confidence, raw_text: rawText, notes: 'On-device OCR only. Please verify every value against the card.' };
};

/**
 * Perform 100% Client-Side OCR on the provided image base64 data.
 * @param {string} base64Data - Base64 encoded image string (without data URI prefix).
 * @param {function} onProgress - Callback for OCR progress updates.
 * @returns {Promise<Object>} JSON containing extracted soil parameters.
 */
export const performLocalOCR = async (base64Data, onProgress = null) => {
  const imageSrc = `data:image/jpeg;base64,${base64Data}`;
  let worker;

  try {
    emitProgress(onProgress, {
      stage: 'initializing',
      progress: 0.05,
      message: 'Initializing Scanner...',
    });

    worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        if (typeof onProgress !== 'function') {
          return;
        }

        if (
          m.status === 'loading tesseract core' ||
          m.status === 'loading tesseract language' ||
          m.status === 'initializing tesseract' ||
          m.status === 'loading language traineddata'
        ) {
          emitProgress(onProgress, {
            stage: 'initializing',
            progress: Math.min((m.progress || 0) * 0.25, 0.2),
            message: 'Initializing Scanner...',
          });
          return;
        }

        if (m.status === 'recognizing text') {
          emitProgress(onProgress, {
            stage: 'reading',
            progress: 0.2 + ((m.progress || 0) * 0.75),
            message: 'Reading Text...',
          });
        }
      },
    });

    emitProgress(onProgress, {
      stage: 'reading',
      progress: 0.25,
      message: 'Reading Text...',
    });

    const { data: { text } } = await worker.recognize(imageSrc);

    emitProgress(onProgress, {
      stage: 'parsing',
      progress: 0.95,
      message: 'Extracting Values...',
    });

    return parseSoilValues(text);
  } catch (error) {
    console.error('Local OCR Failed:', error);
    throw error;
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (terminateError) {
        console.warn('Failed to terminate OCR worker cleanly:', terminateError);
      }
    }
  }
};
