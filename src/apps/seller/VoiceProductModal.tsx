import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Camera,
  X,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Truck,
  Layers,
  Upload,
  Image as ImageIcon,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  Info,
  Droplet,
  Calendar,
  Package,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Bot,
  AlertOctagon,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';
import { CommodityCategory, QualityGrade } from '../../types/agridirect';
import {
  calculateRecommendedPrices,
  validateCustomPrices,
} from '../../utils/pricing';
import {
  getSimulatedFarmerVoice,
  parseVoiceTranscript,
} from '../../utils/voiceParser';
import {
  verifyCropPhotoWithGemini,
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  GeminiVerificationResult,
} from '../../services/geminiVerification';

interface VoiceProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_PHOTOS: { label: string; url: string; category: CommodityCategory; note: string }[] = [
  {
    label: 'Groundnuts / Peanuts (Bold Kernel)',
    url: 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?w=800&auto=format&fit=crop&q=80',
    category: 'PEANUTS_OILSEEDS',
    note: 'Grade A Sun-dried pods',
  },
  {
    label: 'Toor Dal (Unpolished Farm Batch)',
    url: 'https://images.unsplash.com/photo-1585994192701-f1a505c8574a?w=800&auto=format&fit=crop&q=80',
    category: 'PULSES_DALS',
    note: 'Zero chemical polish',
  },
  {
    label: 'Byadgi Dry Red Chillies',
    url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80',
    category: 'DRY_SPICES',
    note: 'Crisp sun-dried whole chillies',
  },
  {
    label: 'White Jowar Grain (Maldandi)',
    url: 'https://images.unsplash.com/photo-1627834377411-8da5f4f09de8?w=800&auto=format&fit=crop&q=80',
    category: 'GRAINS_MILLETS',
    note: 'Pest-free cleaned grain',
  },
  {
    label: 'Organic Ragi / Finger Millet',
    url: 'https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=800&auto=format&fit=crop&q=80',
    category: 'GRAINS_MILLETS',
    note: 'High-calcium native variety',
  },
];

