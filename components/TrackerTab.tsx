
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { openFoodFactsService } from '../services/openFoodFactsService'; // Import new service
import { useDailyLog } from '../contexts/DailyLogContext';
import { FoodItem, NutritionalInfo } from '../types';
import { ICONS, DEFAULT_SERVING_QUANTITY, DEFAULT_NUTRITION_SERVING_SIZE_G } from '../constants';
import LoadingSpinner from './common/LoadingSpinner';
import { useTranslation } from 'react-i18next';
import MacronutrientPieChart from './common/MacronutrientPieChart';


const AUTO_LOG_INTERVAL = 15000;
const MAX_AUTO_LOG_MESSAGES = 10;

const SpeechRecognitionAPI = (window.SpeechRecognition || window.webkitSpeechRecognition);
const SpeechGrammarListAPI = (window.SpeechGrammarList || window.webkitSpeechGrammarList);


const TrackerTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [identifiedFoods, setIdentifiedFoods] = useState<string[]>([]);
  const [selectedFoodForNutrition, setSelectedFoodForNutrition] = useState<string | null>(null);
  const [nutritionInfo, setNutritionInfo] = useState<NutritionalInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null); // 'identify', 'nutrition', 'speechProcessing', 'barcodeFetching'
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false); // For manual image capture & barcode scanning

  const [isAutoLoggingActive, setIsAutoLoggingActive] = useState(false);
  const [autoLogIntervalId, setAutoLogIntervalId] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [autoLogMessages, setAutoLogMessages] = useState<string[]>([]);
  const [isAutoLoggingCameraStarting, setIsAutoLoggingCameraStarting] = useState(false);

  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Barcode Scanning State
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);
  const [barcodeScanError, setBarcodeScanError] = useState<string | null>(null);
  const barcodeDetectorRef = useRef<BarcodeDetector | null>(null);
  const barcodeScanRafId = useRef<number | null>(null);


  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addFoodToLog } = useDailyLog();

  const addAutoLogMessage = useCallback((messageKey: string, options?: Record<string, any>) => {
    const translatedMessage = t(messageKey, options);
    setAutoLogMessages(prev => [`[${new Date().toLocaleTimeString(i18n.language)}] ${translatedMessage}`, ...prev.slice(0, MAX_AUTO_LOG_MESSAGES - 1)]);
  }, [t, i18n.language]);

  const clearSelection = useCallback((clearAllErrors = true) => {
      setImagePreview(null);
      setImageBase64(null);
      setImageMimeType(null);
      setIdentifiedFoods([]);
      setNutritionInfo(null);
      setSelectedFoodForNutrition(null);
      if (clearAllErrors) {
        setError(null);
        setSpeechError(null);
        setBarcodeScanError(null);
      }
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
  }, []);
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (isAutoLoggingActive) stopAutoLogging();
      if (isListening) stopListening();
      if (isScanningBarcode) stopBarcodeScanning();

      clearSelection();
      setImageMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImageBase64((reader.result as string).split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async (forAutoLogging = false, forBarcodeScanning = false) => {
    if (isListening) stopListening();
    if (videoRef.current && videoRef.current.srcObject) { 
      if (!forAutoLogging) setIsCameraOpen(true); 
      return videoRef.current.srcObject as MediaStream;
    }
    
    try {
      if (forAutoLogging) setIsAutoLoggingCameraStarting(true);
      else if (!forBarcodeScanning) setIsLoading(true); 
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(playError => {
            console.error("Video play failed:", playError);
            const camError = t('errorCameraStart');
            if (forAutoLogging) { addAutoLogMessage("errorCameraStart"); stopCameraStream(stream); }
            else if (forBarcodeScanning) { setBarcodeScanError(camError); stopCameraStream(stream); }
            else { setError(camError); stopCameraStream(stream); }
        });
        if (!forAutoLogging) setIsCameraOpen(true);
        setError(null); setBarcodeScanError(null);
      }
      if (forAutoLogging) setIsAutoLoggingCameraStarting(false);
      else if (!forBarcodeScanning) setIsLoading(false);
      return stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
      const camError = t('errorCameraAccess');
      if (forAutoLogging) {
        addAutoLogMessage("errorCameraStart");
        setIsAutoLoggingActive(false);
        setIsAutoLoggingCameraStarting(false);
      } else if (forBarcodeScanning) {
        setBarcodeScanError(camError);
        setIsScanningBarcode(false); 
      } else {
         setError(camError);
         setIsCameraOpen(false);
         setIsLoading(false);
      }
      return null;
    }
  };

  const captureImage = () => {
    if (isAutoLoggingActive) stopAutoLogging();
    if (isListening) stopListening();
    clearSelection();
    if (videoRef.current && canvasRef.current && videoRef.current.readyState >= videoRef.current.HAVE_METADATA && videoRef.current.videoWidth > 0) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setImagePreview(dataUrl);
      setImageBase64(dataUrl.split(',')[1]);
      setImageMimeType('image/jpeg');
      closeManualCamera(); 
    } else {
       setError(t('errorCameraNotReady'));
    }
  };
  
  const stopCameraStream = useCallback((stream: MediaStream | null) => {
    stream?.getTracks().forEach(track => track.stop());
  }, []);
  
  const closeManualCamera = useCallback(() => { 
    if (videoRef.current && videoRef.current.srcObject) {
      if (!isAutoLoggingActive) {
        stopCameraStream(videoRef.current.srcObject as MediaStream);
        videoRef.current.srcObject = null;
      }
    }
    setIsCameraOpen(false); 
  }, [isAutoLoggingActive, stopCameraStream]);
  
  
  const handleIdentifyFood = async () => {
    if (!imageBase64 || !imageMimeType) {
      setError(t('errorNoImage'));
      return;
    }
    setIsLoading(true);
    setLoadingAction('identify');
    setError(null); setSpeechError(null); setBarcodeScanError(null);
    setIdentifiedFoods([]);
    setNutritionInfo(null);
    setSelectedFoodForNutrition(null);
    try {
      const foods = await geminiService.identifyFoodInImage(imageBase64, imageMimeType, i18n.language);
      setIdentifiedFoods(foods);
      if (foods.length === 0) {
        setError(t('errorNoFoodIdentified'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorAIFailedIdentify'));
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleSelectFoodForNutrition = async (foodName: string, foodSource: 'gemini' | 'barcode' | 'voice' = 'gemini') => {
    setSelectedFoodForNutrition(foodName);
    setIsLoading(true);
    
    let currentLoadingAction = 'nutrition';
    if (foodSource === 'barcode') currentLoadingAction = 'barcodeFetching';
    else if (foodSource === 'voice') currentLoadingAction = 'speechProcessing';
    setLoadingAction(currentLoadingAction);

    setError(null); setSpeechError(null); setBarcodeScanError(null);
    setNutritionInfo(null);
    
    try {
      let info: NutritionalInfo | null = null;
      if (foodSource === 'barcode') { 
         info = await openFoodFactsService.fetchProductByBarcode(foodName, i18n.language); // foodName is barcode here
         if (info) {
            setSelectedFoodForNutrition(info.name); // Update to actual product name
         } else {
            setBarcodeScanError(t('barcodeScanner.errorProductNotFound', { barcode: foodName }));
         }
      } else { 
        // For 'gemini' (image identified) or 'voice' (direct text input)
        // Pass imageBase64 & imageMimeType only if foodSource is 'gemini' and image is present
        const imgB64 = (foodSource === 'gemini' && imageBase64) ? imageBase64 : null;
        const imgMime = (foodSource === 'gemini' && imageMimeType) ? imageMimeType : null;
        info = await geminiService.getNutritionalInfo(foodName, i18n.language, imgB64, imgMime);
      }
      
      setNutritionInfo(info);
      if (!info && foodSource !== 'barcode') { 
        setError(t('errorCouldNotFetchNutrition', { foodName: foodName }));
      }
    } catch (err) {
      if (foodSource === 'barcode') {
        setBarcodeScanError(err instanceof Error ? err.message : t('barcodeScanner.errorApiFetchGeneric'));
      } else if (foodSource === 'voice') {
        setSpeechError(err instanceof Error ? err.message : t('voiceLog.errorCouldNotFetchNutritionVoice', {foodName: foodName}));
      }
      else {
        setError(err instanceof Error ? err.message : t('errorFailedToGetNutrition', { foodName }));
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleAddFoodToLog = () => {
    if (nutritionInfo) {
      const foodToAdd: FoodItem = {
        id: Date.now().toString(),
        name: nutritionInfo.name,
        calories: nutritionInfo.calories,
        protein: nutritionInfo.protein,
        carbs: nutritionInfo.carbs,
        fat: nutritionInfo.fat,
        quantity: `${nutritionInfo.serving_size_g || DEFAULT_NUTRITION_SERVING_SIZE_G}g (${t(DEFAULT_SERVING_QUANTITY)})`,
      };
      addFoodToLog(foodToAdd);
      clearSelection(false); 
    }
  };

  const performAutoSnapshotAndLog = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < videoRef.current.HAVE_METADATA || videoRef.current.videoWidth === 0) {
      addAutoLogMessage("autoLogCameraNotReady");
      return;
    }
    addAutoLogMessage("autoLogCapturing");
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64Data = dataUrl.split(',')[1];
    const mimeTypeData = 'image/jpeg';
    try {
      addAutoLogMessage("autoLogIdentifying");
      const foods = await geminiService.identifyFoodInImage(base64Data, mimeTypeData, i18n.language);
      if (foods.length > 0) {
        const primaryFood = foods[0];
        addAutoLogMessage("autoLogIdentifiedFetching", { foodName: primaryFood });
        const info = await geminiService.getNutritionalInfo(primaryFood, i18n.language, base64Data, mimeTypeData);
        if (info) {
          const foodToAdd: FoodItem = {
            id: `auto-${Date.now().toString()}`, name: info.name, calories: info.calories, protein: info.protein, carbs: info.carbs, fat: info.fat,
            quantity: `${info.serving_size_g || DEFAULT_NUTRITION_SERVING_SIZE_G}g (${t('autoLoggedSuffix', {ns: 'common'})})`, 
            timestamp: Date.now(),
          };
          addFoodToLog(foodToAdd);
          addAutoLogMessage("autoLogLogged", { foodName: info.name, calories: info.calories.toFixed(0) });
        } else {
          addAutoLogMessage("autoLogNoNutrition", { foodName: primaryFood });
        }
      } else {
        addAutoLogMessage("autoLogNoFood");
      }
    } catch (err) {
      console.error("Auto-Log Error:", err);
      addAutoLogMessage("autoLogError");
    }
  }, [addFoodToLog, addAutoLogMessage, i18n.language, t]);

  const startAutoLogging = async () => {
    clearSelection();
    setIsAutoLoggingActive(true);
    addAutoLogMessage("startAutoLogging");
    const stream = await startCamera(true, false);
    if (stream) {
        addAutoLogMessage("startingCameraForAutoLogging");
        await performAutoSnapshotAndLog();
        const intervalId = setInterval(performAutoSnapshotAndLog, AUTO_LOG_INTERVAL);
        setAutoLogIntervalId(intervalId);
    } else {
        setIsAutoLoggingActive(false); 
    }
  };

  const stopAutoLogging = useCallback(() => {
    setIsAutoLoggingActive(false);
    if (autoLogIntervalId) {
      clearInterval(autoLogIntervalId);
      setAutoLogIntervalId(null);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      if (!isCameraOpen) {
        stopCameraStream(videoRef.current.srcObject as MediaStream);
        videoRef.current.srcObject = null;
      }
    }
    if(!isCameraOpen && !imagePreview){ 
        addAutoLogMessage("stopAutoLogging");
    }
  }, [autoLogIntervalId, addAutoLogMessage, isCameraOpen, imagePreview, stopCameraStream]);


  const startBarcodeScanning = async () => {
    if (!window.BarcodeDetector) {
      setBarcodeScanError(t('barcodeScanner.errorNotSupported'));
      return;
    }
    clearSelection();
    if (isAutoLoggingActive) stopAutoLogging();
    if (isListening) stopListening();

    setIsScanningBarcode(true);
    setBarcodeScanError(null);
    setIsCameraOpen(true); 

    const stream = await startCamera(false, true); 
    if (!stream || !videoRef.current) {
      setIsScanningBarcode(false);
      setIsCameraOpen(false); 
      return;
    }

    try {
        const supportedFormats = await BarcodeDetector.getSupportedFormats();
        const formatsToUse = ['ean_13', 'upc_a', 'ean_8'].filter(f => supportedFormats.includes(f));
        if (formatsToUse.length === 0) {
            setBarcodeScanError(t('barcodeScanner.errorNoSupportedFormats'));
            stopBarcodeScanning();
            return;
        }
        barcodeDetectorRef.current = new BarcodeDetector({ formats: formatsToUse });
    } catch (err) {
        console.error("Error initializing BarcodeDetector:", err);
        setBarcodeScanError(t('barcodeScanner.errorInitDetector'));
        stopBarcodeScanning();
        return;
    }
    
    const detectBarcode = async () => {
      if (!isScanningBarcode || !barcodeDetectorRef.current || !videoRef.current || videoRef.current.paused || videoRef.current.ended || videoRef.current.videoWidth === 0) {
        if (isScanningBarcode) barcodeScanRafId.current = requestAnimationFrame(detectBarcode); 
        return;
      }
      try {
        const barcodes = await barcodeDetectorRef.current.detect(videoRef.current);
        if (barcodes.length > 0 && barcodes[0].rawValue) {
          stopBarcodeScanning(false); 
          await handleSelectFoodForNutrition(barcodes[0].rawValue, 'barcode'); 
        } else {
          if (isScanningBarcode) barcodeScanRafId.current = requestAnimationFrame(detectBarcode);
        }
      } catch (err) {
        console.error('Barcode detection error:', err);
        setBarcodeScanError(t('barcodeScanner.errorDetection'));
        if (isScanningBarcode) barcodeScanRafId.current = requestAnimationFrame(detectBarcode);
      }
    };
    barcodeScanRafId.current = requestAnimationFrame(detectBarcode);
  };

  const stopBarcodeScanning = useCallback((clearErrors = true) => {
    setIsScanningBarcode(false);
    if (barcodeScanRafId.current) {
      cancelAnimationFrame(barcodeScanRafId.current);
      barcodeScanRafId.current = null;
    }
    closeManualCamera(); 
    if (clearErrors) setBarcodeScanError(null);
  }, [closeManualCamera]);

  useEffect(() => {
    if (!SpeechRecognitionAPI) {
      setSpeechError(t('voiceLog.notSupported'));
      return;
    }
    const recognition: SpeechRecognition = new SpeechRecognitionAPI(); 
    if (SpeechGrammarListAPI && recognition.grammars) { 
        try {
            const speechRecognitionList = new SpeechGrammarListAPI();
            recognition.grammars = speechRecognitionList;
        } catch(e) { console.warn("SpeechGrammarList not fully supported:", e); }
    }

    if (recognition) {
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = i18n.language;
        recognition.onresult = (event: SpeechRecognitionEvent) => { 
          const transcript = event.results[0][0].transcript;
          clearSelection(false); 
          handleSelectFoodForNutrition(transcript, 'voice'); 
        };
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => { 
          console.error("Speech recognition error:", event.error, event.message);
          if (event.error === 'no-speech') setSpeechError(t('voiceLog.errorNoSpeech'));
          else if (event.error === 'audio-capture') setSpeechError(t('voiceLog.errorAudioCapture'));
          else if (event.error === 'not-allowed') setSpeechError(t('voiceLog.errorPermissionDenied'));
          else setSpeechError(t('voiceLog.errorGeneric'));
          setIsListening(false);
        };
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
    }
    return () => recognitionRef.current?.abort();
  }, [i18n.language, t, clearSelection]); 

  useEffect(() => {
    if (recognitionRef.current) recognitionRef.current.lang = i18n.language;
  }, [i18n.language]);

  const handleToggleListening = () => {
    if (!SpeechRecognitionAPI || !recognitionRef.current) {
      setSpeechError(t('voiceLog.notSupported'));
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (isAutoLoggingActive) stopAutoLogging();
      if (isScanningBarcode) stopBarcodeScanning();
      clearSelection(); 
      setSpeechError(null); setError(null); setBarcodeScanError(null);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Error starting speech recognition:", e);
        setSpeechError(t('voiceLog.errorStarting'));
        setIsListening(false);
      }
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  useEffect(() => { 
    return () => {
      if (autoLogIntervalId) clearInterval(autoLogIntervalId);
      if (barcodeScanRafId.current) cancelAnimationFrame(barcodeScanRafId.current);
      if (videoRef.current?.srcObject) stopCameraStream(videoRef.current.srcObject as MediaStream);
      if (recognitionRef.current && isListening) recognitionRef.current.abort();
    };
  }, [autoLogIntervalId, isListening, stopCameraStream]);


  return (
    <div className="space-y-6 p-4 md:p-6 bg-white shadow-card rounded-xl">
      <h2 className="text-2xl font-semibold text-dark mb-4">{t('trackYourMeal')}</h2>

      {isCameraOpen && !isAutoLoggingActive && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 p-4">
            <video ref={videoRef} playsInline className="w-full max-w-lg h-auto rounded-lg shadow-2xl mb-4" muted autoPlay></video>
            <canvas ref={canvasRef} className="hidden"></canvas> 
            
            {isScanningBarcode && (
                 <div className="text-center mb-3">
                    <p className="text-white text-lg font-medium animate-pulse">{t('barcodeScanner.scanning')}</p>
                    {barcodeScanError && <p className="text-red-300 bg-red-800 bg-opacity-50 p-2 rounded-md text-sm mt-2">{barcodeScanError}</p>}
                 </div>
            )}

            <div className="flex space-x-4">
                {!isScanningBarcode && ( 
                    <button
                        onClick={captureImage}
                        className="px-6 py-3 bg-primary text-white rounded-lg shadow-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-2 transition-colors flex items-center space-x-2 text-lg font-medium"
                        aria-label={t('captureFromCamera')}
                    >
                        {React.cloneElement(ICONS.camera, {className: "w-5 h-5"})}
                        <span>{t('captureFromCamera')}</span>
                    </button>
                )}
                <button
                    onClick={isScanningBarcode ? () => stopBarcodeScanning(true) : closeManualCamera}
                    className="px-6 py-3 bg-slate-600 text-white rounded-lg shadow-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors text-lg"
                    aria-label={t('cancel')}
                >
                    {t('cancel')}
                </button>
            </div>
        </div>
      )}
      
      <div className="border-t pt-6 mt-6 space-y-3">
        <h3 className="text-xl font-semibold text-dark flex items-center space-x-2">
            {React.cloneElement(ICONS.microphone, { className: `w-6 h-6 ${isListening ? 'text-red-500 animate-pulse' : 'text-primary'}` })}
            <span>{t('voiceLog.title')}</span>
        </h3>
        <button
            onClick={handleToggleListening}
            disabled={!SpeechRecognitionAPI || isLoading }
            className={`w-full px-6 py-3.5 text-lg font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center space-x-2
                        ${isListening ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-primary hover:bg-primary-hover text-white'}
                        disabled:opacity-60`}
            aria-live="polite"
            aria-label={isListening ? t('voiceLog.stopListening') : t('voiceLog.startListening')}
        >
            {React.cloneElement(ICONS.microphone, { className: `w-6 h-6 ${isListening ? 'animate-pulse' : ''}` })}
            <span>{isListening ? t('voiceLog.listening') : t('voiceLog.logByVoice')}</span>
        </button>
        {isListening && <p className="text-sm text-center text-primary animate-pulse" role="status">{t('voiceLog.speakNow')}</p>}
        {isLoading && loadingAction === 'speechProcessing' && (
             <div className="flex flex-col items-center justify-center my-3 p-3 bg-sky-50 rounded-lg" role="status"> <LoadingSpinner /> <p className="mt-2 text-secondary font-medium">{t('voiceLog.processing')}</p> </div>
        )}
        {speechError && <p className="text-red-700 bg-red-100 p-3 rounded-lg text-sm flex items-center space-x-2 mt-2" role="alert">{React.cloneElement(ICONS.info, {className: "w-5 h-5 flex-shrink-0"})}<span>{speechError}</span></p>}
      </div>

      <div className="border-t border-b border-slate-200 py-6 my-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-2">
                {React.cloneElement(ICONS.syncLoop, {className: `w-7 h-7 ${isAutoLoggingActive ? 'text-primary animate-spin-slow' : 'text-slate-500'}`})}
                <h3 className="text-xl font-semibold text-dark">{t('autoFoodLogging')}</h3>
            </div>
            <button
            onClick={isAutoLoggingActive ? stopAutoLogging : startAutoLogging}
            disabled={isAutoLoggingCameraStarting || isLoading || isListening || isScanningBarcode }
            className={`mt-2 sm:mt-0 px-5 py-2.5 rounded-lg font-medium shadow-md transition-colors flex items-center space-x-2
                        ${isAutoLoggingActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}
                        disabled:opacity-70 disabled:cursor-not-allowed`}
            aria-live="polite" aria-label={isAutoLoggingActive ? t('stopAutoLogging') : t('startAutoLogging')} >
            {isAutoLoggingCameraStarting ? <LoadingSpinner size="h-5 w-5"/> : (React.cloneElement(ICONS.syncLoop, {className: `w-5 h-5 ${isAutoLoggingActive ? "animate-spin-slow": ""}`}))}
            <span>{isAutoLoggingCameraStarting ? t('startingCameraForAutoLogging') : (isAutoLoggingActive ? t('stopAutoLogging') : t('startAutoLogging'))}</span>
            </button>
        </div>
        {isAutoLoggingActive && (
          <div className="border border-slate-300 rounded-lg p-2 bg-slate-50">
            <video ref={videoRef} playsInline className="w-full h-auto max-h-72 rounded-md object-contain shadow-sm bg-black" muted autoPlay aria-label={t('Live camera feed for auto-logging')}></video>
            <canvas ref={canvasRef} className="hidden" aria-hidden="true"></canvas>
          </div>
        )}
         {isAutoLoggingCameraStarting && <p className="text-sm text-slate-600" role="status">{t('startingCameraForAutoLogging')}</p>}
        {autoLogMessages.length > 0 && (
          <div className="mt-3 space-y-1 max-h-40 overflow-y-auto bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs scroll-smooth" aria-live="polite" aria-atomic="true">
            <h4 className="text-xs font-semibold text-slate-700 mb-1 sticky top-0 bg-slate-50 py-1 z-10">{t('autoLogActivity')}</h4>
            {autoLogMessages.map((msg, index) => ( <p key={index} className={`whitespace-pre-wrap ${msg.toLowerCase().includes(t('error', {lng: i18n.language}).toLowerCase()) || msg.toLowerCase().includes("fail") ? 'text-red-600' : 'text-slate-600'}`}>{msg}</p> ))}
          </div>
        )}
        <p className="text-xs text-slate-500">{isAutoLoggingActive ? t('autoLogActiveMessage', { interval: AUTO_LOG_INTERVAL/1000 }) : t('autoLogInactiveMessage')}</p>
        <p className="text-xs text-slate-400 italic">{t('opencvPlaceholder')}</p>
      </div>

      <h3 className="text-xl font-semibold text-dark flex items-center space-x-2">
        {React.cloneElement(ICONS.camera, {className:"w-6 h-6"})}
        <span>{t('manualMealTracker')}</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <label htmlFor="imageUpload" className="block text-md font-medium text-slate-700">{t('uploadOrCapture')}</label>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <label className="w-full sm:w-auto flex-grow px-4 py-3 bg-secondary text-white rounded-lg shadow-md hover:bg-secondary-hover transition-colors cursor-pointer flex items-center justify-center space-x-2 text-center">
                {React.cloneElement(ICONS.upload, {className: "w-5 h-5"})}
                <span>{t('chooseFile')}</span>
                <input ref={fileInputRef} type="file" id="imageUpload" accept="image/*" onChange={handleImageChange} className="hidden" aria-label={t('chooseFile')} disabled={isAutoLoggingActive || isListening || isScanningBarcode || isLoading} />
            </label>
             <button onClick={() => startCamera(false, false)} title={t('useCamera')} aria-label={t('useCamera')} disabled={isAutoLoggingActive || isLoading || isListening || isScanningBarcode}
              className="w-full sm:w-auto px-4 py-3 bg-secondary text-white rounded-lg shadow-md hover:bg-secondary-hover transition-colors flex items-center justify-center space-x-2 disabled:opacity-70">
              {isLoading && loadingAction !== 'identify' && loadingAction !== 'nutrition' && loadingAction !== 'speechProcessing' ? <LoadingSpinner size="h-5 w-5"/> : React.cloneElement(ICONS.camera, {className: "w-5 h-5"})}
              <span className="sm:hidden">{t('useCamera')}</span>
            </button>
             <button onClick={startBarcodeScanning} title={t('barcodeScanner.scanButton')} aria-label={t('barcodeScanner.scanButton')} disabled={isAutoLoggingActive || isLoading || isListening || isScanningBarcode}
              className="w-full sm:w-auto px-4 py-3 bg-sky-600 text-white rounded-lg shadow-md hover:bg-sky-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70">
              {isLoading && loadingAction === 'barcodeFetching' ? <LoadingSpinner size="h-5 w-5"/> : React.cloneElement(ICONS.barcode, {className: "w-5 h-5"})}
              <span className="sm:hidden">{t('barcodeScanner.scanButton')}</span>
            </button>
          </div>
           {barcodeScanError && <p className="text-red-700 bg-red-100 p-3 rounded-lg text-sm flex items-center space-x-2 mt-2" role="alert">{React.cloneElement(ICONS.info, {className: "w-5 h-5 flex-shrink-0"})}<span>{barcodeScanError}</span></p>}
          
          {!imagePreview && !isCameraOpen && !isAutoLoggingActive && !isListening && !isScanningBarcode && (
            <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-start space-x-2">
                {React.cloneElement(ICONS.handRaised, {className: "w-5 h-5 flex-shrink-0 text-blue-500"})}
                <span>{t('handReferenceInstruction')}</span>
            </div>
          )}
          {imagePreview && (
            <div className="mt-4 border border-slate-300 rounded-lg p-2 inline-block relative group bg-slate-50">
              <img src={imagePreview} alt={t('Selected food') || 'Selected food'} className="max-w-full sm:max-w-xs max-h-60 rounded-md object-contain shadow-sm" />
               <button onClick={() => clearSelection()} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" title={t('clearImage')} aria-label={t('clearImage')} >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
        </div>

        {imagePreview && ( 
          <div className="mt-4 md:mt-10 self-center">
            <button onClick={handleIdentifyFood} disabled={isLoading || !imageBase64 || isAutoLoggingActive || isListening || isScanningBarcode}
              className="w-full px-6 py-3.5 bg-primary text-white text-lg font-semibold rounded-lg shadow-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-2 transition-colors disabled:opacity-60 flex items-center justify-center space-x-2"
              aria-label={t('identifyFoodItems')}>
              {isLoading && loadingAction === 'identify' ? <LoadingSpinner size="h-6 w-6" /> : React.cloneElement(ICONS.aiSparkle, {className:"w-6 h-6"})}
              <span>{isLoading && loadingAction === 'identify' ? t("aiAnalyzing") : t("identifyFoodItems")}</span>
            </button>
             {(isAutoLoggingActive || isListening || isScanningBarcode) && <p className="text-xs text-orange-600 mt-1 text-center" role="status">{t('manualIdentificationDisabled')}</p>}
          </div>
        )}
      </div>
      
      {isLoading && (loadingAction === 'identify' || loadingAction === 'barcodeFetching') && (
        <div className="flex flex-col items-center justify-center my-4 p-4 bg-sky-50 rounded-lg" role="status">
          <LoadingSpinner />
          <p className="mt-2 text-secondary font-medium">
            {loadingAction === 'identify' ? t('aiAnalyzing') : t('barcodeScanner.fetchingProductInfo', { barcode: selectedFoodForNutrition || '...' })}
          </p>
        </div>
      )}

      {error && !speechError && !barcodeScanError && <p className="text-red-700 bg-red-100 p-3 rounded-lg text-sm flex items-center space-x-2" role="alert">{React.cloneElement(ICONS.info, {className: "w-5 h-5 flex-shrink-0"})}<span>{error}</span></p>}

      {identifiedFoods.length > 0 && !isLoading && !isAutoLoggingActive && !isListening && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-dark">{t('selectIdentifiedItem')}</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-3">
            {identifiedFoods.map((food, index) => (
              <button key={index} onClick={() => handleSelectFoodForNutrition(food, 'gemini')} disabled={isLoading && loadingAction === 'nutrition'} aria-pressed={selectedFoodForNutrition === food}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ease-in-out border
                  ${selectedFoodForNutrition === food && loadingAction !== 'barcodeFetching' ? 'bg-primary text-white ring-2 ring-offset-1 ring-primary-focus shadow-md border-transparent' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-primary-focus'}`}>
                {food}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {isLoading && loadingAction === 'nutrition' && selectedFoodForNutrition && (
        <div className="flex flex-col items-center justify-center my-4 p-4 bg-sky-50 rounded-lg" role="status">
          <LoadingSpinner /> <p className="mt-2 text-secondary font-medium">{t('fetchingNutritionFor', { foodName: selectedFoodForNutrition })}</p>
        </div>
      )}

      {selectedFoodForNutrition && nutritionInfo && !isLoading && (
        <div className="mt-6 p-4 sm:p-5 border-2 border-primary rounded-xl bg-green-50 shadow-sm">
          <h3 className="text-xl font-semibold text-dark mb-3">{t('nutritionFor', { foodName: nutritionInfo.name })}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-slate-700 mb-4">
            <p><strong>{t('calories')}:</strong> {nutritionInfo.calories.toFixed(0)} kcal</p>
            <p><strong>{t('protein')}:</strong> {nutritionInfo.protein.toFixed(1)} g</p>
            <p><strong>{t('carbs')}:</strong> {nutritionInfo.carbs.toFixed(1)} g</p>
            <p><strong>{t('fat')}:</strong> {nutritionInfo.fat.toFixed(1)} g</p>
            <p className="sm:col-span-2"><strong>{t('servingSize')}:</strong> {nutritionInfo.serving_size_g || DEFAULT_NUTRITION_SERVING_SIZE_G}g ({t(DEFAULT_SERVING_QUANTITY)})</p>
          </div>
          
          <div className="mb-4">
              <h4 className="text-md font-semibold text-dark mb-1">{t('macronutrientBreakdown.titleItem')}</h4>
              <MacronutrientPieChart 
                protein={nutritionInfo.protein} 
                carbs={nutritionInfo.carbs} 
                fat={nutritionInfo.fat} 
              />
          </div>

          <button onClick={handleAddFoodToLog} className="mt-3 px-6 py-2.5 bg-primary text-white rounded-lg shadow-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-2 transition-colors flex items-center space-x-2 font-medium" aria-label={t('addToDailyLog')} >
            {React.cloneElement(ICONS.plus, {className: "w-5 h-5"})} <span>{t('addToDailyLog')}</span>
          </button>
        </div>
      )}
       {selectedFoodForNutrition && !nutritionInfo && !isLoading && !error && !speechError && !barcodeScanError && (
         <p className="text-slate-600 mt-4 p-3 bg-slate-100 rounded-lg" role="status">{t('errorCouldNotFetchNutrition', { foodName: selectedFoodForNutrition })}</p>
       )}
    </div>
  );
};

export default TrackerTab;
