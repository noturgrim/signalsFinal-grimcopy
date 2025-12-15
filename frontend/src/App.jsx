import { useState, useCallback, useEffect, useRef } from "react";
import AudioPlayer from "./components/AudioPlayer";

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const App = () => {
  // State management
  const [selectedFile, setSelectedFile] = useState(null);
  const [humFrequency, setHumFrequency] = useState("auto");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [originalAudioUrl, setOriginalAudioUrl] = useState(null);
  const [processedAudioUrl, setProcessedAudioUrl] = useState(null);
  const [processedAudioData, setProcessedAudioData] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [detectedRegion, setDetectedRegion] = useState(null);
  const [detectedHumFrequency, setDetectedHumFrequency] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Auto-detect power frequency based on timezone/location
  useEffect(() => {
    const detectFrequency = () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const hz60Regions = [
        "America/",
        "US/",
        "Canada/",
        "Mexico/",
        "Brazil/",
        "Colombia/",
        "Venezuela/",
        "Asia/Tokyo",
        "Asia/Seoul",
        "Asia/Taipei",
        "Asia/Manila",
        "Asia/Riyadh",
        "Asia/Kuwait",
        "Pacific/Guam",
        "Pacific/Saipan",
      ];

      const is60Hz = hz60Regions.some((region) => timezone.startsWith(region));

      if (is60Hz) {
        setDetectedRegion("60 Hz");
      } else {
        setDetectedRegion("50 Hz");
      }
      // Keep auto as default
      setHumFrequency("auto");
    };

    detectFrequency();
  }, []);

  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  const validateFile = (file) => {
    const maxSize = 50 * 1024 * 1024;
    const allowedTypes = [
      "audio/wav",
      "audio/mpeg",
      "audio/mp3",
      "audio/ogg",
      "audio/flac",
    ];
    const allowedExtensions = [".wav", ".mp3", ".ogg", ".flac"];

    if (file.size > maxSize) {
      throw new Error(
        `File too large. Maximum size is 50MB (current: ${(
          file.size /
          1024 /
          1024
        ).toFixed(2)}MB)`
      );
    }

    const fileExtension = "." + file.name.split(".").pop().toLowerCase();
    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(fileExtension)
    ) {
      throw new Error(
        "Invalid file type. Please upload WAV, MP3, OGG, or FLAC files."
      );
    }
  };

  // Analyze audio to detect hum frequency
  const analyzeAudio = useCallback(
    async (file) => {
      if (humFrequency !== "auto") return; // Only analyze if auto mode

      setIsAnalyzing(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_URL}/api/detect-hum`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.detectedFrequency) {
            setDetectedHumFrequency(data.detectedFrequency);
            setSuccessMessage(
              `Detected ${data.detectedFrequency} Hz hum in audio`
            );
          } else {
            setSuccessMessage("No hum detected - audio appears clean");
          }
        }
      } catch (err) {
        console.error("Analysis error:", err);
        // Don't show error - analysis is optional
      } finally {
        setIsAnalyzing(false);
      }
    },
    [humFrequency]
  );

  // Calculate estimated processing time based on file size
  const calculateEstimatedTime = useCallback((fileSize) => {
    // Rough estimate: ~2-5 seconds per MB
    const sizeInMB = fileSize / (1024 * 1024);
    const seconds = Math.ceil(sizeInMB * 3);

    if (seconds < 5) return "a few seconds";
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }, []);

  const handleFileChange = useCallback(
    (event) => {
      const file = event.target.files[0];
      if (file) {
        try {
          validateFile(file);
          setSelectedFile(file);
          setError(null);
          setSuccessMessage(null);
          setUploadProgress(0);
          setDetectedHumFrequency(null);
          setShowSuccess(false);
          setLastError(null);

          // Calculate and set estimated processing time
          const timeEstimate = calculateEstimatedTime(file.size);
          setEstimatedTime(timeEstimate);

          // Warn for large files
          const sizeInMB = file.size / (1024 * 1024);
          if (sizeInMB > 25) {
            setSuccessMessage(
              `Large file detected (${sizeInMB.toFixed(
                1
              )} MB). Processing may take ${timeEstimate}.`
            );
          }

          if (originalAudioUrl) URL.revokeObjectURL(originalAudioUrl);
          if (processedAudioUrl) URL.revokeObjectURL(processedAudioUrl);

          const url = URL.createObjectURL(file);
          setOriginalAudioUrl(url);
          setProcessedAudioUrl(null);
          setProcessedAudioData(null);

          // Analyze audio if in auto mode
          analyzeAudio(file);
        } catch (err) {
          setError(err.message);
          setSelectedFile(null);
          if (originalAudioUrl) URL.revokeObjectURL(originalAudioUrl);
          setOriginalAudioUrl(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      }
    },
    [originalAudioUrl, processedAudioUrl, analyzeAudio, calculateEstimatedTime]
  );

  const handleFrequencyChange = useCallback(
    (freq) => {
      setHumFrequency(freq);
      setDetectedHumFrequency(null); // Clear detection when manually changed

      // If switching to auto and file is loaded, analyze it
      if (freq === "auto" && selectedFile) {
        analyzeAudio(selectedFile);
      }
    },
    [selectedFile, analyzeAudio]
  );

  // Handle drag and drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        try {
          validateFile(file);
          setSelectedFile(file);
          setError(null);
          setSuccessMessage(null);
          setUploadProgress(0);
          setDetectedHumFrequency(null);
          setShowSuccess(false);
          setLastError(null);

          // Calculate and set estimated processing time
          const timeEstimate = calculateEstimatedTime(file.size);
          setEstimatedTime(timeEstimate);

          // Warn for large files
          const sizeInMB = file.size / (1024 * 1024);
          if (sizeInMB > 25) {
            setSuccessMessage(
              `Large file detected (${sizeInMB.toFixed(
                1
              )} MB). Processing may take ${timeEstimate}.`
            );
          }

          if (originalAudioUrl) URL.revokeObjectURL(originalAudioUrl);
          if (processedAudioUrl) URL.revokeObjectURL(processedAudioUrl);

          const url = URL.createObjectURL(file);
          setOriginalAudioUrl(url);
          setProcessedAudioUrl(null);
          setProcessedAudioData(null);

          // Analyze audio if in auto mode
          analyzeAudio(file);
        } catch (err) {
          setError(err.message);
          setSelectedFile(null);
          if (originalAudioUrl) URL.revokeObjectURL(originalAudioUrl);
          setOriginalAudioUrl(null);
        }
      }
    },
    [originalAudioUrl, processedAudioUrl, analyzeAudio, calculateEstimatedTime]
  );

  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const handleProcessAudio = useCallback(async () => {
    if (!selectedFile) {
      setError("Please select an audio file first");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);
    setUploadProgress(0);
    setShowSuccess(false);
    setIsRetrying(false);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("humFrequency", humFrequency);

      const response = await fetch(`${API_URL}/api/process-audio`, {
        method: "POST",
        body: formData,
        signal: abortController.signal,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `Server error (${response.status})`;

        // Store error for retry
        setLastError({
          message: errorMessage,
          file: selectedFile,
          frequency: humFrequency,
        });

        // Provide more helpful error messages
        if (response.status === 413) {
          throw new Error(
            "File too large. Please use a smaller file (max 50MB)."
          );
        } else if (response.status === 503) {
          throw new Error(
            "Server is currently unavailable. Please try again in a moment."
          );
        } else if (response.status >= 500) {
          throw new Error(
            `Server error: ${errorMessage}. You can retry processing.`
          );
        } else {
          throw new Error(errorMessage);
        }
      }

      const data = await response.json();
      setUploadProgress(100);

      if (processedAudioUrl) {
        URL.revokeObjectURL(processedAudioUrl);
      }

      const audioBlob = base64ToBlob(data.processedAudio, "audio/wav");
      const audioUrl = URL.createObjectURL(audioBlob);

      setProcessedAudioUrl(audioUrl);
      setProcessedAudioData(data.processedAudio);
      setDetectedHumFrequency(data.detectedFrequency || data.humFrequency);
      setSuccessMessage(data.message || "Audio processed successfully!");
      setShowSuccess(true);
      setLastError(null);

      // Auto-hide success animation after 2 seconds
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      clearInterval(progressInterval);
      setUploadProgress(0);

      if (err.name === "AbortError") {
        setError("Processing cancelled");
        setLastError(null);
      } else {
        setError(err.message || "Failed to process audio. Please try again.");
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [selectedFile, humFrequency, processedAudioUrl]);

  const handleCancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (lastError && selectedFile) {
      setIsRetrying(true);
      handleProcessAudio();
    }
  }, [lastError, selectedFile, handleProcessAudio]);

  const handleDownload = useCallback(() => {
    if (!processedAudioData) return;

    const audioBlob = base64ToBlob(processedAudioData, "audio/wav");
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedFile.name.split(".")[0]}_clean.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [processedAudioData, selectedFile]);

  const handleResetClick = useCallback(() => {
    // Only show confirmation if there's processed audio
    if (processedAudioUrl) {
      setShowConfirmReset(true);
    } else {
      handleResetConfirmed();
    }
  }, [processedAudioUrl]);

  const handleResetConfirmed = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (originalAudioUrl) URL.revokeObjectURL(originalAudioUrl);
    if (processedAudioUrl) URL.revokeObjectURL(processedAudioUrl);

    setSelectedFile(null);
    setOriginalAudioUrl(null);
    setProcessedAudioUrl(null);
    setProcessedAudioData(null);
    setError(null);
    setSuccessMessage(null);
    setHumFrequency("auto");
    setDetectedHumFrequency(null);
    setIsProcessing(false);
    setUploadProgress(0);
    setShowConfirmReset(false);
    setShowSuccess(false);
    setEstimatedTime(null);
    setLastError(null);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [originalAudioUrl, processedAudioUrl]);

  const handleCancelReset = useCallback(() => {
    setShowConfirmReset(false);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Premium Header */}
      <header className="pt-8 pb-6 sm:pt-12 sm:pb-8 border-b border-neutral-200/50">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <div className="flex flex-col items-center">
            <div className="mb-4 p-4 bg-white border-2 border-neutral-200 rounded-2xl shadow-sm">
              <img
                src="/hum.svg"
                alt="Audio Hum Remover"
                className="w-12 h-12 sm:w-14 sm:h-14"
              />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3 tracking-tight">
              Audio Hum Remover
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 font-medium max-w-md text-center">
              Professional power line interference removal using advanced signal
              processing
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-4 max-w-3xl">
        {/* How to Use - Simple Steps */}
        <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-lg border border-neutral-200/60 p-5 sm:p-6 mb-6">
          <h2 className="text-sm font-semibold text-neutral-700 mb-4">
            How to Use
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-neutral-800 text-white rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  Upload Audio
                </p>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Drop or select your audio file
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-neutral-800 text-white rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  Auto-Detect
                </p>
                <p className="text-xs text-neutral-600 mt-0.5">
                  We identify the hum frequency
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-neutral-800 text-white rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  Process & Download
                </p>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Get your clean audio file
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works - Process Explanation */}
        <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-lg border border-neutral-200/60 p-5 sm:p-6 mb-6">
          <h2 className="text-sm font-semibold text-neutral-700 mb-3">
            How The Cleaning Process Works
          </h2>
          <div className="space-y-3 text-sm text-neutral-600">
            <p className="leading-relaxed">
              Power lines create electrical interference at specific frequencies
              (50 Hz or 60 Hz depending on your region). This interference
              appears in your recordings as an annoying background hum.
            </p>
            <p className="leading-relaxed">
              Our tool identifies this hum frequency in your audio and applies a
              specialized filter called a{" "}
              <span className="font-medium text-neutral-800">notch filter</span>
              . Think of it like noise-canceling headphones, but for recorded
              audio.
            </p>
            <p className="leading-relaxed">
              The filter removes the hum frequency and its{" "}
              <span className="font-medium text-neutral-800">harmonics</span>{" "}
              (multiples of the main frequency like 100 Hz, 150 Hz, etc.) while
              preserving your voice or music. The result is clean,
              professional-sounding audio without the electrical buzz.
            </p>
          </div>
        </div>

        {/* Main Card - Clean Glass */}
        <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-lg border border-neutral-200/60 p-5 sm:p-8 mb-6 relative overflow-hidden">
          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-20 flex items-center justify-center rounded-2xl">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 relative">
                  <svg
                    className="animate-spin h-12 w-12 text-neutral-700"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-20"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
                <p className="text-base font-medium text-neutral-900 mb-1">
                  Processing Audio
                </p>
                <p className="text-sm text-neutral-600">
                  Removing {humFrequency} Hz interference...
                </p>
                {uploadProgress > 0 && (
                  <div className="w-48 mx-auto mt-4 bg-neutral-200 rounded-full h-1.5">
                    <div
                      className="bg-neutral-800 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                <button
                  onClick={handleCancelProcessing}
                  className="mt-5 px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="relative z-10 space-y-5">
            {/* Upload Section */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Audio File
              </label>
              <input
                type="file"
                accept=".wav,.mp3,.ogg,.flac"
                onChange={handleFileChange}
                className="hidden"
                id="audio-upload"
                ref={fileInputRef}
                disabled={isProcessing}
              />
              <label
                htmlFor="audio-upload"
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex items-center justify-center w-full px-6 py-10 backdrop-blur-md border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                  isProcessing
                    ? "opacity-60 cursor-not-allowed border-neutral-300 bg-white/50"
                    : isDragging
                    ? "border-neutral-800 bg-neutral-100 scale-[1.02] shadow-lg"
                    : "border-neutral-300 hover:border-neutral-400 bg-white/50 hover:bg-white/60"
                }`}
              >
                {selectedFile ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-neutral-800 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-neutral-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-neutral-600 mt-0.5">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-14 h-14 mx-auto mb-3 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-7 h-7 text-neutral-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-neutral-700 mb-1">
                      Drop your audio file here
                    </p>
                    <p className="text-xs text-neutral-500 mb-2">
                      or click to browse
                    </p>
                    <p className="text-xs text-neutral-400">
                      WAV, MP3, OGG, FLAC • Max 50MB
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* Frequency Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-neutral-700">
                  Hum Frequency
                </label>
                {isAnalyzing && (
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <svg
                      className="animate-spin h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Identifying Hz...
                  </span>
                )}
                {!isAnalyzing && detectedHumFrequency && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Detected: {detectedHumFrequency} Hz
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleFrequencyChange("auto")}
                  disabled={isProcessing}
                  className={`px-3 py-4 rounded-lg font-medium transition-all duration-200 ${
                    humFrequency === "auto"
                      ? "bg-neutral-800 text-white"
                      : "backdrop-blur-md bg-white/50 text-neutral-700 border border-neutral-200 hover:bg-white/70"
                  } ${isProcessing ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div className="font-semibold text-base">Auto</div>
                  <div className="text-xs mt-1 opacity-75">Detect</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleFrequencyChange(50)}
                  disabled={isProcessing}
                  className={`px-3 py-4 rounded-lg font-medium transition-all duration-200 ${
                    humFrequency === 50
                      ? "bg-neutral-800 text-white"
                      : "backdrop-blur-md bg-white/50 text-neutral-700 border border-neutral-200 hover:bg-white/70"
                  } ${isProcessing ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div className="font-semibold text-base">50 Hz</div>
                  <div className="text-xs mt-1 opacity-75">Europe/Asia</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleFrequencyChange(60)}
                  disabled={isProcessing}
                  className={`px-3 py-4 rounded-lg font-medium transition-all duration-200 ${
                    humFrequency === 60
                      ? "bg-neutral-800 text-white"
                      : "backdrop-blur-md bg-white/50 text-neutral-700 border border-neutral-200 hover:bg-white/70"
                  } ${isProcessing ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div className="font-semibold text-base">60 Hz</div>
                  <div className="text-xs mt-1 opacity-75">Americas</div>
                </button>
              </div>
              <p className="text-xs text-neutral-500 mt-2 text-center">
                Auto mode detects hum frequency automatically
              </p>
            </div>

            {/* Estimated Time */}
            {estimatedTime && selectedFile && !processedAudioUrl && (
              <div className="text-center text-xs text-neutral-500">
                Estimated processing time: {estimatedTime}
              </div>
            )}

            {/* Process Button */}
            <button
              onClick={handleProcessAudio}
              disabled={!selectedFile || isProcessing}
              className="w-full px-6 py-3 bg-neutral-800 text-white font-medium text-sm rounded-lg hover:bg-neutral-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isProcessing ? "Processing..." : "Process Audio"}
            </button>

            {/* Messages */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-red-700 flex-1">{error}</p>
                  {lastError && (
                    <button
                      onClick={handleRetry}
                      disabled={isRetrying}
                      className="text-xs font-medium text-red-700 hover:text-red-800 underline whitespace-nowrap"
                    >
                      {isRetrying ? "Retrying..." : "Retry"}
                    </button>
                  )}
                </div>
              </div>
            )}
            {successMessage && !error && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  {showSuccess && (
                    <svg
                      className="w-5 h-5 text-green-600 animate-checkmark flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results - Enhanced Layout */}
        {(originalAudioUrl || processedAudioUrl) && (
          <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-lg border border-neutral-200/60 p-5 sm:p-8 space-y-6">
            {/* Header with Stats */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-1">
                  Audio Results
                </h2>
                <p className="text-xs text-neutral-500">
                  Compare original and processed audio
                </p>
              </div>
              {processedAudioUrl && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-xs font-medium text-green-700">
                    Processed
                  </span>
                </div>
              )}
            </div>

            {/* Audio Players */}
            <div className="space-y-4">
              {/* Original Audio */}
              {originalAudioUrl && (
                <div className="relative group">
                  <div className="backdrop-blur-md bg-gradient-to-br from-white/80 to-white/60 rounded-xl p-5 border border-neutral-200 hover:border-neutral-300 transition-all duration-200 shadow-sm hover:shadow-md">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-neutral-700 to-neutral-900 rounded-xl flex items-center justify-center shadow-lg">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-neutral-900 mb-0.5">
                            Original Audio
                          </h3>
                          <p className="text-xs text-neutral-500">
                            Contains {detectedHumFrequency || humFrequency} Hz
                            interference
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-md">
                          {detectedHumFrequency || humFrequency} Hz
                        </span>
                      </div>
                    </div>
                    <AudioPlayer src={originalAudioUrl} variant="default" />
                    <div className="mt-3 pt-3 border-t border-neutral-200">
                      <p className="text-xs text-neutral-600 font-medium truncate">
                        📄 {selectedFile?.name}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Arrow Indicator */}
              {originalAudioUrl && (processedAudioUrl || isProcessing) && (
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full">
                    <svg
                      className={`w-4 h-4 text-neutral-600 ${
                        isProcessing ? "animate-pulse" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                    <span className="text-xs font-medium text-neutral-600">
                      {isProcessing ? "Processing..." : "Processed"}
                    </span>
                  </div>
                </div>
              )}

              {/* Skeleton Loader for Processing */}
              {isProcessing && !processedAudioUrl && (
                <div className="relative">
                  <div className="backdrop-blur-md bg-gradient-to-br from-white/80 to-white/60 rounded-xl p-5 border border-neutral-200 animate-pulse-subtle">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-200 rounded-xl animate-pulse" />
                        <div>
                          <div className="h-4 w-24 bg-neutral-200 rounded mb-1.5" />
                          <div className="h-3 w-32 bg-neutral-100 rounded" />
                        </div>
                      </div>
                      <div className="h-6 w-16 bg-neutral-200 rounded-md" />
                    </div>
                    <div className="w-full h-10 bg-neutral-200 rounded-lg mb-3" />
                    <div className="pt-3 border-t border-neutral-200">
                      <div className="h-3 w-40 bg-neutral-100 rounded mb-2" />
                      <div className="h-3 w-20 bg-neutral-100 rounded" />
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
                      <p className="text-sm font-medium text-neutral-700">
                        Processing audio...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Processed Audio */}
              {processedAudioUrl && (
                <div className="relative group">
                  <div className="backdrop-blur-md bg-gradient-to-br from-green-50/80 to-white/80 rounded-xl p-5 border-2 border-green-200 hover:border-green-300 transition-all duration-200 shadow-sm hover:shadow-md">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-neutral-900 mb-0.5">
                            Clean Audio
                          </h3>
                          <p className="text-xs text-green-700 font-medium">
                            Interference removed successfully
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-green-100 border border-green-300 text-green-800 text-xs font-semibold rounded-md">
                          Clean
                        </span>
                      </div>
                    </div>
                    <AudioPlayer src={processedAudioUrl} variant="success" />
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs text-neutral-700 font-medium">
                        ✨ Filtered {detectedHumFrequency || humFrequency} Hz +
                        harmonics (120Hz, 180Hz, etc.)
                      </p>
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        Ready to download
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {processedAudioUrl && (
              <div className="pt-4 border-t border-neutral-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleDownload}
                    disabled={!processedAudioData}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-neutral-800 text-white font-medium text-sm rounded-xl hover:bg-neutral-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download Clean Audio
                  </button>
                  <button
                    onClick={handleResetClick}
                    className="flex items-center justify-center gap-2 px-5 py-3 backdrop-blur-md bg-white/80 text-neutral-700 font-medium text-sm rounded-xl border border-neutral-200 hover:bg-white hover:border-neutral-300 transition-all duration-200"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Process New Audio
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmReset && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in duration-300">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-neutral-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    Reset and Start Over?
                  </h3>
                  <p className="text-sm text-neutral-600">
                    This will clear your current audio files and processed
                    results. You haven't downloaded the cleaned audio yet.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelReset}
                  className="flex-1 px-4 py-2.5 bg-neutral-100 text-neutral-700 font-medium text-sm rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetConfirmed}
                  className="flex-1 px-4 py-2.5 bg-neutral-800 text-white font-medium text-sm rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  Reset Anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-8 sm:py-12 mt-8 border-t border-neutral-200/50">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <span className="text-sm font-medium text-neutral-700">
              Dan Lius Monsales
            </span>
            <span className="text-neutral-300">•</span>
            <span className="text-sm font-medium text-neutral-700">
              Eduardo Miguel Cortes
            </span>
            <span className="text-neutral-300">•</span>
            <span className="text-sm font-medium text-neutral-700">
              Regine Christian Buenafe
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
