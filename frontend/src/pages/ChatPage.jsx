// frontend/src/pages/ChatPage.jsx - Complete with desktop automation and File Converter button
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../api";
import Message from "../components/Message";
import desktopFileAutomation from "../utils/desktopFileAutomation";
import { 
  Send, Plus, Menu, Zap, Paperclip, X, FileText, Download, 
  CheckCircle, Pause, Play, Image as ImageIcon, Sparkles, 
  Bot, Shield, Globe, Brain, Loader2, Camera, UploadCloud,
  CornerDownLeft, Clock, Minimize2, Maximize2, XCircle
} from "lucide-react";
import leadsocLogo from "../assets/leadsoc-logo.jpg";

export default function ChatPage({ chatId, onChatCreated, isSidebarOpen, onToggleSidebar }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [paused, setPaused] = useState(false);
  const [models, setModels] = useState(["tinyllama"]);
  const [selectedModel, setSelectedModel] = useState("tinyllama");
  const [isMobile, setIsMobile] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [localChatId, setLocalChatId] = useState(chatId);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState(null);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [documentMinimized, setDocumentMinimized] = useState(false);
  const [showDocumentSuccess, setShowDocumentSuccess] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [floatingBubbles, setFloatingBubbles] = useState([]);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [userScrolling, setUserScrolling] = useState(false);
  const [scrollTimeout, setScrollTimeout] = useState(null);
  const [messageAnimations, setMessageAnimations] = useState({});
  const [welcomeAnimation, setWelcomeAnimation] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hasAddedWelcomeMessage, setHasAddedWelcomeMessage] = useState(false);
  const [isNewlyCreatedChat, setIsNewlyCreatedChat] = useState(false);
  const [isFileAction, setIsFileAction] = useState(false);
  const [lastSearchResults, setLastSearchResults] = useState(null);
  const [isDesktopApp, setIsDesktopApp] = useState(false);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const fullContentRef = useRef("");
  const inputRef = useRef(null);
  const assistantMessageIdRef = useRef(null);
  const lastUserMessage = useRef("");
  const autoScrollEnabled = useRef(true);
  const { user } = useAuth();

  // Check if running in desktop app
  useEffect(() => {
    setIsDesktopApp(!!window.electronAPI);
    if (window.electronAPI) {
      desktopFileAutomation.init();
      console.log("✅ Running in desktop mode - file operations will be local");
    }
  }, []);

  // Create floating bubbles for background animation
  useEffect(() => {
    const bubbles = [];
    for (let i = 0; i < 30; i++) {
      bubbles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 150 + 50,
        delay: Math.random() * 8,
        duration: Math.random() * 15 + 15,
        opacity: Math.random() * 0.02 + 0.01,
        color: '#000000'
      });
    }
    setFloatingBubbles(bubbles);

    // Track mouse for parallax
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Welcome animation on first load
  useEffect(() => {
    setWelcomeAnimation(true);
    const timer = setTimeout(() => setWelcomeAnimation(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setLocalChatId(chatId);
    // Reset flags when chatId changes
    setHasAddedWelcomeMessage(false);
    setIsNewlyCreatedChat(false);
  }, [chatId]);

  // FIXED: Enhanced scroll handling - always scroll to bottom when new content arrives, unless user is scrolling up
  useEffect(() => {
    if (messages.length > 0 && !userScrolling && autoScrollEnabled.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, userScrolling]);

  // Add scroll event listener to detect user scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!container) return;
      
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      // Enable auto-scroll if user scrolls near bottom
      if (isNearBottom) {
        autoScrollEnabled.current = true;
      } else {
        // Disable auto-scroll if user scrolls up
        autoScrollEnabled.current = false;
        setUserScrolling(true);
        
        // Clear previous timeout
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        
        // Reset userScrolling after 2 seconds of no scroll activity
        const timeout = setTimeout(() => {
          setUserScrolling(false);
        }, 2000);
        setScrollTimeout(timeout);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [scrollTimeout]);

  useEffect(() => {
    api.get("/api/models")
      .then(res => {
        setModels(res.data);
        if (res.data.length > 0) setSelectedModel(res.data[0]);
      })
      .catch(err => console.error("Failed to load models:", err));
  }, []);

  // FIXED: Load messages when chat changes
  useEffect(() => {
    if (localChatId) {
      loadMessages();
    } else {
      setMessages([]);
      setHasAddedWelcomeMessage(false);
      setIsNewlyCreatedChat(false);
    }
  }, [localChatId]);

  // FIXED: After loading messages, add welcome message ONLY for brand new empty chats
  useEffect(() => {
    if (localChatId && messages.length === 0 && !loading && isNewlyCreatedChat && !hasAddedWelcomeMessage) {
      addWelcomeMessage();
    }
  }, [localChatId, messages, loading, isNewlyCreatedChat, hasAddedWelcomeMessage]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/chats/${localChatId}/messages`);
      setMessages(res.data);
      // Animate messages on load
      const animations = {};
      res.data.forEach((_, index) => {
        animations[index] = true;
      });
      setMessageAnimations(animations);
      setTimeout(() => setMessageAnimations({}), 500);
      // Reset auto-scroll when loading new chat
      autoScrollEnabled.current = true;
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Add welcome message ONLY for brand new chats and save to backend
  const addWelcomeMessage = async () => {
    if (!localChatId || hasAddedWelcomeMessage) return;
    
    try {
      setHasAddedWelcomeMessage(true);
      
      // Create a default welcome message from the assistant
      const desktopModeText = isDesktopApp ? 
        " (Running in Desktop Mode - Files will open on THIS computer)" : 
        " (Running in Web Mode - File operations use backend server)";
      
      const welcomeContent = `👋 Welcome to LeadSOC-AI, ${user?.display_name || 'there'}! I'm your intelligent assistant.${desktopModeText}

I can help you with:
• Answering questions and having conversations
• Creating and formatting Word documents
• Analyzing images using OCR technology
• Reading and explaining uploaded files (PDF, DOCX, TXT)
• Finding and opening files on your computer
• Opening applications like Chrome, VS Code, Excel
• Opening websites like Gmail, YouTube, WhatsApp

**How can I assist you today?** Just type your message below and I'll respond right away!`;
      
      const defaultMessage = {
        _id: 'welcome-' + Date.now(),
        role: "assistant",
        content: welcomeContent,
        created_at: new Date().toISOString(),
        isWelcome: true
      };
      
      // Add to local state first for immediate display
      setMessages([defaultMessage]);
      
      // Save to backend
      await api.post(`/api/chats/${localChatId}/messages`, {
        role: "assistant",
        content: welcomeContent
      });
      
      console.log("✅ Welcome message added to new chat");
    } catch (err) {
      console.error("Failed to add welcome message:", err);
      setHasAddedWelcomeMessage(false);
    }
  };

  const createNewChat = async () => {
    try {
      const res = await api.post("/api/chats", { model: selectedModel });
      const newChatId = res.data._id;
      setLocalChatId(newChatId);
      setHasAddedWelcomeMessage(false);
      setIsNewlyCreatedChat(true); // Mark as newly created chat
      onChatCreated(newChatId);
      return newChatId;
    } catch (err) {
      console.error("Failed to create chat:", err);
      return null;
    }
  };

  const pauseGeneration = () => {
    if (abortControllerRef.current && streaming) {
      abortControllerRef.current.abort();
      setPaused(true);
      setStreaming(false);
      
      if (fullContentRef.current) {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === assistantMessageIdRef.current
              ? { ...msg, content: fullContentRef.current, isStreaming: false }
              : msg
          )
        );
      }
    }
  };

  const resumeGeneration = async () => {
    if (!paused) return;
    
    setPaused(false);
    setStreaming(true);
    
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch(`${api.defaults.baseURL}/api/chats/${localChatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ 
          content: "Continue from where you left off: " + lastUserMessage.current,
          file_info: uploadedFile 
        }),
        signal: abortControllerRef.current.signal
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let receivedFirstToken = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.token) {
                if (!receivedFirstToken) {
                  receivedFirstToken = true;
                }

                fullContentRef.current += data.token;
                setMessages(prev =>
                  prev.map(msg =>
                    msg._id === assistantMessageIdRef.current
                      ? { ...msg, content: fullContentRef.current, isStreaming: true }
                      : msg
                  )
                );
              } 
              else if (data.document_ready) {
                const title = data.title || lastUserMessage.current.substring(0, 50) || "AI_Generated_Document";
                await generateDocument(data.content || fullContentRef.current, title);
              } 
              else if (data.done) {
                if (receivedFirstToken) {
                  setMessages(prev =>
                    prev.map(msg =>
                      msg._id === assistantMessageIdRef.current
                        ? { ...msg, content: fullContentRef.current, isStreaming: false }
                        : msg
                    )
                  );
                }
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error("Error parsing stream data:", e);
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Stream paused by user');
      } else {
        console.error("Failed to resume:", err);
        setStreamError(err.message || "Failed to resume generation.");
      }
    } finally {
      setStreaming(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    if (localChatId) {
      formData.append('chat_id', localChatId);
    }

    try {
      const res = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      const fileInfo = {
        file_id: res.data.file_id,
        filename: file.name,
        size: file.size,
        is_image: res.data.is_image || file.type.startsWith('image/')
      };

      if (res.data.image_data) {
        fileInfo.image_data = res.data.image_data;
      }

      setUploadedFile({
        ...res.data,
        ...fileInfo,
        name: file.name,
        is_image: res.data.is_image || file.type.startsWith('image/')
      });
      
      if (res.data.is_image || file.type.startsWith('image/')) {
        setShowImagePreview(true);
        setShowAnalysis(true);
        analyzeImage(res.data.file_id);
      } else {
        // For documents, we can analyze them too
        setShowAnalysis(true);
        // analyzeDocument(res.data.file_id);
      }
      
      // Don't automatically add text to input
      // Let user type their query separately
      
      if (inputRef.current) {
        inputRef.current.focus();
      }
      
      e.target.value = '';
      
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload file: " + (err.response?.data?.error || err.message));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const analyzeImage = async (fileId) => {
    setIsAnalyzing(true);
    try {
      const res = await api.get(`/api/analyze-image/${fileId}`);
      setAnalysisResult(res.data);
    } catch (err) {
      console.error("Image analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeDocument = async (fileId) => {
    setIsAnalyzing(true);
    try {
      const res = await api.get(`/api/explain-document/${fileId}`);
      setAnalysisResult(res.data);
    } catch (err) {
      console.error("Document analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // FIXED: Enhanced document generation function
  const generateDocument = async (content, title) => {
    try {
      setShowDocumentSuccess(false);
      
      console.log("📄 Generating document with title:", title);
      console.log("📝 Content length:", content.length);
      
      const response = await api.post('/api/generate-document', {
        content: content,
        title: title || "AI_Generated_Document",
        author: user?.display_name || "LeadSOC-AI"
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${title.replace(/\s+/g, '_').replace(/^a_|^on_/g, '')}_${Date.now()}.docx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setGeneratedDocument({
        url,
        filename
      });
      
      setDocumentVisible(true);
      setDocumentMinimized(false);
      setShowDocumentSuccess(true);
      setTimeout(() => setShowDocumentSuccess(false), 5000);
      
      console.log("✅ Document generated and download started:", filename);

    } catch (err) {
      console.error("Document generation failed:", err);
      alert("Failed to generate document: " + (err.response?.data?.error || err.message));
    }
  };

  const closeDocumentBar = () => {
    setDocumentVisible(false);
  };

  const toggleMinimizeDocumentBar = () => {
    setDocumentMinimized(!documentMinimized);
  };

  // Open LeadSOC website
  const openLeadSOCWebsite = () => {
    if (window.electronAPI) {
      window.electronAPI.openExternal('https://www.leadsoc.com/');
    } else {
      window.open('https://www.leadsoc.com/', '_blank');
    }
  };

  // Navigate to File Converter
  const navigateToFileConverter = () => {
    window.location.href = '/file-converter';
  };

  // Format file list for display
  const formatFileList = (results, pattern) => {
    let formatted = `🔍 I found ${results.length} file(s) matching '${pattern}':\n\n`;
    
    results.forEach((file, index) => {
      const emojis = {
        'image': '🖼️',
        'document': '📄',
        'spreadsheet': '📊',
        'presentation': '📽️',
        'code': '💻',
        'archive': '🗜️',
        'audio': '🎵',
        'video': '🎬',
        'executable': '⚙️',
        'other': '📁'
      };
      const emoji = emojis[file.category] || '📁';
      
      formatted += `${index + 1}. ${emoji} **${file.filename}**\n`;
      formatted += `   📁 ${file.directory}\n`;
      formatted += `   📦 ${file.size_readable}  🕒 ${file.modified_readable}\n\n`;
    });
    
    formatted += '\n**Select a file by number** to open it on your computer (e.g., "open 2" or "select 3")';
    
    return formatted;
  };

  // Handle file search with desktop automation
  const handleFileSearch = async (pattern) => {
    setIsFileAction(true);
    setTypingIndicator(true);
    
    try {
      if (isDesktopApp) {
        // Desktop mode - use Electron (files open on this machine)
        const results = await desktopFileAutomation.searchFiles(pattern);
        
        if (results.length > 0) {
          setLastSearchResults(results);
          const formattedList = formatFileList(results, pattern);
          return {
            type: 'file_list',
            message: formattedList,
            data: {
              files: results,
              pattern: pattern,
              total: results.length
            }
          };
        } else {
          return {
            type: 'not_found',
            message: `❌ No files found matching '${pattern}' in the selected folder on this computer.`
          };
        }
      } else {
        // Web mode - fallback to backend API (files open on server)
        const response = await api.post('/api/file/search', {
          filename: pattern
        });
        
        if (response.data.success) {
          const results = response.data.results;
          setLastSearchResults(results);
          
          if (results.length > 0) {
            const formattedList = formatFileList(results, pattern);
            return {
              type: 'file_list',
              message: formattedList + '\n\n*Note: Files will open on the server, not your local device*',
              data: {
                files: results,
                pattern: pattern,
                total: results.length
              }
            };
          } else {
            return {
              type: 'not_found',
              message: `❌ No files found matching '${pattern}' on the server.`
            };
          }
        }
      }
    } catch (error) {
      console.error("File search error:", error);
      return {
        type: 'error',
        message: `❌ Failed to search for files: ${error.message}`
      };
    } finally {
      setIsFileAction(false);
      setTypingIndicator(false);
    }
  };

  // Handle file open by number with desktop automation
  const handleFileOpenByNumber = async (number) => {
    setIsFileAction(true);
    setTypingIndicator(true);
    
    try {
      if (isDesktopApp) {
        // Desktop mode - use Electron (opens on this machine)
        const result = await desktopFileAutomation.openFileByNumber(number);
        
        if (result.success) {
          return {
            type: 'success',
            message: result.message || `✅ Successfully opened file #${number} on your computer`
          };
        } else {
          return {
            type: 'error',
            message: result.error || `❌ Failed to open file #${number}`
          };
        }
      } else {
        // Web mode - fallback to backend API
        const response = await api.post('/api/file/open-by-number', {
          number: number
        });
        
        if (response.data.success) {
          return {
            type: 'success',
            message: response.data.message
          };
        } else {
          return {
            type: 'error',
            message: response.data.error || `❌ Failed to open file #${number}`
          };
        }
      }
    } catch (error) {
      console.error("File open error:", error);
      return {
        type: 'error',
        message: `❌ Failed to open file: ${error.message}`
      };
    } finally {
      setIsFileAction(false);
      setTypingIndicator(false);
    }
  };

  // Handle website open (works in both modes)
  const handleWebsiteOpen = async (website, searchQuery = '') => {
    setIsFileAction(true);
    setTypingIndicator(true);
    
    try {
      const websites = {
        'gmail': 'https://mail.google.com',
        'youtube': 'https://youtube.com',
        'whatsapp': 'https://web.whatsapp.com',
        'chatgpt': 'https://chat.openai.com',
        'claude': 'https://claude.ai',
        'google': 'https://google.com',
        'github': 'https://github.com',
        'stackoverflow': 'https://stackoverflow.com',
        'reddit': 'https://reddit.com',
        'twitter': 'https://twitter.com',
        'facebook': 'https://facebook.com',
        'instagram': 'https://instagram.com',
        'linkedin': 'https://linkedin.com',
        'netflix': 'https://netflix.com',
        'amazon': 'https://amazon.com',
        'maps': 'https://maps.google.com',
        'drive': 'https://drive.google.com',
        'docs': 'https://docs.google.com',
        'sheets': 'https://sheets.google.com',
        'slides': 'https://slides.google.com',
        'calendar': 'https://calendar.google.com',
        'meet': 'https://meet.google.com',
        'zoom': 'https://zoom.us',
        'teams': 'https://teams.microsoft.com',
        'slack': 'https://slack.com',
        'notion': 'https://notion.so',
        'trello': 'https://trello.com'
      };
      
      let url = websites[website];
      
      if (website === 'youtube' && searchQuery) {
        url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
      } else if (website === 'google' && searchQuery) {
        url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      } else if (website === 'maps' && searchQuery) {
        url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
      } else if (!url) {
        url = searchQuery ? 
          `https://www.google.com/search?q=${encodeURIComponent(website + ' ' + searchQuery)}` :
          `https://${website}.com`;
      }
      
      if (isDesktopApp) {
        await window.electronAPI.openExternal(url);
      } else {
        window.open(url, '_blank');
      }
      
      return {
        type: 'website',
        message: `🌐 Opened ${website} ${searchQuery ? 'with search: ' + searchQuery : ''}`
      };
    } catch (error) {
      return {
        type: 'error',
        message: `❌ Failed to open website: ${error.message}`
      };
    } finally {
      setIsFileAction(false);
      setTypingIndicator(false);
    }
  };

  // Handle YouTube search
  const handleYouTubeSearch = async (searchQuery) => {
    setIsFileAction(true);
    setTypingIndicator(true);
    
    try {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
      
      if (isDesktopApp) {
        await window.electronAPI.openExternal(url);
      } else {
        window.open(url, '_blank');
      }
      
      return {
        type: 'youtube',
        message: `🎬 Searching YouTube for: ${searchQuery}`
      };
    } catch (error) {
      return {
        type: 'error',
        message: `❌ Failed to search YouTube: ${error.message}`
      };
    } finally {
      setIsFileAction(false);
      setTypingIndicator(false);
    }
  };

  // Handle client-side file/website actions
  const handleClientAction = async (query) => {
    const lowerQuery = query.toLowerCase().trim();
    
    console.log("🔍 Checking for client action:", lowerQuery);
    
    // Check for selection command (open 2, select 3, etc.)
    const selectionMatch = lowerQuery.match(/^(?:open|select|choose)\s*(?:file\s*)?#?(\d+)$/i) ||
                          lowerQuery.match(/^(\d+)$/i);
    
    if (selectionMatch) {
      const number = parseInt(selectionMatch[1] || selectionMatch[0]);
      console.log("🔢 Selection command detected for number:", number);
      return await handleFileOpenByNumber(number);
    }
    
    // Check for website commands
    const websiteMatch = lowerQuery.match(/^(?:open|go to)\s+(gmail|youtube|whatsapp|chatgpt|claude|google|github|stackoverflow|reddit|twitter|facebook|instagram|linkedin|netflix|amazon|maps|drive|docs|sheets|slides|calendar|meet|zoom|teams|slack|notion|trello)$/i);
    
    if (websiteMatch) {
      const website = websiteMatch[1].toLowerCase();
      console.log("🌐 Website command detected:", website);
      return await handleWebsiteOpen(website);
    }
    
    // Check for YouTube search
    if (lowerQuery.includes('youtube') || lowerQuery.includes('yt')) {
      const youtubeMatch = lowerQuery.match(/(?:play|search|find)\s+(?:youtube\s+)?(?:video\s+)?(?:for\s+)?(.+)/i) ||
                          lowerQuery.match(/^(?:open\s+)?youtube\s+(.+)$/i);
      
      if (youtubeMatch) {
        let searchQuery = youtubeMatch[1] || query.replace(/play|search|find|youtube|yt|video|for|open/gi, '').trim();
        if (!searchQuery || searchQuery.length < 2) {
          searchQuery = query.replace(/youtube|yt/gi, '').trim();
        }
        if (!searchQuery) searchQuery = "music";
        
        console.log("🎬 YouTube search detected:", searchQuery);
        return await handleYouTubeSearch(searchQuery);
      }
    }
    
    // Check for direct file open command
    const directOpenMatch = lowerQuery.match(/^(?:open)\s+(.+?)(?:\s+file)?$/i);
    if (directOpenMatch && !lowerQuery.includes('youtube') && !lowerQuery.includes('website')) {
      const filename = directOpenMatch[1].trim();
      console.log("📂 Direct file open detected:", filename);
      return await handleFileSearch(filename);
    }
    
    // Check for file search (find, search for, locate)
    const fileMatch = lowerQuery.match(/^(?:find|search for|locate|show|list)\s+['"]?([^'"]+(?:\.\w+)?)['"]?$/i) ||
                     lowerQuery.match(/^(?:find|search for|locate)\s+(?:files?|documents?)?\s+['"]?([^'"]+)['"]?$/i) ||
                     lowerQuery.match(/^where (?:is|are)\s+(?:my\s+)?([^\s]+(?:\s+[^\s]+)*)$/i) ||
                     lowerQuery.match(/^find\s+my\s+([^\s]+(?:\s+[^\s]+)*)$/i);
    
    if (fileMatch) {
      const pattern = fileMatch[1].trim();
      console.log("🔍 File search detected for pattern:", pattern);
      return await handleFileSearch(pattern);
    }
    
    // Check for help with file operations
    if (lowerQuery.includes('how to open file') || lowerQuery.includes('help with files') || lowerQuery.includes('file help')) {
      const modeText = isDesktopApp ? 
        "on THIS computer" : 
        "on the server (not your local device)";
      
      return {
        type: 'info',
        message: `📁 **File Operations Help**

You can ask me to:
• Open a file: "open resume.pdf" or "open my document.docx"
• Find files: "find all pdf files" or "search for images"
• Open websites: "open youtube" or "go to gmail"
• Search YouTube: "play music video" or "youtube funny cats"
• Select files: after search, type "open 2" to open the second file

**How it works:**
1. When you ask to open/find a file, I'll search your computer
2. I'll show you all matching files with numbers
3. Just type "open 2" to open the second file!

**Current Mode:** Files will open ${modeText}

Try it now with "open resume" or "find document"!`
      };
    }
    
    return null;
  };

  // FIXED: Handle send
  const handleSend = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !uploadedFile) || streaming || isCreatingChat || paused || isFileAction) return;

    setStreamError(null);
    setTypingIndicator(true);

    let activeChatId = localChatId;

    if (!activeChatId) {
      setIsCreatingChat(true);
      activeChatId = await createNewChat();
      setIsCreatingChat(false);
      if (!activeChatId) {
        setStreamError("Failed to create chat. Please try again.");
        return;
      }
      // Set the chat ID immediately to ensure messages are sent to the right chat
      setLocalChatId(activeChatId);
      
      // Wait a moment for the welcome message to be added
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const userMessage = {
      _id: Date.now().toString() + '-user',
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
      file_info: uploadedFile ? {
        file_id: uploadedFile.file_id,
        filename: uploadedFile.name || uploadedFile.filename,
        size: uploadedFile.size,
        is_image: uploadedFile.is_image
      } : null
    };

    if (uploadedFile?.image_data) {
      userMessage.image_data = uploadedFile.image_data;
    }

    setMessages(prev => [...prev, userMessage]);
    lastUserMessage.current = input;
    const sentInput = input;
    const sentFile = uploadedFile ? {
      file_id: uploadedFile.file_id,
      filename: uploadedFile.name || uploadedFile.filename,
      size: uploadedFile.size,
      is_image: uploadedFile.is_image,
      image_data: uploadedFile.image_data
    } : null;
    
    setInput("");
    setUploadedFile(null);
    setShowImagePreview(false);
    setShowAnalysis(false);
    setAnalysisResult(null);
    
    // Check if this is a client-side file/website/app action
    const clientActionResult = await handleClientAction(sentInput);
    
    if (clientActionResult) {
      // Add the result as a regular message
      setMessages(prev => [
        ...prev,
        {
          _id: 'client-action-' + Date.now(),
          role: "assistant",
          content: clientActionResult.message,
          clientAction: true,
          fileData: clientActionResult.data
        }
      ]);
      
      setTypingIndicator(false);
      return;
    }

    // If not a client action, proceed with normal AI response
    setStreaming(true);
    setPaused(false);
    setTypingIndicator(false);
    
    // Re-enable auto-scroll when sending a new message
    autoScrollEnabled.current = true;

    assistantMessageIdRef.current = 'assistant-' + Date.now();
    setMessages(prev => [
      ...prev,
      { 
        _id: assistantMessageIdRef.current, 
        role: "assistant", 
        content: "", 
        isStreaming: true 
      },
    ]);

    fullContentRef.current = "";
    abortControllerRef.current = new AbortController();

    const timeoutId = setTimeout(() => {
      if (streaming && fullContentRef.current === "") {
        const defaultResponse = "I'm processing your request. Please wait a moment...";
        
        setMessages(prev =>
          prev.map(msg =>
            msg._id === assistantMessageIdRef.current
              ? { ...msg, content: defaultResponse, isStreaming: false }
              : msg
          )
        );
        setStreaming(false);
        setStreamError(null);
      }
    }, 8000);

    try {
      const response = await fetch(`${api.defaults.baseURL}/api/chats/${activeChatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ 
          content: sentInput,
          file_info: sentFile 
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let receivedFirstToken = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.token) {
                clearTimeout(timeoutId);
                if (!receivedFirstToken) {
                  receivedFirstToken = true;
                }

                fullContentRef.current += data.token;
                setMessages(prev =>
                  prev.map(msg =>
                    msg._id === assistantMessageIdRef.current
                      ? { ...msg, content: fullContentRef.current, isStreaming: true }
                      : msg
                  )
                );
              } 
              else if (data.document_ready) {
                console.log("📄 Document ready signal received:", data);
                const title = data.title || sentInput.substring(0, 50) || "AI_Generated_Document";
                // Use the content from the data if available, otherwise use the full response
                const docContent = data.content || fullContentRef.current;
                await generateDocument(docContent, title);
              } 
              else if (data.done) {
                if (receivedFirstToken) {
                  setMessages(prev =>
                    prev.map(msg =>
                      msg._id === assistantMessageIdRef.current
                        ? { ...msg, content: fullContentRef.current, isStreaming: false }
                        : msg
                    )
                  );
                } else {
                  // No tokens received – set a default message
                  const defaultResponse = "I received your message but couldn't generate a response. Please try again.";
                  
                  setMessages(prev =>
                    prev.map(msg =>
                      msg._id === assistantMessageIdRef.current
                        ? { ...msg, content: defaultResponse, isStreaming: false }
                        : msg
                    )
                  );
                }
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error("Error parsing stream data:", e);
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Stream paused by user');
        setPaused(true);
        setStreaming(false);
      } else {
        console.error("Failed to send message:", err);
        setStreamError(err.message || "Failed to get response from server.");
        setStreaming(false);
        
        // Update assistant message with error message
        const errorMessage = `Error: ${err.message || "Failed to get response"}. Please try again.`;
        
        setMessages(prev =>
          prev.map(msg =>
            msg._id === assistantMessageIdRef.current
              ? { ...msg, content: errorMessage, isStreaming: false }
              : msg
          )
        );
      }
    } finally {
      clearTimeout(timeoutId);
      if (!paused) {
        setStreaming(false);
      }
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setShowImagePreview(false);
    setShowAnalysis(false);
    setAnalysisResult(null);
  };

  // Function to scroll to bottom manually
  const scrollToBottom = () => {
    autoScrollEnabled.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        height: "100vh",
        position: "relative",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        ...(isMobile ? styles.mobileContainer : {}),
        overflow: "hidden"
      }}
    >
      {/* Animated gradient overlay */}
      <div style={{
        ...styles.gradientOverlay,
        transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
      }} />
      
      {/* Floating background bubbles with enhanced animation */}
      <div style={styles.bubbleContainer}>
        {floatingBubbles.map((bubble) => (
          <div
            key={bubble.id}
            style={{
              ...styles.bubble,
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              opacity: bubble.opacity,
              background: `radial-gradient(circle, ${bubble.color} 0%, transparent 70%)`,
              animation: `floatBubble ${bubble.duration}s infinite ease-in-out ${bubble.delay}s`,
              filter: `blur(${bubble.size > 100 ? '3px' : '1px'})`,
            }}
          />
        ))}
      </div>

      {/* Floating particles */}
      <div style={styles.particleContainer}>
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.particle,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              opacity: Math.random() * 0.15,
              background: "#000000",
              animation: `floatParticle ${Math.random() * 20 + 20}s infinite linear`,
              animationDelay: `${Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {isMobile && (
        <div style={{
          ...styles.mobileHeader,
          animation: "slideInDown 0.5s ease-out"
        }}>
          <button
            onClick={onToggleSidebar}
            style={styles.menuButton}
          >
            <Menu size={24} color="#666666" />
          </button>
          <div style={styles.headerTitle}>
            <Zap size={20} color="#000000" style={{ animation: 'pulse 2s infinite' }} />
            <span style={styles.headerText}>LeadSOC-AI</span>
          </div>
          <div style={{ width: "40px" }} />
        </div>
      )}

      {!isMobile && (
        <div style={{
          ...styles.header,
          background: "#ffffff",
          borderBottom: "1px solid #e0e0e0",
          height: "80px",
          padding: "0 32px",
          animation: "slideInDown 0.5s ease-out"
        }}>
          <div style={styles.headerLeft}>
            <div style={styles.headerTitle}>
              <Zap size={20} color="#000000" style={{ animation: 'pulse 2s infinite' }} />
              <h2 style={{...styles.headerText, fontSize: "20px"}}>
                {localChatId ? "LeadSOC-AI" : "New Conversation"}
                {isDesktopApp && <span style={styles.desktopBadge}>Desktop</span>}
              </h2>
            </div>
            <div style={styles.status}>
              <div style={styles.statusDot} />
              <span style={styles.statusText}>Online</span>
            </div>
          </div>
          <div style={styles.headerRight}>
            {/* File Converter Button */}
            <button 
              onClick={navigateToFileConverter}
              style={{
                ...styles.fileConverterButton,
                animation: 'glowPulse 2s infinite',
                background: "#000000",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "30px",
                border: "none",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title="Convert files between different formats (PDF, Word, PPT, Images, etc.)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 10L12 15L17 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 3V15M12 15L9 12M12 15L15 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 21H19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              File Converter
            </button>
            
            {/* LeadSOC Logo - Clickable Image */}
            <div 
              onClick={openLeadSOCWebsite}
              style={{
                ...styles.logoContainer,
                animation: 'glowPulse 3s infinite',
                cursor: 'pointer'
              }}
              title="Visit LeadSOC Website"
            >
              <img 
                src={leadsocLogo} 
                alt="LeadSOC Logo" 
                style={{
                  ...styles.logo,
                  animation: 'pulse 3s infinite'
                }}
              />
              <div style={styles.logoGlow} />
            </div>
            
            {!localChatId && (
              <button onClick={createNewChat} style={{
                ...styles.newChatButton,
                background: "#000000",
                marginLeft: "16px"
              }}>
                <Plus size={16} />
                New Chat
              </button>
            )}
          </div>
        </div>
      )}

      {showDocumentSuccess && (
        <div style={{
          ...styles.documentSuccess,
          background: "#ffffff",
          border: "2px solid #4CAF50",
          ...(isMobile ? styles.mobileDocumentSuccess : {}),
          animation: "slideInRight 0.3s ease-out"
        }}>
          <CheckCircle size={20} color="#4CAF50" style={{ animation: 'bounce 1s infinite' }} />
          <span style={styles.documentSuccessText}>
            Document generated successfully! Download started.
          </span>
        </div>
      )}

      {/* Document Download Bar with Controls */}
      {generatedDocument && documentVisible && (
        <div style={{
          ...styles.documentBar,
          ...(documentMinimized ? styles.documentBarMinimized : {}),
          background: "#f5f5f5",
          border: "1px solid #000000",
          ...(isMobile ? styles.mobileDocumentBar : {}),
          animation: "slideInUp 0.3s ease-out"
        }}>
          <div style={styles.documentBarContent}>
            <FileText size={isMobile ? 16 : 18} color="#000000" style={{ animation: 'pulse 2s infinite' }} />
            {!documentMinimized && (
              <>
                <span style={styles.documentBarText}>{generatedDocument.filename}</span>
                <a 
                  href={generatedDocument.url} 
                  download={generatedDocument.filename}
                  style={{
                    ...styles.documentBarButton,
                    background: "#000000",
                    ...(isMobile ? styles.mobileDocumentBarButton : {})
                  }}
                >
                  <Download size={isMobile ? 12 : 14} />
                  {!isMobile && " Download Again"}
                </a>
              </>
            )}
            {documentMinimized && (
              <span style={styles.documentBarMinimizedText}>
                Document ready: {generatedDocument.filename}
              </span>
            )}
          </div>
          <div style={styles.documentBarControls}>
            <button 
              onClick={toggleMinimizeDocumentBar}
              style={styles.documentBarControlButton}
              title={documentMinimized ? "Expand" : "Minimize"}
            >
              {documentMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </button>
            <button 
              onClick={closeDocumentBar}
              style={{...styles.documentBarControlButton, ...styles.documentBarCloseButton}}
              title="Close"
            >
              <XCircle size={14} />
            </button>
          </div>
        </div>
      )}

      {showImagePreview && uploadedFile?.image_data && (
        <div style={{
          ...styles.imagePreview,
          ...(isMobile ? styles.mobileImagePreview : {}),
          animation: "scaleIn 0.3s ease-out"
        }}>
          <img 
            src={uploadedFile.image_data} 
            alt="Preview" 
            style={styles.previewImage}
          />
          <button onClick={removeUploadedFile} style={styles.closePreview}>
            <X size={16} />
          </button>
          <div style={styles.imagePreviewGlow} />
        </div>
      )}

      {showAnalysis && analysisResult && (
        <div style={{
          ...styles.analysisContainer,
          ...(isMobile ? styles.mobileAnalysisContainer : {}),
          animation: "slideInUp 0.3s ease-out"
        }}>
          <div style={styles.analysisHeader}>
            <Camera size={16} color="#000000" style={{ animation: 'pulse 2s infinite' }} />
            <span style={styles.analysisTitle}>
              {uploadedFile?.is_image ? "Image Analysis" : "Document Analysis"}
            </span>
            <button onClick={() => setShowAnalysis(false)} style={styles.closeAnalysis}>
              <X size={14} />
            </button>
          </div>
          <div style={styles.analysisContent}>
            {isAnalyzing ? (
              <div style={styles.analyzing}>
                <Loader2 size={20} className="spin" />
                <span>Analyzing...</span>
                <div style={styles.analyzingDots}>
                  <div style={styles.analyzingDot} />
                  <div style={{...styles.analyzingDot, animationDelay: "0.2s"}} />
                  <div style={{...styles.analyzingDot, animationDelay: "0.4s"}} />
                </div>
              </div>
            ) : (
              <>
                <p style={styles.analysisText}>{analysisResult.analysis || analysisResult.explanation}</p>
                {analysisResult.extracted_text && (
                  <div style={styles.extractedText}>
                    <strong>Extracted Text:</strong>
                    <p>{analysisResult.extracted_text}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* FIXED: Messages area with scrolling enabled */}
      <div 
        ref={messagesContainerRef}
        style={{
          ...styles.messagesArea,
          background: "#ffffff",
          ...(isMobile ? styles.mobileMessagesArea : {}),
          overflowY: "auto",
          WebkitOverflowScrolling: "touch"
        }}
      >
        {loading && (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner} />
            <span style={styles.loadingText}>Loading messages...</span>
            <div style={styles.loadingDots}>
              <div style={styles.loadingDot} />
              <div style={{...styles.loadingDot, animationDelay: "0.2s"}} />
              <div style={{...styles.loadingDot, animationDelay: "0.4s"}} />
            </div>
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div style={{
            ...styles.welcomeContainer,
            ...(isMobile ? styles.mobileWelcomeContainer : {}),
            animation: welcomeAnimation ? 'welcomePop 0.5s ease-out' : 'fadeIn 0.8s ease-out'
          }}>
            <div style={{
              ...styles.welcomeIcon,
              background: "#ffffff",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              ...(isMobile ? styles.mobileWelcomeIcon : {}),
              animation: 'float 3s ease-in-out infinite, glowPulse 3s infinite'
            }}>
              <Zap size={isMobile ? 32 : 48} color="#000000" />
              <div style={styles.welcomeIconGlow} />
            </div>
            <h3 style={{
              ...styles.welcomeTitle,
              ...(isMobile ? styles.mobileWelcomeTitle : {}),
              animation: 'slideInUp 0.5s ease-out 0.2s both'
            }}>
              Welcome, {user?.display_name}!
            </h3>
            <p style={{
              ...styles.welcomeText,
              ...(isMobile ? styles.mobileWelcomeText : {}),
              animation: 'slideInUp 0.5s ease-out 0.3s both'
            }}>
              Start a conversation with LeadSOC-AI. Ask anything, get thoughtful responses.
            </p>
            
            <div style={{
              ...styles.capabilitiesGrid,
              ...(isMobile ? styles.mobileCapabilitiesGrid : {}),
              animation: 'slideInUp 0.5s ease-out 0.4s both'
            }}>
              <div style={{
                ...styles.capabilityCard,
                animation: 'float 4s ease-in-out infinite'
              }}>
                <FileText size={isMobile ? 20 : 24} color="#000000" />
                <h4 style={isMobile ? { fontSize: "14px" } : {}}>Document Creation</h4>
                <p style={isMobile ? { fontSize: "12px" } : {}}>Create beautifully formatted Word documents</p>
                <span style={styles.capabilityHint}>Try: "Create a document about AI"</span>
              </div>
              
              <div style={{
                ...styles.capabilityCard,
                animation: 'float 4s ease-in-out infinite 0.2s'
              }}>
                <ImageIcon size={isMobile ? 20 : 24} color="#000000" />
                <h4 style={isMobile ? { fontSize: "14px" } : {}}>Image Analysis</h4>
                <p style={isMobile ? { fontSize: "12px" } : {}}>Upload images for OCR and analysis</p>
                <span style={styles.capabilityHint}>Upload any image to analyze</span>
              </div>
              
              <div style={{
                ...styles.capabilityCard,
                animation: 'float 4s ease-in-out infinite 0.4s'
              }}>
                <Bot size={isMobile ? 20 : 24} color="#000000" />
                <h4 style={isMobile ? { fontSize: "14px" } : {}}>Document Reading</h4>
                <p style={isMobile ? { fontSize: "12px" } : {}}>Upload PDF, DOCX, TXT files to explain</p>
                <span style={styles.capabilityHint}>Ask: "Explain this document"</span>
              </div>
              
              <div style={{
                ...styles.capabilityCard,
                animation: 'float 4s ease-in-out infinite 0.6s'
              }}>
                <Brain size={isMobile ? 20 : 24} color="#000000" />
                <h4 style={isMobile ? { fontSize: "14px" } : {}}>Smart Analysis</h4>
                <p style={isMobile ? { fontSize: "12px" } : {}}>Get insights from your uploaded files</p>
                <span style={styles.capabilityHint}>Automatic analysis on upload</span>
              </div>
            </div>

            <div style={{
              ...styles.documentBadge,
              ...(isMobile ? styles.mobileDocumentBadge : {}),
              animation: 'slideInUp 0.5s ease-out 0.6s both, pulse 3s infinite'
            }}>
              <UploadCloud size={isMobile ? 14 : 16} color="#000000" />
              <span style={styles.documentBadgeText}>
                📤 Upload files to analyze - Documents & Images supported!
              </span>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={msg._id}
            style={{
              animation: messageAnimations[index] ? 'messagePop 0.3s ease-out' : 'fadeIn 0.3s ease-out',
              animationFillMode: 'both'
            }}
          >
            <Message 
              message={msg} 
              isStreaming={msg.isStreaming}
            />
          </div>
        ))}

        {isCreatingChat && (
          <div style={styles.waitingIndicator}>
            <div style={styles.waitingDots}>
              <div style={styles.waitingDot} />
              <div style={{ ...styles.waitingDot, animationDelay: "0.2s" }} />
              <div style={{ ...styles.waitingDot, animationDelay: "0.4s" }} />
            </div>
            <span style={styles.waitingText}>Creating chat...</span>
          </div>
        )}

        {streaming && !streamError && (
          <div style={{
            ...styles.streamingIndicator,
            background: "#f5f5f5",
            border: "1px solid #e0e0e0"
          }}>
            <div style={styles.streamingDots}>
              <div style={styles.streamingDot} />
              <div style={{ ...styles.streamingDot, animationDelay: "0.2s" }} />
              <div style={{ ...styles.streamingDot, animationDelay: "0.4s" }} />
            </div>
            <span style={styles.streamingText}>Generating response...</span>
          </div>
        )}

        {paused && (
          <div style={{
            ...styles.streamingIndicator,
            background: "#f5f5f5",
            border: "1px solid #ffaa00"
          }}>
            <span style={styles.streamingText}>Generation paused</span>
          </div>
        )}

        {typingIndicator && (
          <div style={styles.typingIndicator}>
            <div style={styles.typingDot} />
            <div style={{ ...styles.typingDot, animationDelay: "0.2s" }} />
            <div style={{ ...styles.typingDot, animationDelay: "0.4s" }} />
          </div>
        )}

        {streamError && (
          <div style={{
            ...styles.errorIndicator,
            background: "#f5f5f5",
            border: "1px solid #f44336",
            animation: "shake 0.5s ease-in-out"
          }}>
            <span style={styles.errorText}>⚠️ {streamError}</span>
            <button
              onClick={() => setStreamError(null)}
              style={{
                ...styles.errorDismiss,
                border: "1px solid #f44336",
                color: "#f44336"
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Scroll to bottom button when user has scrolled up */}
        {!autoScrollEnabled.current && messages.length > 0 && (
          <button
            onClick={scrollToBottom}
            style={{
              ...styles.scrollToBottomButton,
              animation: 'fadeIn 0.3s ease-out, bounce 2s infinite'
            }}
          >
            ↓
          </button>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* FIXED: Mobile-optimized input area */}
      <div style={{
        ...styles.inputArea,
        background: "#ffffff",
        borderTop: "1px solid #e0e0e0",
        ...(isMobile ? styles.mobileInputArea : {}),
        ...(isInputFocused && isMobile ? styles.mobileInputAreaFocused : {}),
        animation: "slideInUp 0.5s ease-out"
      }}>
        {uploadedFile && !showImagePreview && (
          <div style={{
            ...styles.filePreview,
            background: "#f5f5f5",
            border: "1px solid #000000",
            ...(isMobile ? styles.mobileFilePreview : {}),
            animation: "slideInUp 0.3s ease-out"
          }}>
            <div style={styles.fileInfo}>
              {uploadedFile.is_image ? (
                <ImageIcon size={isMobile ? 14 : 16} color="#000000" style={{ animation: 'pulse 2s infinite' }} />
              ) : (
                <FileText size={isMobile ? 14 : 16} color="#000000" style={{ animation: 'pulse 2s infinite' }} />
              )}
              <span style={styles.fileName}>{uploadedFile.name || uploadedFile.filename}</span>
              <span style={styles.fileSize}>
                ({(uploadedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button onClick={removeUploadedFile} style={styles.removeFileButton}>
              <X size={isMobile ? 12 : 14} color="#666666" />
            </button>
          </div>
        )}

        {isUploading && (
          <div style={styles.uploadProgress}>
            <div style={{...styles.progressBar, width: `${uploadProgress}%`, background: "#000000"}} />
            <span style={styles.progressText}>Uploading: {uploadProgress}%</span>
          </div>
        )}

        <form onSubmit={handleSend} style={styles.inputForm}>
          <div style={{
            ...styles.inputContainer,
            background: "#f5f5f5",
            border: isInputFocused ? "1px solid #000000" : "1px solid #e0e0e0",
            ...(isMobile ? styles.mobileInputContainer : {}),
            transition: "all 0.3s ease",
            boxShadow: isInputFocused ? '0 0 20px rgba(0,0,0,0.1)' : 'none'
          }}>
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              style={{
                ...styles.attachButton,
                animation: isUploading ? 'pulse 1s infinite' : 'none'
              }}
              title="Upload file or image"
              disabled={isUploading}
            >
              <Paperclip size={isMobile ? 16 : 18} color="#666666" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept=".txt,.pdf,.docx,.py,.js,.html,.css,.json,.md,image/*"
            />
            
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder={isMobile ? "Message..." : "Message LeadSOC-AI... (Shift + Enter for new line)"}
              style={{
                ...styles.textarea,
                color: "#000000",
                background: "transparent",
                ...(isMobile ? styles.mobileTextarea : {})
              }}
              rows={1}
              disabled={streaming || isCreatingChat || isFileAction}
            />
            
            {input && (
              <div style={styles.inputHint}>
                <CornerDownLeft size={12} color="#666666" />
                <span style={styles.inputHintText}>Send</span>
              </div>
            )}
          </div>
          
          {(streaming || paused) && (
            <button
              type="button"
              onClick={paused ? resumeGeneration : pauseGeneration}
              style={{
                ...styles.pauseButton,
                background: paused ? "#ffaa00" : "#f44336",
                ...(isMobile ? styles.mobilePauseButton : {})
              }}
              title={paused ? "Resume generation" : "Pause generation"}
            >
              {paused ? <Play size={isMobile ? 16 : 18} color="white" /> : <Pause size={isMobile ? 16 : 18} color="white" />}
            </button>
          )}
          
          <button
            type="submit"
            disabled={(!input.trim() && !uploadedFile) || streaming || isCreatingChat || isFileAction}
            style={{
              ...styles.sendButton,
              background: "#000000",
              opacity: (!input.trim() && !uploadedFile) || streaming || isCreatingChat || isFileAction ? 0.5 : 1,
              cursor: (!input.trim() && !uploadedFile) || streaming || isCreatingChat || isFileAction ? "not-allowed" : "pointer",
              ...(isMobile ? styles.mobileSendButton : {})
            }}
          >
            <Send size={isMobile ? 16 : 18} color="white" />
          </button>
        </form>
        
        <div style={{
          ...styles.featureBadges,
          ...(isMobile ? styles.mobileFeatureBadges : {})
        }}>
          <div style={{
            ...styles.featureBadge,
            animation: 'float 3s ease-in-out infinite'
          }}>
            <FileText size={12} color="#000000" />
            <span>Create Docs</span>
          </div>
          <div style={{
            ...styles.featureBadge,
            animation: 'float 3s ease-in-out infinite 0.1s'
          }}>
            <ImageIcon size={12} color="#000000" />
            <span>Analyze Images</span>
          </div>
          <div style={{
            ...styles.featureBadge,
            animation: 'float 3s ease-in-out infinite 0.2s'
          }}>
            <Bot size={12} color="#000000" />
            <span>Read Files</span>
          </div>
        </div>

        <p style={{
          ...styles.disclaimer,
          ...(isMobile ? styles.mobileDisclaimer : {}),
          animation: 'fadeIn 1s ease-out'
        }}>
          LeadSOC-AI may generate inaccurate information. Consider verifying important information.
        </p>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        
        @keyframes pulseButton {
          0%, 100% { box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
          50% { box-shadow: 0 8px 25px rgba(0,0,0,0.2); }
        }
        
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          50% { box-shadow: 0 0 40px rgba(0,0,0,0.2); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes floatBubble {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(30px, -30px) rotate(5deg); }
          50% { transform: translate(-20px, -40px) rotate(-5deg); }
          75% { transform: translate(-40px, 20px) rotate(3deg); }
        }
        
        @keyframes floatParticle {
          from { transform: translateY(0) translateX(0); }
          to { transform: translateY(-100vh) translateX(100px); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slideInUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        @keyframes messagePop {
          0% { transform: scale(0.8); opacity: 0; }
          80% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes welcomePop {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(0,0,0,0.05); }
          50% { box-shadow: 0 0 60px rgba(0,0,0,0.1); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          textarea {
            font-size: 16px !important;
            line-height: 1.4 !important;
          }
          
          * {
            -webkit-tap-highlight-color: transparent;
          }
          
          button {
            min-height: 44px;
            min-width: 44px;
          }
          
          input, textarea, select {
            font-size: 16px !important;
          }
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

const styles = {
  header: {
    padding: "16px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backdropFilter: "blur(10px)",
    position: "relative",
    zIndex: 10,
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    position: "relative"
  },
  headerText: {
    color: "#000000",
    fontSize: "20px",
    fontWeight: "600",
    letterSpacing: "-0.3px",
    margin: 0
  },
  desktopBadge: {
    fontSize: "12px",
    background: "#000000",
    color: "#ffffff",
    padding: "2px 8px",
    borderRadius: "12px",
    marginLeft: "8px",
    fontWeight: "normal"
  },
  status: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 8px",
    background: "rgba(76, 175, 80, 0.1)",
    borderRadius: "20px",
    border: "1px solid rgba(76, 175, 80, 0.3)"
  },
  statusDot: {
    width: "8px",
    height: "8px",
    background: "#4CAF50",
    borderRadius: "50%",
    animation: "pulse 2s infinite"
  },
  statusText: {
    color: "#4CAF50",
    fontSize: "12px",
    fontWeight: "500"
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  fileConverterButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderRadius: "30px",
    border: "none",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    transition: "all 0.3s ease",
    background: "#000000",
    color: "#ffffff"
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.02) 0%, transparent 50%)",
    pointerEvents: "none",
    transition: "transform 0.2s ease-out"
  },
  particleContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    overflow: "hidden"
  },
  particle: {
    position: "absolute",
    background: "radial-gradient(circle, #000000, transparent)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  logoContainer: {
    position: "relative",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    borderRadius: "12px",
    transition: "all 0.3s ease",
    height: "60px",
    width: "auto",
    background: "rgba(0,0,0,0.02)",
    border: "1px solid #e0e0e0"
  },
  logo: {
    height: "50px",
    width: "auto",
    maxWidth: "150px",
    objectFit: "contain",
    transition: "transform 0.3s ease"
  },
  logoGlow: {
    position: "absolute",
    top: "-5px",
    left: "-5px",
    right: "-5px",
    bottom: "-5px",
    borderRadius: "16px",
    background: "radial-gradient(circle, rgba(0,0,0,0.05) 0%, transparent 70%)",
    zIndex: -1,
    animation: "pulse 2s infinite"
  },
  newChatButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    border: "none",
    borderRadius: "20px",
    padding: "8px 16px",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  documentBar: {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    borderRadius: "40px",
    padding: "8px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    zIndex: 1000,
    minWidth: "300px",
    maxWidth: "600px"
  },
  documentBarMinimized: {
    padding: "8px 12px",
    minWidth: "200px"
  },
  mobileDocumentBar: {
    bottom: "10px",
    left: "10px",
    right: "10px",
    transform: "none",
    width: "calc(100% - 20px)",
    minWidth: "auto"
  },
  documentBarContent: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
    overflow: "hidden"
  },
  documentBarText: {
    color: "#000000",
    fontSize: "14px",
    fontWeight: "500",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  documentBarMinimizedText: {
    color: "#666666",
    fontSize: "13px",
    fontStyle: "italic"
  },
  documentBarButton: {
    border: "none",
    borderRadius: "20px",
    padding: "6px 12px",
    color: "#ffffff",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  mobileDocumentBarButton: {
    padding: "4px 8px",
    fontSize: "11px"
  },
  documentBarControls: {
    display: "flex",
    gap: "4px"
  },
  documentBarControlButton: {
    width: "28px",
    height: "28px",
    background: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    transition: "all 0.2s ease",
    color: "#666666"
  },
  documentBarCloseButton: {
    color: "#f44336"
  },
  documentSuccess: {
    position: "fixed",
    top: "20px",
    right: "20px",
    borderRadius: "12px",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    boxShadow: "0 4px 15px rgba(76, 175, 80, 0.2)",
    zIndex: 1000
  },
  mobileDocumentSuccess: {
    top: "10px",
    right: "10px",
    left: "10px",
    padding: "10px",
    fontSize: "13px"
  },
  documentSuccessText: {
    color: "#4CAF50",
    fontSize: "14px",
    fontWeight: "500"
  },
  bubbleContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    overflow: "hidden"
  },
  bubble: {
    position: "absolute",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  imagePreview: {
    position: "relative",
    margin: "16px 24px",
    maxWidth: "300px",
    borderRadius: "12px",
    overflow: "hidden",
    border: "2px solid #000000",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
  },
  imagePreviewGlow: {
    position: "absolute",
    top: "-5px",
    left: "-5px",
    right: "-5px",
    bottom: "-5px",
    borderRadius: "14px",
    background: "radial-gradient(circle, rgba(0,0,0,0.05) 0%, transparent 70%)",
    zIndex: -1,
    animation: "pulse 2s infinite"
  },
  mobileImagePreview: {
    margin: "12px 16px",
    maxWidth: "200px"
  },
  previewImage: {
    width: "100%",
    height: "auto",
    display: "block"
  },
  closePreview: {
    position: "absolute",
    top: "8px",
    right: "8px",
    background: "#f44336",
    border: "none",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "white",
    transition: "all 0.2s"
  },
  analysisContainer: {
    position: "relative",
    margin: "16px 24px",
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e0e0e0",
    overflow: "hidden",
    maxWidth: "400px"
  },
  mobileAnalysisContainer: {
    margin: "12px 16px",
    maxWidth: "calc(100% - 32px)"
  },
  analysisHeader: {
    padding: "12px 16px",
    background: "#f5f5f5",
    borderBottom: "1px solid #e0e0e0",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  analysisTitle: {
    color: "#000000",
    fontSize: "14px",
    fontWeight: "600",
    flex: 1
  },
  closeAnalysis: {
    background: "none",
    border: "none",
    color: "#666666",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px"
  },
  analysisContent: {
    padding: "16px",
    maxHeight: "300px",
    overflowY: "auto"
  },
  analyzing: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#666666",
    fontSize: "14px",
    position: "relative"
  },
  analyzingDots: {
    display: "flex",
    gap: "4px",
    marginLeft: "8px"
  },
  analyzingDot: {
    width: "4px",
    height: "4px",
    background: "#000000",
    borderRadius: "50%",
    animation: "pulse 1.4s infinite"
  },
  analysisText: {
    color: "#000000",
    fontSize: "14px",
    lineHeight: "1.6",
    marginBottom: "12px"
  },
  extractedText: {
    marginTop: "12px",
    padding: "12px",
    background: "#f5f5f5",
    borderRadius: "8px",
    color: "#666666",
    fontSize: "13px",
    lineHeight: "1.6"
  },
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
    position: "relative",
    scrollBehavior: "smooth"
  },
  mobileMessagesArea: {
    padding: "16px",
    paddingBottom: "20px"
  },
  loadingContainer: {
    textAlign: "center",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px"
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    border: "3px solid rgba(0,0,0,0.1)",
    borderTop: "3px solid #000000",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingText: {
    color: "#666666",
    fontSize: "14px",
    fontWeight: "500"
  },
  loadingDots: {
    display: "flex",
    gap: "4px"
  },
  loadingDot: {
    width: "6px",
    height: "6px",
    background: "#000000",
    borderRadius: "50%",
    animation: "bounce 1.4s infinite"
  },
  welcomeContainer: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#000000",
    textAlign: "center",
    padding: "20px"
  },
  mobileWelcomeContainer: {
    padding: "12px",
    justifyContent: "flex-start",
    minHeight: "100%"
  },
  welcomeIcon: {
    width: "120px",
    height: "120px",
    borderRadius: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "32px",
    position: "relative"
  },
  welcomeIconGlow: {
    position: "absolute",
    top: "-10px",
    left: "-10px",
    right: "-10px",
    bottom: "-10px",
    borderRadius: "70px",
    background: "radial-gradient(circle, rgba(0,0,0,0.05) 0%, transparent 70%)",
    animation: "pulse 3s infinite"
  },
  mobileWelcomeIcon: {
    width: "80px",
    height: "80px",
    marginBottom: "20px"
  },
  welcomeTitle: {
    fontSize: "32px",
    marginBottom: "12px",
    color: "#000000",
    fontWeight: "600",
    letterSpacing: "-0.5px"
  },
  mobileWelcomeTitle: {
    fontSize: "24px",
    marginBottom: "8px"
  },
  welcomeText: {
    fontSize: "16px",
    color: "#666666",
    maxWidth: "400px",
    marginBottom: "16px",
    lineHeight: "1.6"
  },
  mobileWelcomeText: {
    fontSize: "14px",
    marginBottom: "12px"
  },
  capabilitiesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
    maxWidth: "600px",
    margin: "24px 0"
  },
  mobileCapabilitiesGrid: {
    gap: "8px",
    margin: "16px 0"
  },
  capabilityCard: {
    background: "#f5f5f5",
    padding: "20px 16px",
    borderRadius: "20px",
    border: "1px solid #e0e0e0",
    transition: "all 0.3s ease",
    cursor: "pointer"
  },
  capabilityHint: {
    display: "block",
    marginTop: "8px",
    fontSize: "11px",
    color: "#666666",
    fontStyle: "italic"
  },
  documentBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#f5f5f5",
    padding: "12px 24px",
    borderRadius: "30px",
    marginTop: "16px",
    border: "1px solid #e0e0e0"
  },
  mobileDocumentBadge: {
    padding: "8px 16px",
    fontSize: "12px",
    flexWrap: "wrap",
    textAlign: "center"
  },
  documentBadgeText: {
    color: "#000000",
    fontSize: "14px",
    fontWeight: "500"
  },
  waitingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    marginBottom: "16px",
    background: "#f5f5f5",
    borderRadius: "12px",
    border: "1px solid #e0e0e0",
    animation: "fadeIn 0.3s ease-out"
  },
  waitingDots: {
    display: "flex",
    gap: "4px"
  },
  waitingDot: {
    width: "8px",
    height: "8px",
    background: "#000000",
    borderRadius: "50%",
    animation: "bounce 1.4s infinite ease-in-out"
  },
  waitingText: {
    color: "#666666",
    fontSize: "14px",
    fontWeight: "500"
  },
  typingIndicator: {
    display: "flex",
    gap: "4px",
    padding: "16px",
    marginLeft: "24px"
  },
  typingDot: {
    width: "8px",
    height: "8px",
    background: "#000000",
    borderRadius: "50%",
    animation: "bounce 1.4s infinite ease-in-out"
  },
  streamingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    marginBottom: "16px",
    borderRadius: "12px"
  },
  streamingDots: {
    display: "flex",
    gap: "4px"
  },
  streamingDot: {
    width: "8px",
    height: "8px",
    background: "#000000",
    borderRadius: "50%",
    animation: "pulse 1.4s infinite"
  },
  streamingText: {
    color: "#000000",
    fontSize: "14px",
    fontWeight: "500"
  },
  errorIndicator: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px 16px",
    marginBottom: "16px",
    borderRadius: "12px"
  },
  errorText: {
    color: "#f44336",
    fontSize: "14px",
    fontWeight: "500"
  },
  errorDismiss: {
    background: "none",
    borderRadius: "16px",
    padding: "4px 12px",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  scrollToBottomButton: {
    position: "fixed",
    bottom: "100px",
    right: "20px",
    width: "40px",
    height: "40px",
    background: "#000000",
    color: "#ffffff",
    border: "none",
    borderRadius: "20px",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    zIndex: 100
  },
  filePreview: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 16px",
    marginBottom: "8px",
    borderRadius: "20px"
  },
  mobileFilePreview: {
    padding: "6px 12px",
    fontSize: "12px"
  },
  fileInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    overflow: "hidden"
  },
  fileName: {
    color: "#000000",
    fontSize: "13px",
    fontWeight: "500",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "150px"
  },
  fileSize: {
    color: "#666666",
    fontSize: "11px"
  },
  removeFileButton: {
    background: "none",
    border: "none",
    padding: "4px",
    cursor: "pointer",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s"
  },
  uploadProgress: {
    height: "4px",
    background: "#f0f0f0",
    borderRadius: "2px",
    marginBottom: "8px",
    position: "relative",
    overflow: "hidden"
  },
  progressBar: {
    height: "100%",
    borderRadius: "2px",
    transition: "width 0.3s ease"
  },
  progressText: {
    position: "absolute",
    right: "0",
    top: "-16px",
    color: "#666666",
    fontSize: "10px"
  },
  inputArea: {
    padding: "24px",
    position: "relative",
    zIndex: 10
  },
  mobileInputArea: {
    padding: "12px",
    paddingBottom: "16px"
  },
  mobileInputAreaFocused: {
    paddingBottom: "8px"
  },
  inputForm: {
    display: "flex",
    gap: "12px",
    maxWidth: "900px",
    margin: "0 auto"
  },
  inputContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    borderRadius: "30px",
    padding: "4px 4px 4px 16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    position: "relative"
  },
  mobileInputContainer: {
    padding: "2px 2px 2px 12px"
  },
  textarea: {
    flex: 1,
    background: "transparent",
    border: "none",
    padding: "12px 8px",
    fontSize: "15px",
    resize: "none",
    maxHeight: "120px",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: "1.5"
  },
  mobileTextarea: {
    padding: "8px 4px",
    fontSize: "14px",
    maxHeight: "80px",
    minHeight: "40px"
  },
  inputHint: {
    position: "absolute",
    right: "50px",
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    background: "#f0f0f0",
    padding: "4px 8px",
    borderRadius: "12px",
    pointerEvents: "none"
  },
  inputHintText: {
    color: "#666666",
    fontSize: "10px"
  },
  attachButton: {
    background: "none",
    border: "none",
    padding: "8px",
    cursor: "pointer",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    minWidth: "44px",
    minHeight: "44px"
  },
  pauseButton: {
    border: "none",
    borderRadius: "30px",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    minWidth: "48px",
    minHeight: "48px"
  },
  mobilePauseButton: {
    width: "44px",
    height: "44px",
    minWidth: "44px",
    minHeight: "44px"
  },
  sendButton: {
    border: "none",
    borderRadius: "30px",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    minWidth: "48px",
    minHeight: "48px"
  },
  mobileSendButton: {
    width: "44px",
    height: "44px",
    minWidth: "44px",
    minHeight: "44px"
  },
  featureBadges: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginTop: "12px"
  },
  mobileFeatureBadges: {
    gap: "6px",
    marginTop: "8px",
    flexWrap: "wrap"
  },
  featureBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    background: "#f5f5f5",
    borderRadius: "20px",
    color: "#000000",
    fontSize: "11px"
  },
  disclaimer: {
    textAlign: "center",
    color: "#666666",
    fontSize: "11px",
    marginTop: "12px",
    letterSpacing: "0.3px"
  },
  mobileDisclaimer: {
    fontSize: "9px",
    marginTop: "8px"
  },
  mobileContainer: {
    width: "100%",
    height: "100dvh"
  },
  mobileHeader: {
    padding: "12px 16px",
    background: "#ffffff",
    borderBottom: "1px solid #e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 20
  },
  menuButton: {
    background: "none",
    border: "none",
    padding: "8px",
    cursor: "pointer",
    borderRadius: "8px",
    minWidth: "44px",
    minHeight: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }
};