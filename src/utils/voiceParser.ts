import type { CommodityCategory, LanguageCode, QualityGrade } from '../types/agridirect';

export interface ParsedVoiceListing {
  category: CommodityCategory;
  cropKey: 'peanuts' | 'toor_dal' | 'jowar' | 'chilli' | 'ragi' | 'general';
  title: {
    en: string;
    hi: string;
    kn: string;
  };
  weightKg: number;
  wholesalePrice: number;
  retailPrice: number;
  normalPrice: number;
  bulkPrice: number;
  qualityGrade: QualityGrade;
  shelfLifeMonths: number;
  rawTranscript: string;
}

// Preset metadata for matched crops
const CROP_METADATA: Record<
  string,
  {
    category: CommodityCategory;
    title: { en: string; hi: string; kn: string };
    defaultShelfLife: number;
    grade: QualityGrade;
    defaultWholesale: number;
    defaultRetail: number;
  }
> = {
  peanuts: {
    category: 'PEANUTS_OILSEEDS',
    title: {
      en: 'Farm-Fresh Bold Shelled Peanuts',
      hi: 'ताज़ा बोल्ड मूंगफली दाना',
      kn: 'ತಾಜಾ ಶೇಂಗಾ ಕಾಳು',
    },
    defaultShelfLife: 8,
    grade: 'GRADE_A_BOLD',
    defaultWholesale: 12,
    defaultRetail: 38,
  },
  toor_dal: {
    category: 'PULSES_DALS',
    title: {
      en: 'Unpolished Organic Toor Dal',
      hi: 'बिना पॉलिश की शुद्ध तूर दाल',
      kn: 'ಪಾಲಿಶ್ ಮಾಡದ ಶುದ್ಧ ತೊಗರಿ ಬೇಳೆ',
    },
    defaultShelfLife: 12,
    grade: 'ORGANIC_UNPOLISHED',
    defaultWholesale: 75,
    defaultRetail: 155,
  },
  jowar: {
    category: 'GRAINS_MILLETS',
    title: {
      en: 'Gadag Maldandi White Jowar',
      hi: 'गदग मालदंडी सफेद ज्वार',
      kn: 'ಗದಗ ಮಾಲ್ದಂಡಿ ಬಿಳಿ ಜೋಳ',
    },
    defaultShelfLife: 10,
    grade: 'STANDARD',
    defaultWholesale: 24,
    defaultRetail: 58,
  },
  chilli: {
    category: 'DRY_SPICES',
    title: {
      en: 'Sun-Dried Byadagi Dry Chillies',
      hi: 'धूप में सुखाई गई ब्याडगी लाल मिर्च',
      kn: 'ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ಬ್ಯಾಡಗಿ ಒಣ ಮೆಣಸಿನಕಾಯಿ',
    },
    defaultShelfLife: 14,
    grade: 'GRADE_A_BOLD',
    defaultWholesale: 160,
    defaultRetail: 340,
  },
  ragi: {
    category: 'GRAINS_MILLETS',
    title: {
      en: 'Organic Finger Millet (Ragi)',
      hi: 'जैविक रागी (नाचनी)',
      kn: 'ಸಾವಯವ ಕೆಂಪು ರಾಗಿ',
    },
    defaultShelfLife: 12,
    grade: 'ORGANIC_UNPOLISHED',
    defaultWholesale: 28,
    defaultRetail: 65,
  },
};

/**
 * Parses numbers and identifies keywords from audio transcripts
 */