export const VoiceProductModal: React.FC<VoiceProductModalProps> = ({ isOpen, onClose }) => {
  const { language, t, currentUser, addProduct } = useAgridirect();

  // Wizard Step State: 1 = Item & Quality Details, 2 = Actual Product Photo
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const [isListening, setIsListening] = useState(false);
  const [speechFeedback, setSpeechFeedback] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Step 1: Form Fields - About the Item & Quality
  const [category, setCategory] = useState<CommodityCategory>('PEANUTS_OILSEEDS');
  const [titleEn, setTitleEn] = useState('Farm-Fresh Bold Shelled Peanuts');
  const [titleHi, setTitleHi] = useState('ताज़ा बोल्ड मूंगफली दाना');
  const [titleKn, setTitleKn] = useState('ತಾಜಾ ಶೇಂಗಾ ಕಾಳು');

  const [descEn, setDescEn] = useState('High oil content, sun-dried naturally on our farm. Sorted by hand.');
  const [descHi, setDescHi] = useState('प्राकृतिक रूप से धूप में सुखाई गई उच्च गुणवत्ता वाली फसल। हाथ से छंटी हुई।');
  const [descKn, setDescKn] = useState('ಸ್ವಾಭಾವಿಕವಾಗಿ ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿದ ಶ್ರೇಷ್ಠ ಬೆಳೆ. ಕೈಯಿಂದ ಆರಿಸಲಾದ ಧಾನ್ಯ.');

  const [harvestMonthYear, setHarvestMonthYear] = useState('Oct 2026');
  const [qualityGrade, setQualityGrade] = useState<QualityGrade>('GRADE_A_BOLD');
  const [moisturePercent, setMoisturePercent] = useState<number>(8); // Safe dry storage < 10%
  const [shelfLifeMonths, setShelfLifeMonths] = useState<number>(8); // Must be >= 3
  const [availableStockKg, setAvailableStockKg] = useState<number>(200);

  // Pricing Fields
  const [wholesaleRate, setWholesaleRate] = useState<number>(12);
  const [retailRate, setRetailRate] = useState<number>(38);
  const [normalPrice, setNormalPrice] = useState<number>(25);
  const [bulkPrice, setBulkPrice] = useState<number>(22);
  const [bulkMinQty, setBulkMinQty] = useState<number>(50);
  const [bulkMaxQty, setBulkMaxQty] = useState<number>(150);

  // Location & Delivery Setup
  const [pickupLocation, setPickupLocation] = useState(
    currentUser?.locationName || 'Patil Farmyard, Hubballi Rural'
  );
  const [pickupPincode, setPickupPincode] = useState(currentUser?.pincode || '580024');
  const [allowHomeDelivery, setAllowHomeDelivery] = useState(true);
  const [deliveryBaseFee, setDeliveryBaseFee] = useState(20);
  const [deliveryRatePerKm, setDeliveryRatePerKm] = useState(2.5);
  const [deliveryRatePerKg, setDeliveryRatePerKg] = useState(0.5);

  // Step 2: Photo Field (Actual Product Photo)
  const [photoUrl, setPhotoUrl] = useState(PRESET_PHOTOS[0].url);
  const [isPhotoUploaded, setIsPhotoUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Gemini API Key & AI Authenticity State
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [tempApiKeyInput, setTempApiKeyInput] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [showKeySecret, setShowKeySecret] = useState<boolean>(false);
  const [keySavedFeedback, setKeySavedFeedback] = useState<boolean>(false);

  // AI Verification Status
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<GeminiVerificationResult | null>(null);

  // Reset states on opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setErrorMessage('');
      const storedKey = getStoredGeminiApiKey();
      setGeminiApiKey(storedKey);
      setTempApiKeyInput(storedKey);
      setShowApiKeyInput(!storedKey);
      setVerificationResult(null);
    }
  }, [isOpen]);

  // Auto-calculate suggested middle-ground pricing whenever wholesale or retail change
  useEffect(() => {
    if (wholesaleRate > 0 && retailRate > wholesaleRate) {
      const { suggestedDirectPrice, suggestedGroupPrice } = calculateRecommendedPrices(
        wholesaleRate,
        retailRate
      );
      setNormalPrice(suggestedDirectPrice);
      setBulkPrice(suggestedGroupPrice);
    }
  }, [wholesaleRate, retailRate]);

  // Handle local file upload (converts photo to base64 data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Photo size should be less than 10MB.');
        return;
      }
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const res = reader.result;
          setPhotoUrl(res);
          setIsPhotoUploaded(true);
          setErrorMessage('');
          setVerificationResult(null); // Reset verification for new image
          setIsVerifying(true);
          // Automatically run deep forensic inspection on the uploaded file
          verifyCropPhotoWithGemini(res, category, geminiApiKey, file.name)
            .then((vResult) => {
              setVerificationResult(vResult);
              if (vResult.isAiGenerated || vResult.verdict === 'AI_GENERATED_DETECTED') {
                setErrorMessage(
                  t('geminiAiDetectedNotice') ||
                    '⚠️ Rejected: Gemini AI detected synthetic / AI-generated artifacts. Agridirect strictly requires real camera photos of actual harvest batches.'
                );
              }
            })
            .catch((err) => {
              console.warn('Verification error:', err);
            })
            .finally(() => {
              setIsVerifying(false);
            });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Gemini API Key
  const handleSaveApiKey = () => {
    const key = tempApiKeyInput.trim();
    setStoredGeminiApiKey(key);
    setGeminiApiKey(key);
    setKeySavedFeedback(true);
    setShowApiKeyInput(false);
    setTimeout(() => setKeySavedFeedback(false), 3000);
  };

  // Clear Gemini API Key
  const handleClearApiKey = () => {
    setStoredGeminiApiKey('');
    setGeminiApiKey('');
    setTempApiKeyInput('');
    setShowApiKeyInput(true);
  };

  // Trigger Gemini AI Image Authenticity Verification
  const handleRunAiVerification = async () => {
    if (!photoUrl) {
      setErrorMessage('Please select or upload a crop photo first.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    try {
      const result = await verifyCropPhotoWithGemini(
        photoUrl,
        category,
        geminiApiKey,
        uploadedFileName
      );
      setVerificationResult(result);

      if (result.isAiGenerated || result.verdict === 'AI_GENERATED_DETECTED') {
        setErrorMessage(
          t('geminiAiDetectedNotice') ||
            '⚠️ Rejected: Gemini AI detected synthetic / AI-generated artifacts. Agridirect strictly requires real camera photos of actual harvest batches.'
        );
      } else {
        setErrorMessage('');
      }
    } catch (err: any) {
      setErrorMessage(`Gemini verification error: ${err.message || 'Verification failed'}`);
    } finally {
      setIsVerifying(false);
    }
  };

  // Web Speech API Integration
  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      handleSimulateVoice();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      if (language === 'hi') {
        recognition.lang = 'hi-IN';
      } else if (language === 'kn') {
        recognition.lang = 'kn-IN';
      } else {
        recognition.lang = 'en-IN';
      }

      setIsListening(true);
      setSpeechFeedback(t('listening'));

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        applyParsedVoice(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        handleSimulateVoice();
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      handleSimulateVoice();
    }
  };

  const applyParsedVoice = (transcript: string) => {
    const parsed = parseVoiceTranscript(transcript, language);
    setSpeechFeedback(transcript);

    setCategory(parsed.category);
    setTitleEn(parsed.title.en);
    setTitleHi(parsed.title.hi);
    setTitleKn(parsed.title.kn);
    setAvailableStockKg(parsed.weightKg);
    setWholesaleRate(parsed.wholesalePrice);
    setRetailRate(parsed.retailPrice);
    setNormalPrice(parsed.normalPrice);
    setBulkPrice(parsed.bulkPrice);
    setBulkMinQty(50);
    setBulkMaxQty(Math.min(parsed.weightKg, 150));
    setQualityGrade(parsed.qualityGrade);
    setShelfLifeMonths(parsed.shelfLifeMonths);

    const matchingPhoto = PRESET_PHOTOS.find((p) => p.category === parsed.category);
    if (matchingPhoto) {
      setPhotoUrl(matchingPhoto.url);
      setVerificationResult(null);
    }
  };

  const handleSimulateVoice = () => {
    const sim = getSimulatedFarmerVoice(language);
    applyParsedVoice(sim.transcript);
  };

  // Validate Step 1 before transitioning to Step 2
  const validateStep1 = (): boolean => {
    setErrorMessage('');

    const currentTitle =
      language === 'hi' ? titleHi : language === 'kn' ? titleKn : titleEn;
    if (!currentTitle.trim()) {
      setErrorMessage(t('fillRequired') || 'Please enter the crop / product title.');
      return false;
    }

    if (shelfLifeMonths < 3) {
      setErrorMessage(
        t('shelfLifeWarning') ||
          'Agridirect only permits non-perishable, long shelf-life commodities (>= 3 months).'
      );
      return false;
    }

    if (availableStockKg <= 0) {
      setErrorMessage('Available stock quantity must be greater than 0 kg.');
      return false;
    }

    const priceCheck = validateCustomPrices(wholesaleRate, bulkPrice, normalPrice, retailRate);
    if (!priceCheck.valid) {
      setErrorMessage(priceCheck.message || 'Pricing violates middle-ground rules (Wholesale < Group Bulk < Direct < Retail).');
      return false;
    }

    if (bulkMinQty <= 0) {
      setErrorMessage('Bulk minimum target must be greater than 0 kg.');
      return false;
    }
    if (bulkMaxQty < bulkMinQty) {
      setErrorMessage(t('bulkMinMaxError'));
      return false;
    }
    if (bulkMaxQty > availableStockKg) {
      setErrorMessage(
        `Bulk maximum cap (${bulkMaxQty} kg) cannot exceed total stock (${availableStockKg} kg).`
      );
      return false;
    }

    if (!pickupLocation.trim() || !pickupPincode.trim()) {
      setErrorMessage('Please provide a valid pickup location and pincode.');
      return false;
    }

    return true;
  };

  const handleGoToPhotoStep = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (currentStep === 1) {
      handleGoToPhotoStep();
      return;
    }

    if (!photoUrl) {
      setErrorMessage(t('actualPhotoRequired') || 'Please provide an authentic photo of your actual crop.');
      return;
    }

    // Guardrail against AI-generated photos
    if (verificationResult?.isAiGenerated || verificationResult?.verdict === 'AI_GENERATED_DETECTED') {
      setErrorMessage(
        'Cannot publish listing: Gemini AI detected that this photo is synthetic / AI-generated. Please upload a real photograph of your actual harvest.'
      );
      return;
    }

    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    addProduct({
      farmerId: currentUser?.id || 'user-farmer-1',
      farmerName: currentUser?.name || 'Farmer',
      farmerPhone: currentUser?.phone || '+91 98451 22345',
      farmerVerified: currentUser?.isVerified ?? true,
      category,
      title: {
        en: titleEn,
        hi: titleHi,
        kn: titleKn,
      },
      description: {
        en: descEn,
        hi: descHi,
        kn: descKn,
      },
      photoUrl: photoUrl || PRESET_PHOTOS[0].url,
      harvestMonthYear,
      qualityGrade,
      shelfLifeMonths,
      availableStockKg,
      wholesaleBenchmarkPerKg: wholesaleRate,
      marketRetailBenchmarkPerKg: retailRate,
      normalPricePerKg: normalPrice,
      bulkPricePerKg: bulkPrice,
      bulkMinQuantityKg: bulkMinQty,
      bulkMaxQuantityKg: bulkMaxQty,
      pickupLocationName: pickupLocation,
      pickupPincode,
      pickupLat: currentUser?.lat || 15.3647,
      pickupLng: currentUser?.lng || 75.1240,
      homeDeliveryAvailable: allowHomeDelivery,
      deliveryBaseFee,
      deliveryRatePerKm,
      deliveryRatePerKg,
      maxDeliveryRadiusKm: 40,
      isApprovedByAdmin: true,
      isAiVerified: verificationResult?.isAuthentic ?? true,
      aiVerificationDetails: verificationResult
        ? {
            verdict: verificationResult.verdict,
            confidenceScore: verificationResult.confidenceScore,
            aiLikelihoodPercentage: verificationResult.aiLikelihoodPercentage,
            forensicAnalysis: verificationResult.forensicAnalysis,
          }
        : undefined,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 text-stone-100 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden my-0 sm:my-6 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] sm:max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 px-4 sm:px-6 py-3.5 sm:py-5 border-b border-emerald-800/50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3.5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-emerald-800/80 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-md shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-xl font-extrabold text-white tracking-tight">{t('addNewProduct')}</h2>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                  2-Step + Gemini AI
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-200/80">
                {currentStep === 1
                  ? (t('step1Subtitle') || 'Step 1: Crop category, quality grade, grain specs & pricing')
                  : (t('step2Subtitle') || 'Step 2: Upload or capture authentic photograph of your harvest')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-stone-400 hover:text-white hover:bg-stone-800/80 rounded-xl transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Step Progress Navigation Bar */}
        <div className="bg-stone-950/80 px-3 sm:px-6 py-2.5 sm:py-3 border-b border-stone-800 shrink-0">
          <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => {
                setCurrentStep(1);
                setErrorMessage('');
              }}
              className={`flex items-center space-x-3 p-2.5 rounded-2xl border transition-all text-left ${
                currentStep === 1
                  ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                  currentStep === 1
                    ? 'bg-emerald-500 text-stone-950 shadow'
                    : currentStep === 2
                    ? 'bg-emerald-800 text-emerald-200'
                    : 'bg-stone-800 text-stone-400'
                }`}
              >
                {currentStep === 2 ? <Check className="w-4 h-4 text-emerald-300" /> : '1'}
              </div>
              <div className="truncate">
                <span className="block text-xs font-bold leading-tight truncate">
                  {t('step1Tab') || '1. Item & Quality Details'}
                </span>
                <span className="text-[10px] text-stone-400">Commodity, Grade & Price</span>
              </div>
            </button>

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={handleGoToPhotoStep}
              className={`flex items-center space-x-3 p-2.5 rounded-2xl border transition-all text-left ${
                currentStep === 2
                  ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                  currentStep === 2
                    ? 'bg-emerald-500 text-stone-950 shadow'
                    : 'bg-stone-800 text-stone-400'
                }`}
              >
                2
              </div>
              <div className="truncate">
                <span className="block text-xs font-bold leading-tight truncate">
                  {t('step2Tab') || '2. Actual Product Photo'}
                </span>
                <span className="text-[10px] text-stone-400">Gemini AI Verification</span>
              </div>
            </button>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto font-sans">
          
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-4 bg-red-950/60 border border-red-700/80 rounded-2xl text-xs text-red-200 flex items-start space-x-2.5 shadow-md animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="block text-red-300 font-bold mb-0.5">Verification & Compliance Alert</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: ABOUT THE ITEM & QUALITY OF THE PRODUCT                           */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Voice Assistant Bar */}
              <div className="bg-emerald-950/50 border border-emerald-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={startSpeechRecognition}
                    className={`relative flex items-center justify-center p-3.5 rounded-full text-white shadow-lg transition-all ${
                      isListening
                        ? 'bg-red-500 animate-pulse ring-4 ring-red-400'
                        : 'bg-emerald-600 hover:bg-emerald-500 hover:scale-105 active:scale-95'
                    }`}
                    title={t('startSpeaking')}
                  >
                    {isListening ? <Mic className="w-6 h-6 animate-bounce" /> : <Mic className="w-6 h-6" />}
                  </button>
                  <div>
                    <p className="font-bold text-white text-sm">{t('startSpeaking')}</p>
                    <p className="text-xs text-emerald-300/80">
                      {isListening ? t('listening') : 'Speech Recognition (English, हिन्दी, ಕನ್ನಡ)'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateVoice}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-md transition transform hover:scale-105 active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-stone-950" />
                  <span>{t('simulateVoice')}</span>
                </button>
              </div>

              {speechFeedback && (
                <div className="bg-amber-950/40 border border-amber-700/60 rounded-xl p-3 text-xs text-amber-200 flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300">{t('simulatedSpeechAlert')} </span>
                    <span className="italic">"{speechFeedback}"</span>
                  </div>
                </div>
              )}

              {/* Section 1.1: Category & Quality Grade */}
              <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      1. Commodity Category & Quality Grading
                    </h3>
                  </div>
                  <span className="text-[11px] text-stone-400">Non-perishable standard</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                      {t('category')} *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as CommodityCategory)}
                      className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-white font-medium text-sm focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="PEANUTS_OILSEEDS">{t('peanutsOilseeds')} (Groundnuts / Peanuts)</option>
                      <option value="PULSES_DALS">{t('pulsesDals')} (Toor Dal, Moong, Chana)</option>
                      <option value="GRAINS_MILLETS">{t('grainsMillets')} (Ragi, Jowar, Millets)</option>
                      <option value="DRY_SPICES">{t('drySpices')} (Dry Red Chillies, Spices)</option>
                    </select>
                  </div>

                  {/* Quality Grade */}
                  <div>
                    <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                      {t('qualityGrade')} *
                    </label>
                    <select
                      value={qualityGrade}
                      onChange={(e) => setQualityGrade(e.target.value as QualityGrade)}
                      className="w-full px-3.5 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-white font-medium text-sm focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="GRADE_A_BOLD">{t('gradeBold')} (Grade A Bold - Large Kernel / Hand-sorted)</option>
                      <option value="STANDARD">{t('gradeStandard')} (Standard Grade - Cleaned & Machine Sifted)</option>
                      <option value="ORGANIC_UNPOLISHED">{t('gradeOrganic')} (Organic / Unpolished - Traditional Seed)</option>
                    </select>
                  </div>
                </div>

                {/* Quality Specifications Sub-grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-stone-900/80 p-3 rounded-xl border border-stone-800">
                    <span className="text-[11px] font-bold text-emerald-300 flex items-center mb-1">
                      <Droplet className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      Moisture Content Level
                    </span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="4"
                        max="14"
                        step="0.5"
                        value={moisturePercent}
                        onChange={(e) => setMoisturePercent(parseFloat(e.target.value) || 8)}
                        className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-white font-bold text-sm text-center"
                      />
                      <span className="text-xs text-stone-400 font-semibold">%</span>
                    </div>
                    <p className="text-[10px] text-emerald-400/90 mt-1">
                      {moisturePercent <= 9 ? '✓ Optimal safe dry storage' : '⚠️ Keep < 10% for long life'}
                    </p>
                  </div>

                  <div className="bg-stone-900/80 p-3 rounded-xl border border-stone-800">
                    <span className="text-[11px] font-bold text-emerald-300 flex items-center mb-1">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      {t('harvestMonth')} *
                    </span>
                    <input
                      type="text"
                      value={harvestMonthYear}
                      onChange={(e) => setHarvestMonthYear(e.target.value)}
                      placeholder="Oct 2026"
                      className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-white font-medium text-xs"
                      required
                    />
                    <p className="text-[10px] text-stone-400 mt-1">Month & Year harvested</p>
                  </div>

                  <div className="bg-stone-900/80 p-3 rounded-xl border border-stone-800">
                    <span className="text-[11px] font-bold text-emerald-300 flex items-center mb-1">
                      <Package className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      {t('availableStock')} *
                    </span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="10"
                        step="5"
                        value={availableStockKg}
                        onChange={(e) => setAvailableStockKg(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-white font-bold text-sm text-center"
                        required
                      />
                      <span className="text-xs text-stone-400 font-semibold">kg</span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">Total batch in harvest yard</p>
                  </div>
                </div>

                {/* Shelf-Life Guardrail Check */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  shelfLifeMonths >= 3
                    ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                    : 'bg-red-950/50 border-red-700 text-red-200'
                }`}>
                  <div>
                    <span className="text-xs font-bold block">
                      {t('shelfLifeMonths')}: <strong className="text-sm font-extrabold text-white">{shelfLifeMonths} months</strong>
                    </span>
                    <span className="text-[11px] text-stone-300">
                      {shelfLifeMonths >= 3
                        ? '✓ Verified non-perishable compliant (>= 3 months minimum)'
                        : '❌ Perishables forbidden! Must be >= 3 months.'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    value={shelfLifeMonths}
                    onChange={(e) => setShelfLifeMonths(parseInt(e.target.value, 10) || 1)}
                    className="w-20 px-2 py-1 bg-stone-950 border border-stone-700 rounded-lg text-center font-black text-sm text-white"
                  />
                </div>
              </div>

              {/* Section 1.2: Trilingual Crop Names & Quality Descriptions */}
              <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Info className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      2. Product Names & Quality Attributes (Trilingual)
                    </h3>
                  </div>
                  <span className="text-[11px] text-stone-400">English • हिन्दी • ಕನ್ನಡ</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-stone-400 font-bold mb-1">
                      English Name *
                    </label>
                    <input
                      type="text"
                      value={titleEn}
                      onChange={(e) => setTitleEn(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-400 font-bold mb-1">
                      हिन्दी (Hindi Name) *
                    </label>
                    <input
                      type="text"
                      value={titleHi}
                      onChange={(e) => setTitleHi(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-400 font-bold mb-1">
                      ಕನ್ನಡ (Kannada Name) *
                    </label>
                    <input
                      type="text"
                      value={titleKn}
                      onChange={(e) => setTitleKn(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Quality Notes / Descriptions */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                    Quality Description & Harvesting Notes (English)
                  </label>
                  <textarea
                    rows={2}
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    placeholder="e.g. Naturally sun-dried, pesticide free, bold kernel, graded for group buying."
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Section 1.3: Middle-Ground Pricing & Bulk Limits */}
              <div className="bg-emerald-950/80 border border-emerald-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-800/80 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      3. Win-Win Middle-Ground Pricing & Bulk Targets
                    </h3>
                  </div>
                  <span className="text-[11px] bg-emerald-800/80 text-emerald-200 px-2.5 py-0.5 rounded-full font-mono border border-emerald-600/50">
                    P_wholesale &lt; P_group &lt; P_direct &lt; P_retail
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-stone-900">
                  <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800 text-stone-300">
                    <span className="block text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                      {t('wholesalePriceRef')}
                    </span>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-stone-400 mr-1 font-bold">₹</span>
                      <input
                        type="number"
                        value={wholesaleRate}
                        onChange={(e) => setWholesaleRate(parseFloat(e.target.value) || 0)}
                        className="w-full font-black text-white bg-transparent text-sm focus:outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-stone-500">APMC Middleman</span>
                  </div>

                  <div className="bg-stone-900/90 p-3 rounded-xl border border-stone-800 text-stone-300">
                    <span className="block text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                      {t('retailPriceRef')}
                    </span>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-stone-400 mr-1 font-bold">₹</span>
                      <input
                        type="number"
                        value={retailRate}
                        onChange={(e) => setRetailRate(parseFloat(e.target.value) || 0)}
                        className="w-full font-black text-white bg-transparent text-sm focus:outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-stone-500">City Retail Store</span>
                  </div>

                  <div className="bg-emerald-900/70 border border-emerald-500/50 p-3 rounded-xl text-white shadow-inner">
                    <span className="block text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                      Option 1: Direct Price
                    </span>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-emerald-300 mr-1 font-bold">₹</span>
                      <input
                        type="number"
                        value={normalPrice}
                        onChange={(e) => setNormalPrice(parseFloat(e.target.value) || 0)}
                        className="w-full font-black text-emerald-300 bg-transparent text-base focus:outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-emerald-200">
                      +{Math.round(((normalPrice - wholesaleRate) / (wholesaleRate || 1)) * 100)}% Farmer Gain
                    </span>
                  </div>

                  <div className="bg-amber-900/50 border border-amber-500/50 p-3 rounded-xl text-white shadow-inner">
                    <span className="block text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                      Option 2: Group Bulk
                    </span>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-amber-300 mr-1 font-bold">₹</span>
                      <input
                        type="number"
                        value={bulkPrice}
                        onChange={(e) => setBulkPrice(parseFloat(e.target.value) || 0)}
                        className="w-full font-black text-amber-300 bg-transparent text-base focus:outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-amber-200">
                      {bulkMinQty} - {bulkMaxQty} kg Pool
                    </span>
                  </div>
                </div>

                {/* Bulk Order Range (Min - Max) */}
                <div className="bg-stone-900/80 border border-emerald-700/60 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-emerald-300 uppercase tracking-wide flex items-center">
                      <Layers className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      {t('bulkMinMaxRange')} (Set by Farmer)
                    </span>
                    <span className="text-[11px] text-emerald-300 font-mono">
                      Bulk Price: ₹{bulkPrice}/kg
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-stone-950 p-2.5 rounded-lg border border-emerald-600/50">
                      <span className="text-[11px] text-emerald-300 block mb-1 font-semibold">
                        {t('bulkMinQty')} (Min threshold to unlock price):
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="number"
                          min="10"
                          value={bulkMinQty}
                          onChange={(e) => setBulkMinQty(parseFloat(e.target.value) || 10)}
                          className="w-full px-2 py-1 bg-stone-900 border border-emerald-500 rounded text-center text-white font-black text-sm"
                        />
                        <span className="text-stone-400 font-bold">kg</span>
                      </div>
                    </div>

                    <div className="bg-stone-950 p-2.5 rounded-lg border border-amber-600/50">
                      <span className="text-[11px] text-amber-300 block mb-1 font-semibold">
                        {t('bulkMaxQty')} (Max capacity cap):
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="number"
                          min={bulkMinQty}
                          max={availableStockKg}
                          value={bulkMaxQty}
                          onChange={(e) => setBulkMaxQty(parseFloat(e.target.value) || bulkMinQty)}
                          className="w-full px-2 py-1 bg-stone-900 border border-amber-500 rounded text-center text-white font-black text-sm"
                        />
                        <span className="text-stone-400 font-bold">kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 1.4: Selling Location & Delivery Setup */}
              <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <span className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center">
                    <MapPin className="w-4 h-4 text-emerald-400 mr-1" />
                    {t('sellingLocation')}
                  </span>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowHomeDelivery}
                      onChange={(e) => setAllowHomeDelivery(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-stone-300">{t('allowHomeDelivery')}</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      placeholder="Village / Farmyard / Hub address"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={pickupPincode}
                      onChange={(e) => setPickupPincode(e.target.value)}
                      placeholder="Pincode (e.g. 580024)"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-white text-xs font-medium focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Step 1 Next Action Button */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 border border-stone-700 hover:bg-stone-800 rounded-xl text-xs font-bold text-stone-400 hover:text-white transition"
                >
                  {t('cancel')}
                </button>

                <button
                  type="button"
                  onClick={handleGoToPhotoStep}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950 flex items-center space-x-2 transition transform hover:scale-105 active:scale-95"
                >
                  <span>{t('nextToPhoto') || 'Next: Add Actual Product Photo'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: PHOTO OF THE PRODUCT (ACTUAL PRODUCT) + GEMINI API VERIFICATION   */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Gemini API Key Management Drawer / Status Bar */}
              <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-900/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                      <Bot className="w-5 h-5 text-cyan-300" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-white flex items-center space-x-2">
                        <span>{t('geminiEngineTitle') || 'Google Gemini AI Authenticity Engine'}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-900/80 text-cyan-200 border border-cyan-600/40">
                          v1.5 Flash Vision
                        </span>
                      </h4>
                      <p className="text-[11px] text-cyan-300/80">
                        {geminiApiKey
                          ? `Active Key: ••••••••••••${geminiApiKey.slice(-4)}`
                          : 'No API Key configured (Enter key to enable live neural image analysis)'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {keySavedFeedback && (
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center">
                        <Check className="w-3.5 h-3.5 mr-1" /> Key Saved!
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                      className="px-3 py-1.5 bg-cyan-900/60 hover:bg-cyan-800/80 border border-cyan-600/50 rounded-xl text-[11px] font-bold text-cyan-200 transition flex items-center space-x-1"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{showApiKeyInput ? 'Hide Key Settings' : geminiApiKey ? 'Change Key' : 'Enter Gemini Key'}</span>
                    </button>
                  </div>
                </div>

                {/* Expandable Key Configuration Box */}
                {showApiKeyInput && (
                  <div className="pt-3 border-t border-cyan-900/60 space-y-3 animate-in fade-in duration-150">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-stone-300">
                        {t('geminiKeyLabel') || 'Google Gemini API Key'} (Stored securely in browser / .env):
                      </label>
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <input
                            type={showKeySecret ? 'text' : 'password'}
                            value={tempApiKeyInput}
                            onChange={(e) => setTempApiKeyInput(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full pl-3 pr-10 py-2 bg-stone-950 border border-cyan-700/60 rounded-xl text-xs font-mono text-cyan-100 focus:border-cyan-400 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKeySecret(!showKeySecret)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
                            title={showKeySecret ? 'Hide Key' : 'Reveal Key'}
                          >
                            {showKeySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveApiKey}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-stone-950 font-bold text-xs rounded-xl shadow transition"
                        >
                          {t('geminiSaveKey') || 'Save Key'}
                        </button>

                        {geminiApiKey && (
                          <button
                            type="button"
                            onClick={handleClearApiKey}
                            className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl transition"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span>Don't have a Gemini key? Get a free API key with 15 RPM from Google AI Studio:</span>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1 underline"
                      >
                        <span>{t('geminiGetKey') || 'Get Free Key'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Authenticity Guidance Notice */}
              <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-2xl p-4 flex items-start space-x-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-extrabold text-emerald-300">
                    {t('photoVerificationBadge') || 'Actual Harvest Lot Verification'}
                  </h4>
                  <p className="text-stone-300/90 leading-relaxed">
                    {t('photoVerificationNotice') ||
                      'Please upload or capture a real, unedited photo of your actual harvested grain bags, drying yard, or pod sample. Authentic farmer photographs build trust with group-buying consumers.'}
                  </p>
                </div>
              </div>

              {/* Photo Input Methods Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Method 1: File Upload & Camera Capture */}
                <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-2 flex items-center">
                      <Camera className="w-4 h-4 text-emerald-400 mr-1.5" />
                      Take Live Photo or Upload Real Image
                    </h3>
                    <p className="text-[11px] text-stone-400 mb-4">
                      Snap directly with your smartphone camera or select from your gallery.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Upload from Device */}
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-stone-700 hover:border-emerald-500 bg-stone-900/60 hover:bg-stone-900 rounded-2xl cursor-pointer transition group">
                        <Upload className="w-6 h-6 text-stone-400 group-hover:text-emerald-400 mb-2 transition" />
                        <span className="text-xs font-bold text-stone-200 text-center leading-tight">
                          {t('uploadFromDevice') || 'Upload Device File'}
                        </span>
                        <span className="text-[10px] text-stone-500 mt-1">PNG, JPG up to 10MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      {/* Take Photo with Camera */}
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-emerald-600/50 hover:border-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 rounded-2xl cursor-pointer transition group">
                        <Camera className="w-6 h-6 text-emerald-400 group-hover:scale-110 mb-2 transition" />
                        <span className="text-xs font-bold text-emerald-300 text-center leading-tight">
                          {t('takeLivePhoto') || 'Take Live Photo'}
                        </span>
                        <span className="text-[10px] text-emerald-400/80 mt-1">Camera Snapshot</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Direct URL Input */}
                  <div className="pt-3 border-t border-stone-800 space-y-1.5">
                    <label className="block text-[11px] font-bold text-stone-400">
                      Or Paste Image Web URL:
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        value={photoUrl}
                        onChange={(e) => {
                          setPhotoUrl(e.target.value);
                          setIsPhotoUploaded(false);
                          setVerificationResult(null);
                        }}
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Method 2: Verified Agricultural Sample Presets */}
                <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center">
                    <ImageIcon className="w-4 h-4 text-emerald-400 mr-1.5" />
                    {t('selectSamplePreset') || 'Or Select High-Res Verified Sample'}
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    High-quality authentic representations matching Karnataka APMC crop standards:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {PRESET_PHOTOS.map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => {
                          setPhotoUrl(preset.url);
                          setIsPhotoUploaded(false);
                          setVerificationResult(null);
                        }}
                        className={`p-2 rounded-xl border text-left flex items-center space-x-2.5 transition ${
                          photoUrl === preset.url
                            ? 'bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/50'
                            : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-12 h-12 rounded-lg object-cover shrink-0"
                        />
                        <div className="truncate text-xs">
                          <span className="font-bold text-stone-200 block truncate">{preset.label}</span>
                          <span className="text-[10px] text-emerald-400 truncate block">{preset.note}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Gemini AI Verification Control & Forensic Report Card */}
              <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-cyan-950/30 border border-cyan-800/50 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-900/50 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                      <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white flex items-center space-x-2">
                        <span>AI Generation & Authenticity Scanner</span>
                      </h4>
                      <p className="text-[11px] text-stone-400">
                        Multimodal optical inspection for synthetic grain textures & diffusion smoothing
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunAiVerification}
                    disabled={isVerifying}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 disabled:opacity-50 text-stone-950 font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-950/80 flex items-center justify-center space-x-2 transition transform hover:scale-105 active:scale-95"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-stone-950" />
                        <span>{t('geminiVerifying') || 'Analyzing Image with Gemini...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-stone-950" />
                        <span>{verificationResult ? 'Re-Verify with Gemini AI' : (t('geminiVerifyBtn') || 'Verify Photo with Gemini AI')}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Verification Results Display */}
                {verificationResult ? (
                  <div
                    className={`p-4 rounded-2xl border transition-all animate-in fade-in duration-200 ${
                      verificationResult.isAiGenerated || verificationResult.verdict === 'AI_GENERATED_DETECTED'
                        ? 'bg-red-950/70 border-red-600 text-red-200'
                        : 'bg-emerald-950/60 border-emerald-500/70 text-emerald-100'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-3">
                      <div className="flex items-center space-x-2">
                        {verificationResult.isAiGenerated || verificationResult.verdict === 'AI_GENERATED_DETECTED' ? (
                          <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        )}
                        <span className="font-extrabold text-sm text-white">
                          {verificationResult.isAiGenerated || verificationResult.verdict === 'AI_GENERATED_DETECTED'
                            ? (t('geminiAiDetected') || '⚠️ AI-Generated / Synthetic Image Detected (Rejected)')
                            : (t('geminiVerifiedBadge') || '✓ 100% Authentic Real Farm Photo (AI-Free Verified)')}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-stone-900/80 border border-stone-700 text-stone-300">
                        {verificationResult.source === 'LIVE_GEMINI_API' ? 'Live Gemini 1.5 Flash' : 'Simulated Inspector'} • {verificationResult.timestamp}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-3">
                      <div className="bg-stone-950/70 p-2.5 rounded-xl border border-stone-800">
                        <span className="text-[10px] text-stone-400 block font-bold">AI Likelihood</span>
                        <strong className={`text-sm font-black ${
                          verificationResult.aiLikelihoodPercentage > 50 ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {verificationResult.aiLikelihoodPercentage}%
                        </strong>
                        <span className="text-[10px] text-stone-500 block">
                          {verificationResult.aiLikelihoodPercentage > 50 ? 'Synthetic diffusion' : 'Human camera shot'}
                        </span>
                      </div>

                      <div className="bg-stone-950/70 p-2.5 rounded-xl border border-stone-800">
                        <span className="text-[10px] text-stone-400 block font-bold">Confidence Score</span>
                        <strong className="text-sm font-black text-cyan-300">{verificationResult.confidenceScore}%</strong>
                        <span className="text-[10px] text-stone-500 block">Forensic certainty</span>
                      </div>

                      <div className="col-span-2 sm:col-span-1 bg-stone-950/70 p-2.5 rounded-xl border border-stone-800">
                        <span className="text-[10px] text-stone-400 block font-bold">Detected Produce</span>
                        <strong className="text-xs font-bold text-white truncate block">{verificationResult.detectedCommodity}</strong>
                        <span className="text-[10px] text-emerald-400 block">Matches category</span>
                      </div>
                    </div>

                    <div className="space-y-1 bg-stone-950/50 p-3 rounded-xl border border-stone-800/80">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block">
                        Forensic Pixel & Morphology Analysis:
                      </span>
                      <p className="text-xs text-stone-200 italic leading-relaxed">
                        "{verificationResult.forensicAnalysis}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-stone-950/40 border border-stone-800/80 rounded-2xl p-4 flex items-center justify-between text-xs text-stone-400">
                    <span className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Ready to run Gemini optical audit on selected crop photograph.</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleRunAiVerification}
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline"
                    >
                      Run Audit Now
                    </button>
                  </div>
                )}
              </div>

              {/* Live "What the Buyer Sees" Preview Card */}
              <div className="bg-stone-950 border border-stone-800 rounded-3xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center">
                    <Sparkles className="w-4 h-4 mr-1 text-emerald-400" />
                    {t('liveBuyerPreview') || 'Live Marketplace Card Preview'}
                  </span>
                  <div className="flex items-center space-x-2">
                    {verificationResult && !verificationResult.isAiGenerated && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/50">
                        ✓ AI-Free Seal Active
                      </span>
                    )}
                    <span className="text-[11px] text-stone-400">
                      {isPhotoUploaded ? '✓ Uploaded Actual Farm Photo' : 'Verified Sample Photo'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  {/* Photo with Overlay Badge */}
                  <div className="relative rounded-2xl overflow-hidden aspect-video sm:aspect-square bg-stone-900 border border-stone-800 shadow-md">
                    <img
                      src={photoUrl}
                      alt="Actual Crop Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2.5 py-1 bg-stone-950/80 backdrop-blur-md rounded-full border border-emerald-500/40 text-[10px] font-bold text-emerald-300 shadow">
                      {qualityGrade.replace(/_/g, ' ')}
                    </div>
                    {verificationResult && !verificationResult.isAiGenerated && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-cyan-950/90 backdrop-blur-md rounded-full border border-cyan-400/60 text-[10px] font-extrabold text-cyan-300 shadow flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>AI-Free</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-stone-950/80 backdrop-blur-md rounded-lg text-[10px] font-mono text-stone-300">
                      Moisture: {moisturePercent}%
                    </div>
                  </div>

                  {/* Summary Attributes */}
                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-700/60 rounded text-[10px] font-extrabold uppercase">
                        {category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-stone-400">
                        Harvested: <strong>{harvestMonthYear}</strong>
                      </span>
                    </div>

                    <h4 className="text-base sm:text-lg font-black text-white leading-tight">
                      {language === 'hi' ? titleHi : language === 'kn' ? titleKn : titleEn}
                    </h4>

                    <p className="text-xs text-stone-400 line-clamp-2">
                      {language === 'hi' ? descHi : language === 'kn' ? descKn : descEn}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                      <div className="px-3 py-1.5 bg-stone-900 rounded-xl border border-stone-800">
                        <span className="text-[10px] text-stone-400 block">Direct Buy</span>
                        <strong className="text-emerald-400 text-sm">₹{normalPrice} / kg</strong>
                      </div>

                      <div className="px-3 py-1.5 bg-amber-950/40 rounded-xl border border-amber-800/40">
                        <span className="text-[10px] text-amber-300 block">Group Bulk Pool</span>
                        <strong className="text-amber-400 text-sm">₹{bulkPrice} / kg</strong>
                        <span className="text-[10px] text-stone-400 ml-1 font-mono">({bulkMinQty} - {bulkMaxQty} kg)</span>
                      </div>

                      <div className="px-3 py-1.5 bg-stone-900 rounded-xl border border-stone-800">
                        <span className="text-[10px] text-stone-400 block">Available Batch</span>
                        <strong className="text-white text-sm">{availableStockKg} kg</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 Bottom Navigation & Publish Action */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setErrorMessage('');
                  }}
                  className="px-5 py-2.5 border border-stone-700 hover:bg-stone-800 rounded-xl text-xs font-bold text-stone-300 hover:text-white flex items-center space-x-1.5 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('backToDetails') || '← Back to Item Details'}</span>
                </button>

                <button
                  type="submit"
                  disabled={verificationResult?.isAiGenerated}
                  className={`px-7 py-3 font-extrabold text-sm rounded-xl shadow-xl flex items-center space-x-2 transition transform ${
                    verificationResult?.isAiGenerated
                      ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-red-700/50'
                      : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-950/80 hover:scale-105 active:scale-95'
                  }`}
                  title={verificationResult?.isAiGenerated ? 'Cannot publish with AI-generated photo' : undefined}
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>{t('publishProductBtn') || 'Publish Product Listing'}</span>
                </button>
              </div>

            </div>
          )}

        </form>
      </div>
    </div>
  );
};
