// src/components/Message.jsx - Shows file info in user messages and adds document close/minimize button
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { 
  Copy, Check, Zap, User, Clock, Image as ImageIcon, 
  Download, FileText, X, List, Search, Minimize2, Maximize2, XCircle
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import FileListSnippet from "./FileListSnippet";

export default function Message({ message, isStreaming }) {
  const [copiedCode, setCopiedCode] = useState(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [displayedContent, setDisplayedContent] = useState("");
  const [showImage, setShowImage] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [fileListData, setFileListData] = useState(null);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [documentMinimized, setDocumentMinimized] = useState(false);
  const actionRef = useRef(null);
  
  const isUser = message.role === "user";

  useEffect(() => {
    if (isStreaming && message.content) {
      setDisplayedContent(message.content);
    } else if (!isStreaming && message.content) {
      setDisplayedContent(message.content);
    }
  }, [message.content, isStreaming]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionRef.current && !actionRef.current.contains(event.target)) {
        setShowDownloadOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if message contains file search results - FIXED VERSION
  useEffect(() => {
    if (!isUser && !isStreaming && message.content) {
      console.log("Checking message for file search results...");
      
      // Try multiple patterns to detect file search
      const patterns = [
        /🔍 I found (\d+) file\(s\) matching '(.+)':/,
        /Found (\d+) file\(s\) matching ['"](.+)['"]:/,
        /🔍 Found (\d+) files? matching ['"](.+)['"]:/,
        /I found (\d+) file\(s\) matching ['"](.+)['"]:/
      ];
      
      let match = null;
      let searchPattern = null;
      let totalFiles = null;
      
      for (const pattern of patterns) {
        match = message.content.match(pattern);
        if (match) {
          totalFiles = parseInt(match[1]);
          searchPattern = match[2];
          console.log(`✅ Detected file search: ${totalFiles} files matching "${searchPattern}"`);
          break;
        }
      }
      
      if (match && searchPattern && totalFiles) {
        // Parse the file list from the content
        const files = [];
        const lines = message.content.split('\n');
        
        let inFileList = false;
        let currentFile = null;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Skip empty lines
          if (!line) continue;
          
          // Check if we're entering the file list (after the summary line)
          if (line.includes('```') && !inFileList) {
            inFileList = true;
            continue;
          } else if (line.includes('```') && inFileList) {
            inFileList = false;
            continue;
          }
          
          if (inFileList) {
            // Try to match numbered file entries with various formats
            // Format: "1. 📊 Car_sales.csv" or "1. Car_sales.csv"
            const fileEntryMatch = line.match(/^(\d+)\.\s+(?:([🖼️📄📊📁💻🎵🎬⚙️])\s+)?(.+)$/);
            
            if (fileEntryMatch) {
              // Save previous file
              if (currentFile) {
                files.push(currentFile);
              }
              
              const number = parseInt(fileEntryMatch[1]);
              const emoji = fileEntryMatch[2] || '';
              let filename = fileEntryMatch[3];
              
              // Clean filename
              filename = filename.replace(/\s*\([^)]*\)\s*$/, '').trim();
              
              // Determine category from emoji or extension
              let category = 'other';
              if (emoji === '🖼️') category = 'image';
              else if (emoji === '📄') category = 'document';
              else if (emoji === '📊') category = 'spreadsheet';
              else if (emoji === '📁') category = 'directory';
              else if (emoji === '💻') category = 'code';
              else if (emoji === '🎵') category = 'audio';
              else if (emoji === '🎬') category = 'video';
              else if (emoji === '⚙️') category = 'executable';
              else {
                // Try to determine from file extension
                const ext = filename.split('.').pop()?.toLowerCase() || '';
                if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) category = 'image';
                else if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) category = 'document';
                else if (['csv', 'xls', 'xlsx'].includes(ext)) category = 'spreadsheet';
                else if (['py', 'js', 'html', 'css'].includes(ext)) category = 'code';
              }
              
              currentFile = {
                number,
                filename,
                emoji,
                category,
                path: '',
                directory: '',
                size: 0,
                size_readable: '',
                modified_readable: ''
              };
            }
            // Try to match directory lines
            else if (currentFile && line.includes('📁')) {
              const dirMatch = line.match(/📁\s+(.+)$/);
              if (dirMatch) {
                currentFile.directory = dirMatch[1].trim();
                currentFile.path = dirMatch[1].trim();
              }
            }
            // Try to match size and date lines
            else if (currentFile && line.includes('📦')) {
              // Pattern: 📦 15.6 KB  🕒 2025-08-25 20:14:41
              const sizeDateMatch = line.match(/📦\s+([\d.]+\s+[A-Z]+)\s+🕒\s+(.+)$/);
              if (sizeDateMatch) {
                currentFile.size_readable = sizeDateMatch[1];
                currentFile.modified_readable = sizeDateMatch[2];
                
                // Parse size in bytes
                const sizeStr = sizeDateMatch[1];
                const [num, unit] = sizeStr.split(' ');
                const value = parseFloat(num);
                if (unit === 'B') currentFile.size = value;
                else if (unit === 'KB') currentFile.size = value * 1024;
                else if (unit === 'MB') currentFile.size = value * 1024 * 1024;
                else if (unit === 'GB') currentFile.size = value * 1024 * 1024 * 1024;
              }
            }
          }
        }
        
        // Add the last file
        if (currentFile) {
          files.push(currentFile);
        }
        
        if (files.length > 0) {
          console.log(`✅ Parsed ${files.length} files for snippet`);
          setFileListData({
            files,
            total: totalFiles,
            pattern: searchPattern
          });
        } else {
          console.log("⚠️ No files parsed from the message");
        }
      }
    }
  }, [isUser, isStreaming, message.content]);

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copyMessageToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const downloadContent = (format) => {
    let content = message.content;
    let filename = `message_${Date.now()}`;
    let mimeType = 'text/plain';

    if (format === 'markdown') {
      filename += '.md';
      mimeType = 'text/markdown';
    } else if (format === 'html') {
      filename += '.html';
      mimeType = 'text/html';
      content = `<html><body><pre>${content}</pre></body></html>`;
    } else {
      filename += '.txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowDownloadOptions(false);
  };

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const closeDocument = () => {
    setDocumentVisible(false);
  };

  const toggleMinimizeDocument = () => {
    setDocumentMinimized(!documentMinimized);
  };

  // Check if message is a document generation message
  const isDocumentMessage = () => {
    if (isUser || isStreaming) return false;
    return message.content && (
      message.content.includes('📄') || 
      message.content.includes('document') ||
      (message.content.length > 500 && message.content.includes('Generated'))
    );
  };

  const isDocument = isDocumentMessage();

  if (isStreaming && !displayedContent) {
    return (
      <div style={styles.messageWrapper(isUser)}>
        <div style={styles.messageContainer(isUser)}>
          {!isUser && (
            <div style={styles.header}>
              <div style={styles.avatar}>
                <Zap size={16} color="#ffffff" />
              </div>
              <span style={styles.name}>LeadSOC-AI</span>
            </div>
          )}
          <div style={styles.loadingDots}>
            <div style={styles.dot} />
            <div style={{...styles.dot, animationDelay: "0.2s"}} />
            <div style={{...styles.dot, animationDelay: "0.4s"}} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.messageWrapper(isUser)}>
      <div style={styles.messageContainer(isUser)}>
        {!isUser && (
          <div style={styles.header}>
            <div style={styles.avatar}>
              <Zap size={16} color="#ffffff" />
            </div>
            <div style={styles.headerContent}>
              <span style={styles.name}>LeadSOC-AI</span>
              <span style={styles.time}>
                <Clock size={12} />
                {formatTime()}
              </span>
            </div>
            {isStreaming && (
              <div style={styles.streamingDots}>
                <span style={styles.streamingDot} />
                <span style={{...styles.streamingDot, animationDelay: "0.2s"}} />
                <span style={{...styles.streamingDot, animationDelay: "0.4s"}} />
              </div>
            )}
          </div>
        )}
        
        {isUser && (
          <div style={styles.userHeader}>
            <span style={styles.time}>
              <Clock size={12} />
              {formatTime()}
            </span>
            <span style={styles.userName}>You</span>
            <div style={styles.userAvatar}>
              <User size={14} color="#ffffff" />
            </div>
          </div>
        )}
        
        {/* Show file info if this is a user message with a file */}
        {isUser && message.file_info && (
          <div style={styles.userFileInfo}>
            {message.image_data ? (
              <ImageIcon size={14} color="#000000" />
            ) : (
              <FileText size={14} color="#000000" />
            )}
            <span style={styles.userFileInfoText}>
              {message.file_info.filename || "Attached file"}
            </span>
          </div>
        )}
        
        {isUser && message.image_data && (
          <div style={styles.imageContainer} onClick={() => setShowImage(!showImage)}>
            <img 
              src={message.image_data} 
              alt="Uploaded" 
              style={styles.image(showImage)}
            />
          </div>
        )}
        
        <div style={styles.content}>
          {/* If this is a file search result with parsed data, show the snippet */}
          {fileListData && !isUser && !isStreaming ? (
            <>
              {/* Show the summary line */}
              <div style={styles.searchSummary}>
                <Search size={14} color="#000000" />
                <span>
                  Found {fileListData.total} file(s) matching "{fileListData.pattern}"
                </span>
              </div>
              
              {/* Show the file list snippet */}
              <FileListSnippet 
                files={fileListData.files} 
                searchPattern={fileListData.pattern}
              />
              
              {/* Show the selection hint */}
              <div style={styles.selectionHint}>
                <List size={14} color="#000000" />
                <span>Type <code style={styles.hintCode}>open [number]</code> to open a file</span>
              </div>
            </>
          ) : (
            /* Normal message rendering with document controls */
            <>
              {/* Document controls for AI messages that look like documents */}
              {isDocument && documentVisible && !isStreaming && !fileListData && (
                <div style={styles.documentControls}>
                  <button 
                    onClick={toggleMinimizeDocument}
                    style={styles.documentControlButton}
                    title={documentMinimized ? "Expand" : "Minimize"}
                  >
                    {documentMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                  </button>
                  <button 
                    onClick={closeDocument}
                    style={{...styles.documentControlButton, ...styles.documentCloseButton}}
                    title="Close"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              )}
              
              {/* Document content (hidden if minimized) */}
              {(!isDocument || !documentMinimized || !documentVisible) && (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const code = String(children).replace(/\n$/, "");
                      
                      return !inline && match ? (
                        <div style={styles.codeBlock}>
                          <div style={styles.codeHeader}>
                            <span style={styles.codeLanguage}>{match[1]}</span>
                            <button
                              onClick={() => copyToClipboard(code)}
                              style={styles.copyButton}
                            >
                              {copiedCode === code ? <Check size={14} /> : <Copy size={14} />}
                              <span>{copiedCode === code ? 'Copied!' : 'Copy'}</span>
                            </button>
                          </div>
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            customStyle={styles.codeStyle}
                            {...props}
                          >
                            {code}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code style={styles.inlineCode}>{children}</code>
                      );
                    },
                    table: ({ children }) => (
                      <div style={styles.tableWrapper}>
                        <table style={styles.table}>{children}</table>
                      </div>
                    ),
                    th: ({ children }) => <th style={styles.th}>{children}</th>,
                    td: ({ children }) => <td style={styles.td}>{children}</td>,
                    p: ({ children }) => <p style={styles.paragraph(isUser)}>{children}</p>,
                    h1: ({ children }) => <h1 style={styles.h1}>{children}</h1>,
                    h2: ({ children }) => <h2 style={styles.h2}>{children}</h2>,
                    h3: ({ children }) => <h3 style={styles.h3}>{children}</h3>,
                    ul: ({ children }) => <ul style={styles.list}>{children}</ul>,
                    ol: ({ children }) => <ol style={styles.list}>{children}</ol>,
                    li: ({ children }) => <li style={styles.listItem}>{children}</li>,
                    blockquote: ({ children }) => <blockquote style={styles.blockquote}>{children}</blockquote>,
                    a: ({ children, href }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" style={styles.link(isUser)}>
                        {children}
                      </a>
                    ),
                  }}
                >
                  {displayedContent}
                </ReactMarkdown>
              )}
              
              {/* Show minimized indicator */}
              {isDocument && documentMinimized && documentVisible && (
                <div style={styles.minimizedDocument}>
                  <FileText size={16} color="#000000" />
                  <span style={styles.minimizedDocumentText}>
                    Document minimized - Click expand to view
                  </span>
                </div>
              )}
            </>
          )}
        </div>
        
        {!isStreaming && (
          <div ref={actionRef} style={styles.actions(isUser)}>
            <button onClick={copyMessageToClipboard} style={styles.actionButton}>
              {copiedMessage ? <Check size={14} color="#4CAF50" /> : <Copy size={14} color="#666666" />}
              <span>Copy</span>
            </button>
            
            {!isUser && (
              <button onClick={() => setShowDownloadOptions(!showDownloadOptions)} style={styles.actionButton}>
                <Download size={14} color="#666666" />
                <span>Download</span>
              </button>
            )}

            {showDownloadOptions && !isUser && (
              <div style={styles.downloadMenu}>
                <button onClick={() => downloadContent('text')} style={styles.downloadMenuItem}>
                  <FileText size={12} />
                  <span>Download as TXT</span>
                </button>
                <button onClick={() => downloadContent('markdown')} style={styles.downloadMenuItem}>
                  <FileText size={12} />
                  <span>Download as MD</span>
                </button>
                <button onClick={() => downloadContent('html')} style={styles.downloadMenuItem}>
                  <FileText size={12} />
                  <span>Download as HTML</span>
                </button>
              </div>
            )}
          </div>
        )}
        
        {isStreaming && !isUser && (
          <span style={styles.cursor}>▊</span>
        )}
      </div>
    </div>
  );
}

const styles = {
  messageWrapper: (isUser) => ({
    display: "flex",
    justifyContent: isUser ? "flex-end" : "flex-start",
    marginBottom: "24px",
    animation: "fadeIn 0.3s ease-out",
    width: "100%",
  }),
  
  messageContainer: (isUser) => ({
    maxWidth: isUser ? "70%" : "85%",
    width: isUser ? "auto" : "100%",
    ...(isUser ? {
      background: "#f0f0f0",
      color: "#000000",
      borderRadius: "20px 20px 5px 20px",
      padding: "14px 18px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    } : {
      color: "#000000",
      width: "100%",
    })
  }),
  
  header: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
    padding: "4px 0",
  },
  
  headerContent: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
  },
  
  avatar: {
    width: "28px",
    height: "28px",
    background: "#000000",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  
  name: {
    color: "#000000",
    fontSize: "14px",
    fontWeight: "600",
  },
  
  time: {
    color: "#666666",
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    gap: "3px",
  },
  
  streamingDots: {
    display: "flex",
    gap: "3px",
    marginLeft: "auto",
  },
  
  streamingDot: {
    width: "4px",
    height: "4px",
    background: "#000000",
    borderRadius: "50%",
    animation: "pulse 1.4s infinite",
  },
  
  userHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    justifyContent: "flex-end",
  },
  
  userName: {
    color: "#000000",
    fontSize: "13px",
    fontWeight: "500",
  },
  
  userAvatar: {
    width: "24px",
    height: "24px",
    background: "#cccccc",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  userFileInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
    padding: "6px 10px",
    background: "#e0e0e0",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#000000",
  },

  userFileInfoText: {
    fontWeight: "500",
    fontSize: "12px",
  },
  
  imageContainer: {
    marginBottom: "12px",
    borderRadius: "12px",
    overflow: "hidden",
    border: "2px solid rgba(0,0,0,0.1)",
    cursor: "pointer",
  },
  
  image: (showImage) => ({
    width: "100%",
    maxHeight: showImage ? "none" : "200px",
    objectFit: showImage ? "contain" : "cover",
    transition: "all 0.3s ease",
  }),
  
  content: {
    lineHeight: "1.6",
    fontSize: "15px",
    wordBreak: "break-word",
    position: "relative",
  },
  
  documentControls: {
    position: "absolute",
    top: "-10px",
    right: "-10px",
    display: "flex",
    gap: "4px",
    zIndex: 10,
  },
  
  documentControlButton: {
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
    color: "#666666",
  },
  
  documentCloseButton: {
    color: "#f44336",
  },
  
  minimizedDocument: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px",
    background: "#f5f5f5",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
    marginTop: "8px",
  },
  
  minimizedDocumentText: {
    color: "#666666",
    fontSize: "13px",
  },
  
  searchSummary: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    padding: "8px 12px",
    background: "#f5f5f5",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
    color: "#000000",
    fontSize: "13px",
    fontWeight: "500",
  },
  
  paragraph: (isUser) => ({
    margin: "8px 0",
    lineHeight: "1.6",
    color: isUser ? "#000000" : "#000000",
  }),
  
  h1: {
    fontSize: "24px",
    margin: "20px 0 12px",
    color: "#000000",
    borderBottom: "2px solid #000000",
    paddingBottom: "8px",
  },
  
  h2: {
    fontSize: "20px",
    margin: "16px 0 8px",
    color: "#000000",
  },
  
  h3: {
    fontSize: "18px",
    margin: "14px 0 6px",
    color: "#000000",
  },
  
  list: {
    margin: "8px 0",
    paddingLeft: "20px",
    color: "#000000",
  },
  
  listItem: {
    margin: "4px 0",
    lineHeight: "1.6",
    color: "#000000",
  },
  
  blockquote: {
    margin: "12px 0",
    padding: "12px 20px",
    borderLeft: "4px solid #000000",
    background: "#f5f5f5",
    borderRadius: "4px",
    color: "#000000",
    fontStyle: "italic",
  },
  
  link: (isUser) => ({
    color: isUser ? "#000000" : "#000000",
    textDecoration: "underline",
    textDecorationColor: "rgba(0,0,0,0.3)",
  }),
  
  codeBlock: {
    position: "relative",
    margin: "16px 0",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    border: "1px solid #e0e0e0",
  },
  
  codeHeader: {
    background: "#f5f5f5",
    padding: "8px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #e0e0e0",
  },
  
  codeLanguage: {
    color: "#000000",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontWeight: "600",
  },
  
  copyButton: {
    background: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "6px",
    padding: "4px 10px",
    color: "#000000",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
  },
  
  codeStyle: {
    margin: 0,
    padding: "16px",
    background: "#1a1a1a",
    fontSize: "14px",
    lineHeight: "1.6",
  },
  
  inlineCode: {
    background: "#f5f5f5",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "0.9em",
    color: "#000000",
    border: "1px solid #e0e0e0",
  },
  
  tableWrapper: {
    overflowX: "auto",
    margin: "16px 0",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
  },
  
  table: {
    borderCollapse: "collapse",
    width: "100%",
    background: "#ffffff",
  },
  
  th: {
    background: "#f5f5f5",
    padding: "12px 16px",
    textAlign: "left",
    borderBottom: "2px solid #000000",
    borderRight: "1px solid #e0e0e0",
    color: "#000000",
    fontWeight: "600",
    fontSize: "14px",
  },
  
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #e0e0e0",
    borderRight: "1px solid #e0e0e0",
    color: "#000000",
    fontSize: "14px",
  },
  
  selectionHint: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "12px",
    padding: "8px 12px",
    background: "#f5f5f5",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
    color: "#666666",
    fontSize: "12px",
  },
  
  hintCode: {
    background: "#e0e0e0",
    padding: "2px 4px",
    borderRadius: "4px",
    color: "#000000",
    fontSize: "11px",
    fontFamily: "monospace",
  },
  
  actions: (isUser) => ({
    display: "flex",
    gap: "4px",
    marginTop: "8px",
    justifyContent: isUser ? "flex-end" : "flex-start",
    opacity: 0.7,
    transition: "opacity 0.2s ease",
    position: "relative",
  }),
  
  actionButton: {
    background: "#f5f5f5",
    border: "1px solid #e0e0e0",
    borderRadius: "6px",
    padding: "4px 8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    transition: "all 0.2s",
    color: "#666666",
    fontSize: "12px",
  },
  
  downloadMenu: {
    position: "absolute",
    bottom: "30px",
    left: "0",
    background: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    zIndex: 100,
    minWidth: "150px",
    animation: "fadeIn 0.2s ease-out",
  },
  
  downloadMenuItem: {
    width: "100%",
    padding: "8px 12px",
    background: "none",
    border: "none",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#000000",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  
  loadingDots: {
    display: "flex",
    gap: "4px",
    padding: "8px 0",
  },
  
  dot: {
    width: "8px",
    height: "8px",
    background: "#000000",
    borderRadius: "50%",
    animation: "bounce 1.4s infinite ease-in-out",
  },
  
  cursor: {
    display: "inline-block",
    marginLeft: "2px",
    color: "#000000",
    animation: "blink 1s infinite",
    fontSize: "16px",
    lineHeight: "1",
  },
};

// Add global animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
`;
document.head.appendChild(style);