export function parseVoiceTranscript(
  transcript: string,
  _lang: LanguageCode
): ParsedVoiceListing {
  const lower = transcript.toLowerCase();

  // 1. Detect Crop Keyword
  let detectedCrop: 'peanuts' | 'toor_dal' | 'jowar' | 'chilli' | 'ragi' | 'general' = 'peanuts';

  if (/(peanut|groundnut|मूंगफली|शेंगदाणा|ಶೇಂಗಾ|ಕಡಲೆಕಾಯಿ)/i.test(lower)) {
    detectedCrop = 'peanuts';
  } else if (/(toor|arhar|dal|तूर|अरहर|दाल|ತೊಗರಿ|ಬೇಳೆ)/i.test(lower)) {
    detectedCrop = 'toor_dal';
  } else if (/(jowar|sorghum|ज्वार|ಜೋಳ)/i.test(lower)) {
    detectedCrop = 'jowar';
  } else if (/(chilli|mirchi|मिर्च|ಮೆಣಸಿನಕಾಯಿ|ಬ್ಯಾಡಗಿ)/i.test(lower)) {
    detectedCrop = 'chilli';
  } else if (/(ragi|millet|रागी|ರಾಗಿ)/i.test(lower)) {
    detectedCrop = 'ragi';
  }

  const meta = CROP_METADATA[detectedCrop] || CROP_METADATA.peanuts;

  // 2. Extract Numbers for Weight (kg / किलो / ಕೆಜಿ / क्विंटल)
  let weightKg = 100; // sensible default
  const weightMatch = lower.match(
    /(\d+)\s*(?:kg|kgs|किलो|किग्रा|ಕೆಜಿ|quintal|क्विंटल|ಕ್ವಿಂಟಾಲ್)/i
  );
  if (weightMatch) {
    const val = parseInt(weightMatch[1], 10);
    if (/quintal|क्विंटल|ಕ್ವಿಂಟಾಲ್/i.test(weightMatch[0])) {
      weightKg = val * 100;
    } else {
      weightKg = val;
    }
  } else {
    // Check if there is any first number that represents quantity
    const genericNum = lower.match(/\b(\d{2,4})\b/);
    if (genericNum) {
      weightKg = parseInt(genericNum[1], 10);
    }
  }

  // 3. Extract Price mentions if spoken
  // e.g. "rate 24", "normal 25", "price 24", "24 rupees", "24 रुपये", "24 ರೂಪಾಯಿ"
  let wholesale = meta.defaultWholesale;
  let retail = meta.defaultRetail;

  // Extract any numbers that look like prices
  const priceMatches = Array.from(
    lower.matchAll(/(?:₹|rs\.?|rupees|दर|भाव|ರೂ|ರೂಪಾಯಿ)?\s*(\d{2,3})\s*(?:₹|rs\.?|rupees|रुपये|ರೂ|ರೂಪಾಯಿ|\/kg|प्रति|ಪ್ರತಿ)?/gi)
  ).map((m) => parseInt(m[1], 10)).filter((n) => n > 10 && n !== weightKg);

  if (priceMatches.length >= 2) {
    wholesale = Math.min(priceMatches[0], priceMatches[1]);
    retail = Math.max(priceMatches[0], priceMatches[1]);
  } else if (priceMatches.length === 1) {
    // If only one price is mentioned, assume it's normal price or wholesale
    wholesale = priceMatches[0];
  }

  // Calculate direct & group prices using standard formula
  const normalPrice = Math.round((wholesale + retail) / 2);
  const bulkPrice = Math.round(normalPrice * 0.9);

  return {
    category: meta.category,
    cropKey: detectedCrop,
    title: meta.title,
    weightKg: weightKg || 200,
    wholesalePrice: wholesale,
    retailPrice: retail,
    normalPrice,
    bulkPrice,
    qualityGrade: meta.grade,
    shelfLifeMonths: meta.defaultShelfLife,
    rawTranscript: transcript,
  };
}

/**
 * Returns realistic demo farmer voice commands for simulation testing
 */
export function getSimulatedFarmerVoice(lang: LanguageCode): {
  transcript: string;
  parsed: ParsedVoiceListing;
} {
  switch (lang) {
    case 'hi': {
      const transcript =
        'नमस्ते, मैं 200 किलो ताज़ा मूंगफली दाना बेचना चाहता हूँ। थोक व्यापारी दर 12 रुपये और बाज़ार भाव 38 रुपये है।';
      return {
        transcript,
        parsed: parseVoiceTranscript(transcript, 'hi'),
      };
    }
    case 'kn': {
      const transcript =
        'ನಮಸ್ಕಾರ, ನನ್ನ ಬಳಿ 250 ಕೆಜಿ ತಾಜಾ ಶೇಂಗಾ ಕಾಳು ಮಾರಾಟಕ್ಕಿದೆ. ಮಾರುಕಟ್ಟೆ ಸಗಟು ದರ 12 ರೂಪಾಯಿ ಮತ್ತು ಚಿಲ್ಲರೆ ದರ 38 ರೂಪಾಯಿ.';
      return {
        transcript,
        parsed: parseVoiceTranscript(transcript, 'kn'),
      };
    }
    case 'en':
    default: {
      const transcript =
        'Hello, I want to list 200 kg of fresh bold peanuts. Middleman wholesale rate is 12 rupees and retail rate is 38 rupees.';
      return {
        transcript,
        parsed: parseVoiceTranscript(transcript, 'en'),
      };
    }
  }
}

