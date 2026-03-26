// frontend/src/pages/FileConverterPage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../api";
import { 
  ArrowRight, Upload, Download, FileText, Image, File, 
  X, CheckCircle, AlertCircle, Loader2, Menu, Zap,
  FileSpreadsheet, FileCode, FileType, RefreshCw,
  History, Clock, ArrowLeft, Home, Trash2, Copy,
  Shield, Sparkles, Database, Cloud, Lock, Eye,
  ChevronDown, ChevronUp, Settings, Star, TrendingUp,
  Layers, Palette, Maximize2, Minimize2, Grid, List
} from "lucide-react";

export default function FileConverterPage() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fromFormat, setFromFormat] = useState("");
  const [toFormat, setToFormat] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [conversionHistory, setConversionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState("medium");
  const [imageQuality, setImageQuality] = useState("high");
  const [layoutPreserve, setLayoutPreserve] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [animatedBackground, setAnimatedBackground] = useState(true);
  const [recentConversions, setRecentConversions] = useState([]);
  
  const fileInputRef = useRef(null);
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    loadConversionHistory();
    loadRecentConversions();
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadConversionHistory = async () => {
    try {
      const response = await api.get('/api/conversion-history');
      setConversionHistory(response.data);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const loadRecentConversions = () => {
    const saved = localStorage.getItem('recent_conversions');
    if (saved) {
      setRecentConversions(JSON.parse(saved));
    }
  };

  const saveRecentConversion = (from, to, filename) => {
    const newConversion = {
      id: Date.now(),
      from,
      to,
      filename,
      date: new Date().toISOString(),
      size: selectedFile?.size
    };
    const updated = [newConversion, ...(recentConversions || [])].slice(0, 10);
    setRecentConversions(updated);
    localStorage.setItem('recent_conversions', JSON.stringify(updated));
  };

  const formatOptions = [
    { value: "pdf", label: "PDF", icon: "📄", color: "#e74c3c", description: "Portable Document Format", extensions: ["pdf"] },
    { value: "word", label: "Word", icon: "📝", color: "#2c3e50", description: "Microsoft Word Document", extensions: ["docx", "doc"] },
    { value: "ppt", label: "PowerPoint", icon: "📊", color: "#e67e22", description: "PowerPoint Presentation", extensions: ["pptx", "ppt"] },
    { value: "jpg", label: "JPG", icon: "🖼️", color: "#3498db", description: "JPEG Image", extensions: ["jpg", "jpeg"] },
    { value: "png", label: "PNG", icon: "🎨", color: "#9b59b6", description: "PNG Image", extensions: ["png"] },
    { value: "txt", label: "Text", icon: "📃", color: "#95a5a6", description: "Plain Text", extensions: ["txt", "md"] }
  ];

  const getFormatIcon = (format) => {
    const opt = formatOptions.find(f => f.value === format);
    return opt ? opt.icon : "📄";
  };

  const getFormatColor = (format) => {
    const opt = formatOptions.find(f => f.value === format);
    return opt ? opt.color : "#666";
  };

  const getFormatLabel = (format) => {
    const opt = formatOptions.find(f => f.value === format);
    return opt ? opt.label : format.toUpperCase();
  };

  const detectFileFormat = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const formatMap = {
      'pdf': 'pdf',
      'docx': 'word',
      'doc': 'word',
      'pptx': 'ppt',
      'ppt': 'ppt',
      'jpg': 'jpg',
      'jpeg': 'jpg',
      'png': 'png',
      'txt': 'txt',
      'md': 'txt'
    };
    return formatMap[ext] || ext;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError("File size exceeds 50MB limit");
        return;
      }
      setSelectedFile(file);
      const detected = detectFileFormat(file.name);
      setDetectedFormat(detected);
      setFromFormat(detected);
      setToFormat("");
      setError(null);
      setSuccess(false);
      setConversionProgress(0);
    }
  };

  const simulateProgress = () => {
    setConversionProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      setConversionProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressIntervalRef.current);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setError("Please select a file to convert");
      return;
    }
    
    if (!fromFormat || !toFormat) {
      setError("Please select source and target formats");
      return;
    }
    
    if (fromFormat === toFormat) {
      setError("Source and target formats cannot be the same");
      return;
    }

    setIsConverting(true);
    setError(null);
    setSuccess(false);
    simulateProgress();

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('from_format', fromFormat);
    formData.append('to_format', toFormat);

    try {
      console.log("Converting:", { fromFormat, toFormat, fileName: selectedFile.name });
      
      const response = await api.post('/api/convert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'blob',
        timeout: 120000
      });

      console.log("Conversion response:", response.status);
      
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      let ext = toFormat;
      if (toFormat === 'word') ext = 'docx';
      if (toFormat === 'ppt') ext = 'pptx';
      const filename = `${selectedFile.name.split('.')[0]}_converted_${Date.now()}.${ext}`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
      setConversionProgress(100);
      setTimeout(() => setConversionProgress(0), 1000);
      setSuccess(true);
      saveRecentConversion(fromFormat, toFormat, filename);
      loadConversionHistory();
      
      setTimeout(() => setSuccess(false), 5000);
      
    } catch (err) {
      console.error("Conversion error:", err);
      console.error("Error details:", err.response);
      setError(err.response?.data?.error || err.message || "Conversion failed. Please try again.");
      setConversionProgress(0);
    } finally {
      setIsConverting(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFromFormat("");
    setToFormat("");
    setDetectedFormat("");
    setError(null);
    setSuccess(false);
    setConversionProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const goBack = () => {
    window.location.href = '/';
  };

  const getFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const popularConversions = [
    { from: "pdf", to: "word", icon: "📄→📝", label: "PDF to Word" },
    { from: "word", to: "pdf", icon: "📝→📄", label: "Word to PDF" },
    { from: "ppt", to: "pdf", icon: "📊→📄", label: "PPT to PDF" },
    { from: "pdf", to: "ppt", icon: "📄→📊", label: "PDF to PPT" },
    { from: "jpg", to: "pdf", icon: "🖼️→📄", label: "JPG to PDF" },
    { from: "pdf", to: "jpg", icon: "📄→🖼️", label: "PDF to JPG" }
  ];

  const quickConvert = (from, to) => {
    setFromFormat(from);
    setToFormat(to);
    if (selectedFile) {
      handleConvert();
    }
  };

  return (
    <div style={{
      width: "100%",
      minHeight: "100vh",
      background: "#ffffff",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: "relative",
      overflowX: "hidden"
    }}>
      {/* Animated Background - White/Black theme */}
      {animatedBackground && (
        <>
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "radial-gradient(circle at 20% 50%, rgba(0,0,0,0.02) 0%, transparent 50%)",
            pointerEvents: "none",
            animation: "pulse 4s ease-in-out infinite"
          }} />
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cdefs%3E%3Cpattern id=\"grid\" width=\"60\" height=\"60\" patternUnits=\"userSpaceOnUse\"%3E%3Cpath d=\"M 60 0 L 0 0 0 60\" fill=\"none\" stroke=\"rgba(0,0,0,0.03)\" stroke-width=\"1\"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\"100%25\" height=\"100%25\" fill=\"url(%23grid)\"/%3E%3C/svg%3E')",
            pointerEvents: "none",
            opacity: 0.3
          }} />
        </>
      )}

      {/* Floating Particles - Black theme */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        overflow: "hidden"
      }}>
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              background: "rgba(0,0,0,0.1)",
              borderRadius: "50%",
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Header - White/Black theme */}
      <div style={{
        background: "#ffffff",
        borderBottom: "1px solid #e0e0e0",
        padding: isMobile ? "16px 20px" : "20px 40px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button
              onClick={goBack}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#f5f5f5",
                border: "1px solid #e0e0e0",
                borderRadius: "40px",
                padding: "10px 20px",
                cursor: "pointer",
                color: "#000000",
                transition: "all 0.3s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#e0e0e0"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#f5f5f5"}
            >
              <ArrowLeft size={18} />
              <span>Back to Chat</span>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                background: "#000000",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Zap size={24} color="#ffffff" />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: "24px", color: "#000000", fontWeight: "700" }}>
                  File Converter
                </h1>
                <p style={{ margin: 0, fontSize: "12px", color: "#666666" }}>
                  Convert any file format with ease
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: isMobile ? "20px" : "40px",
        position: "relative",
        zIndex: 1
      }}>
        {/* Hero Section */}
        <div style={{
          textAlign: "center",
          marginBottom: "40px",
          animation: "fadeInUp 0.6s ease-out"
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            background: "#f5f5f5",
            padding: "8px 20px",
            borderRadius: "40px",
            marginBottom: "20px"
          }}>
            <Sparkles size={18} color="#000000" />
            <span style={{ fontSize: "14px", color: "#666666" }}>Powered by LeadSOC-AI Technology</span>
          </div>
          <h2 style={{
            fontSize: isMobile ? "28px" : "40px",
            fontWeight: "800",
            color: "#000000",
            marginBottom: "16px"
          }}>
            Convert Anything to Anything
          </h2>
          <p style={{
            fontSize: "16px",
            color: "#666666",
            maxWidth: "600px",
            margin: "0 auto"
          }}>
            Professional file conversion with high quality output. Support for PDF, Word, PowerPoint, Images, and more.
          </p>
        </div>

        {/* Quick Convert Cards - White/Black theme */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(6, 1fr)",
          gap: "12px",
          marginBottom: "40px"
        }}>
          {popularConversions.map((conv, index) => (
            <button
              key={index}
              onClick={() => quickConvert(conv.from, conv.to)}
              style={{
                background: "#f5f5f5",
                border: "1px solid #e0e0e0",
                borderRadius: "16px",
                padding: "12px",
                cursor: "pointer",
                transition: "all 0.3s",
                color: "#000000"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e0e0e0";
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f5f5f5";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "6px" }}>{conv.icon}</div>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#000000" }}>{conv.label}</div>
            </button>
          ))}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "24px",
          marginBottom: "40px"
        }}>
          {/* File Upload Card - White theme */}
          <div style={{
            background: "#ffffff",
            borderRadius: "24px",
            padding: "24px",
            border: "1px solid #e0e0e0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
          }}>
            <h3 style={{ fontSize: "20px", color: "#000000", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Upload size={20} /> Upload File
            </h3>
            
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFileSelect({ target: { files: [file] } });
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#000000" : "#e0e0e0"}`,
                borderRadius: "16px",
                padding: "40px",
                textAlign: "center",
                background: dragOver ? "rgba(0,0,0,0.02)" : "#fafafa",
                cursor: "pointer",
                transition: "all 0.3s",
                marginBottom: "20px"
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: "none" }}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
              />
              {selectedFile ? (
                <div>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>
                    {getFormatIcon(detectedFormat)}
                  </div>
                  <div style={{ fontWeight: "600", color: "#000000", marginBottom: "4px" }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666666", marginBottom: "12px" }}>
                    {getFileSize(selectedFile.size)} • {detectedFormat.toUpperCase()}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); clearFile(); }}
                    style={{
                      padding: "6px 16px",
                      background: "#f5f5f5",
                      border: "1px solid #e0e0e0",
                      borderRadius: "20px",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#666666"
                    }}
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>📁</div>
                  <div style={{ fontSize: "16px", color: "#666666", marginBottom: "8px" }}>
                    Drop your file here
                  </div>
                  <div style={{ fontSize: "12px", color: "#999999" }}>
                    or click to browse (Max 50MB)
                  </div>
                </div>
              )}
            </div>

            {selectedFile && (
              <>
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "12px", color: "#666666", marginBottom: "6px", display: "block" }}>
                        From Format
                      </label>
                      <select
                        value={fromFormat}
                        onChange={(e) => setFromFormat(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "12px",
                          border: "1px solid #e0e0e0",
                          fontSize: "14px",
                          background: "#ffffff",
                          color: "#000000"
                        }}
                      >
                        <option value="">Select format</option>
                        {formatOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "12px", color: "#666666", marginBottom: "6px", display: "block" }}>
                        To Format
                      </label>
                      <select
                        value={toFormat}
                        onChange={(e) => setToFormat(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "12px",
                          border: "1px solid #e0e0e0",
                          fontSize: "14px",
                          background: "#ffffff",
                          color: "#000000"
                        }}
                      >
                        <option value="">Select format</option>
                        {formatOptions.filter(opt => opt.value !== fromFormat).map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {isConverting && conversionProgress > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{
                        height: "4px",
                        background: "#f0f0f0",
                        borderRadius: "2px",
                        overflow: "hidden"
                      }}>
                        <div style={{
                          width: `${conversionProgress}%`,
                          height: "100%",
                          background: "#000000",
                          transition: "width 0.3s ease"
                        }} />
                      </div>
                      <p style={{ fontSize: "11px", color: "#666666", marginTop: "6px", textAlign: "center" }}>
                        Converting... {Math.round(conversionProgress)}%
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleConvert}
                    disabled={isConverting || !fromFormat || !toFormat}
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: "#000000",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "40px",
                      fontSize: "16px",
                      fontWeight: "600",
                      cursor: (!fromFormat || !toFormat || isConverting) ? "not-allowed" : "pointer",
                      opacity: (!fromFormat || !toFormat) ? 0.5 : 1,
                      transition: "all 0.3s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px"
                    }}
                  >
                    {isConverting ? (
                      <>
                        <Loader2 size={18} className="spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={18} />
                        Convert File Now
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Messages */}
            {success && (
              <div style={{
                marginTop: "16px",
                padding: "12px",
                background: "#e8f5e9",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                border: "1px solid #c8e6c9"
              }}>
                <CheckCircle size={16} color="#4caf50" />
                <span style={{ fontSize: "13px", color: "#2e7d32" }}>Conversion successful! File downloaded.</span>
              </div>
            )}

            {error && (
              <div style={{
                marginTop: "16px",
                padding: "12px",
                background: "#ffebee",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                border: "1px solid #ffcdd2"
              }}>
                <AlertCircle size={16} color="#f44336" />
                <span style={{ fontSize: "13px", color: "#c62828" }}>{error}</span>
              </div>
            )}
          </div>

          {/* Features & History Card - White theme */}
          <div style={{
            background: "#ffffff",
            borderRadius: "24px",
            padding: "24px",
            border: "1px solid #e0e0e0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", color: "#000000", display: "flex", alignItems: "center", gap: "8px" }}>
                <History size={18} /> Recent Conversions
              </h3>
              <button
                onClick={() => setShowHistory(!showHistory)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#666666",
                  fontSize: "12px"
                }}
              >
                {showHistory ? "Hide" : "View All"}
              </button>
            </div>

            {recentConversions.length > 0 ? (
              <div style={{ marginBottom: "24px" }}>
                {recentConversions.slice(0, showHistory ? 10 : 3).map((conv, index) => (
                  <div
                    key={conv.id}
                    style={{
                      padding: "12px",
                      borderBottom: index < (showHistory ? 9 : 2) ? "1px solid #f0f0f0" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        background: getFormatColor(conv.from),
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px"
                      }}>
                        {getFormatIcon(conv.from)}
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "500", color: "#000000" }}>
                          {conv.from.toUpperCase()} → {conv.to.toUpperCase()}
                        </div>
                        <div style={{ fontSize: "11px", color: "#999999" }}>
                          {formatDate(conv.date)} • {getFileSize(conv.size)}
                        </div>
                      </div>
                    </div>
                    <Download size={14} color="#666666" />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: "center",
                padding: "40px",
                color: "#999999",
                background: "#f9f9f9",
                borderRadius: "16px",
                marginBottom: "24px"
              }}>
                <History size={32} style={{ opacity: 0.3, marginBottom: "8px" }} />
                <p style={{ fontSize: "13px" }}>No conversion history yet</p>
              </div>
            )}

            {/* Features - White theme */}
            <div style={{
              background: "#fafafa",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid #f0f0f0"
            }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#000000", display: "flex", alignItems: "center", gap: "8px" }}>
                <Shield size={14} /> Premium Features
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#666666" }}>
                  <Lock size={12} /> Secure & Encrypted
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#666666" }}>
                  <Cloud size={12} /> Cloud Processing
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#666666" }}>
                  <Database size={12} /> 50MB Max File
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#666666" }}>
                  <TrendingUp size={12} /> High Quality Output
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Supported Formats Grid - White theme */}
        <div style={{
          background: "#fafafa",
          borderRadius: "24px",
          padding: "24px",
          border: "1px solid #e0e0e0"
        }}>
          <h3 style={{ fontSize: "18px", color: "#000000", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Layers size={18} /> Supported Formats
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
            gap: "16px"
          }}>
            {formatOptions.map((format, index) => (
              <div
                key={format.value}
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  border: "1px solid #e0e0e0"
                }}
              >
                <div style={{
                  width: "40px",
                  height: "40px",
                  background: format.color,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px"
                }}>
                  {format.icon}
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#000000" }}>{format.label}</div>
                  <div style={{ fontSize: "10px", color: "#666666" }}>{format.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          from {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          50% {
            opacity: 0.5;
          }
          to {
            transform: translateY(-100vh) translateX(100px);
            opacity: 0;
          }
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}