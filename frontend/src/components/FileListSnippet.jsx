// src/components/FileListSnippet.jsx
import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, Image, Table, File, Music, Video, 
  Archive, Code, Folder, HardDrive, Calendar, 
  ExternalLink, Download, Copy, Check, Search,
  X, Maximize2, Minimize2, ChevronDown, ChevronUp,
  Play
} from "lucide-react";
import api from "../api";

export default function FileListSnippet({ files, searchPattern }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [openingIndex, setOpeningIndex] = useState(null);
  const [sortBy, setSortBy] = useState('number');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filteredFiles, setFilteredFiles] = useState(files);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [openError, setOpenError] = useState(null);
  const [openSuccess, setOpenSuccess] = useState(null);
  const [hoveredFile, setHoveredFile] = useState(null);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const errorTimeoutRef = useRef(null);
  const successTimeoutRef = useRef(null);

  // Calculate stats
  const totalFiles = files.length;
  const categories = files.reduce((acc, file) => {
    acc[file.category] = (acc[file.category] || 0) + 1;
    return acc;
  }, {});
  
  const totalSize = files.reduce((acc, file) => acc + (file.size || 0), 0);
  const formatTotalSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  // Clear error after 3 seconds
  useEffect(() => {
    if (openError) {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        setOpenError(null);
      }, 3000);
    }
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [openError]);

  // Clear success after 2 seconds
  useEffect(() => {
    if (openSuccess) {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => {
        setOpenSuccess(null);
      }, 2000);
    }
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, [openSuccess]);

  // Filter and sort files
  useEffect(() => {
    let result = [...files];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(file => 
        file.filename.toLowerCase().includes(term) ||
        (file.directory && file.directory.toLowerCase().includes(term)) ||
        file.category.toLowerCase().includes(term)
      );
    }
    
    result.sort((a, b) => {
      let aVal, bVal;
      
      switch(sortBy) {
        case 'name':
          aVal = a.filename.toLowerCase();
          bVal = b.filename.toLowerCase();
          break;
        case 'size':
          aVal = a.size || 0;
          bVal = b.size || 0;
          break;
        case 'date':
          aVal = new Date(a.modified || a.modified_readable).getTime();
          bVal = new Date(b.modified || b.modified_readable).getTime();
          break;
        case 'category':
          aVal = a.category || '';
          bVal = b.category || '';
          break;
        default:
          aVal = a.number || 0;
          bVal = b.number || 0;
          break;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    setFilteredFiles(result);
  }, [files, searchTerm, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const copyFileName = (filename, index) => {
    navigator.clipboard.writeText(filename);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyFullPath = (path, index) => {
    navigator.clipboard.writeText(path);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Function to open a file - FIXED VERSION
  const openFile = async (file, index) => {
    try {
      setOpeningIndex(index);
      setOpenError(null);
      
      console.log("Opening file:", file);
      
      // Clean the filename - remove emoji and extra spaces
      const cleanFilename = file.filename.replace(/[🖼️📄📊📁💻🎵🎬⚙️]/g, '').trim();
      console.log("Cleaned filename:", cleanFilename);
      
      // Get the directory path
      let directory = file.directory || '';
      
      // If directory is empty but we have path, extract directory from path
      if (!directory && file.path) {
        const pathParts = file.path.split('/');
        pathParts.pop(); // Remove filename
        directory = pathParts.join('/');
      }
      
      console.log("Directory:", directory);
      
      // Construct the full path
      let filePath = '';
      
      if (file.path && file.path.trim() !== '' && file.path !== directory) {
        // If we have a direct path that's not just the directory
        filePath = file.path;
      } else if (directory && directory.trim() !== '') {
        // If we have directory, combine with filename
        // Make sure directory ends with proper separator
        const separator = directory.endsWith('/') ? '' : '/';
        filePath = directory + separator + cleanFilename;
      } else {
        // Last resort: just use the filename (will search in current directory)
        filePath = cleanFilename;
      }
      
      console.log("Constructed file path:", filePath);
      
      // Validate path
      if (!filePath || filePath === '/' || filePath === '') {
        throw new Error("Invalid file path");
      }
      
      // Call the backend API to open the file
      const response = await api.post('/api/file/open', {
        file_path: filePath
      });
      
      console.log("Open file response:", response.data);
      
      if (response.data.success) {
        console.log("✅ File opened successfully:", response.data);
        setOpenSuccess(`Opened: ${cleanFilename}`);
        setCopiedIndex(`open-${index}`);
        setTimeout(() => {
          if (copiedIndex === `open-${index}`) {
            setCopiedIndex(null);
          }
        }, 1500);
      } else {
        throw new Error(response.data.error || "Failed to open file");
      }
    } catch (error) {
      console.error("❌ Error opening file:", error);
      
      let errorMsg = `Failed to open: ${file.filename}`;
      
      if (error.response) {
        errorMsg += ` - ${error.response.data?.error || error.response.statusText || 'Server error'}`;
        console.error("Server response:", error.response.data);
      } else if (error.request) {
        errorMsg += ` - No response from server`;
      } else {
        errorMsg += ` - ${error.message}`;
      }
      
      setOpenError(errorMsg);
    } finally {
      setOpeningIndex(null);
    }
  };

  const getCategoryEmoji = (category) => {
    switch(category) {
      case 'image': return '🖼️';
      case 'document': return '📄';
      case 'spreadsheet': return '📊';
      case 'presentation': return '📽️';
      case 'code': return '💻';
      case 'archive': return '🗜️';
      case 'audio': return '🎵';
      case 'video': return '🎬';
      case 'executable': return '⚙️';
      default: return '📁';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  return (
    <div style={styles.container}>
      {/* Error message */}
      {openError && (
        <div style={styles.errorMessage}>
          <X size={14} color="#f44336" />
          <span style={styles.errorText}>{openError}</span>
        </div>
      )}

      {/* Success message */}
      {openSuccess && (
        <div style={styles.successMessage}>
          <Check size={14} color="#4CAF50" />
          <span style={styles.successText}>{openSuccess}</span>
        </div>
      )}

      {/* Header with stats */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.searchIcon}>
            <Search size={14} color="#000000" />
          </div>
          <div>
            <span style={styles.headerTitle}>
              Found {totalFiles} file{totalFiles !== 1 ? 's' : ''}
            </span>
            <span style={styles.headerSubtitle}>
              matching "{searchPattern}"
            </span>
          </div>
        </div>
        
        <div style={styles.headerActions}>
          <button 
            onClick={toggleSearch}
            style={{
              ...styles.headerButton,
              background: showSearch ? '#e0e0e0' : 'transparent'
            }}
            title="Search within results"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = showSearch ? '#e0e0e0' : 'transparent';
            }}
          >
            <Search size={14} color="#666666" />
          </button>
          
          <button 
            onClick={() => setExpanded(!expanded)}
            style={styles.headerButton}
            title={expanded ? "Collapse" : "Expand"}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {expanded ? <Minimize2 size={14} color="#666666" /> : <Maximize2 size={14} color="#666666" />}
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div style={styles.searchContainer}>
          <Search size={14} color="#666666" style={{ marginLeft: '8px' }} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter files by name, location, or category..."
            style={styles.searchInput}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              style={styles.clearSearch}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#d0d0d0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#e0e0e0';
              }}
            >
              <X size={12} color="#666666" />
            </button>
          )}
        </div>
      )}

      {/* Stats bar */}
      <div style={styles.statsBar}>
        <div style={styles.stat}>
          <FileText size={12} color="#666666" />
          <span style={styles.statLabel}>{totalFiles} total</span>
        </div>
        <div style={styles.stat}>
          <HardDrive size={12} color="#666666" />
          <span style={styles.statLabel}>{formatTotalSize(totalSize)}</span>
        </div>
        {Object.entries(categories).slice(0, 3).map(([cat, count]) => (
          <div key={cat} style={styles.stat}>
            <span style={styles.statEmoji}>{getCategoryEmoji(cat)}</span>
            <span style={styles.statLabel}>{count}</span>
          </div>
        ))}
      </div>

      {/* Sort bar */}
      <div style={styles.sortBar}>
        <button 
          onClick={() => toggleSort('number')}
          style={{
            ...styles.sortButton,
            color: sortBy === 'number' ? '#000000' : '#666666'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          #
          {sortBy === 'number' && (
            <span style={styles.sortIndicator}>
              {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </button>
        
        <button 
          onClick={() => toggleSort('name')}
          style={{
            ...styles.sortButton,
            color: sortBy === 'name' ? '#000000' : '#666666'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Name
          {sortBy === 'name' && (
            <span style={styles.sortIndicator}>
              {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </button>
        
        <button 
          onClick={() => toggleSort('size')}
          style={{
            ...styles.sortButton,
            color: sortBy === 'size' ? '#000000' : '#666666'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Size
          {sortBy === 'size' && (
            <span style={styles.sortIndicator}>
              {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </button>
        
        <button 
          onClick={() => toggleSort('date')}
          style={{
            ...styles.sortButton,
            color: sortBy === 'date' ? '#000000' : '#666666'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Date
          {sortBy === 'date' && (
            <span style={styles.sortIndicator}>
              {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </button>
        
        <button 
          onClick={() => toggleSort('category')}
          style={{
            ...styles.sortButton,
            color: sortBy === 'category' ? '#000000' : '#666666'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Type
          {sortBy === 'category' && (
            <span style={styles.sortIndicator}>
              {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </button>
        
        <div style={styles.sortPlaceholder} />
      </div>

      {/* Scrollable file list */}
      <div 
        ref={containerRef}
        style={{
          ...styles.fileList,
          maxHeight: expanded ? '400px' : '300px'
        }}
      >
        {filteredFiles.length === 0 ? (
          <div style={styles.noResults}>
            No files match your filter criteria
          </div>
        ) : (
          filteredFiles.map((file, index) => {
            // Get the display number
            const displayNumber = file.number || index + 1;
            const isHovered = hoveredFile === index;
            
            return (
              <div 
                key={`${file.path}-${index}`} 
                style={{
                  ...styles.fileItem,
                  background: isHovered ? '#f8f8f8' : 'transparent',
                  transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={() => setHoveredFile(index)}
                onMouseLeave={() => setHoveredFile(null)}
              >
                <div style={styles.fileNumber}>
                  {displayNumber}
                </div>
                
                <div style={styles.fileIcon}>
                  <span style={styles.fileIconEmoji}>{file.emoji || getCategoryEmoji(file.category)}</span>
                </div>
                
                <div style={styles.fileContent}>
                  <div style={styles.fileNameRow}>
                    <span style={styles.fileName} title={file.filename}>
                      {file.filename}
                    </span>
                    {file.extension && (
                      <span style={styles.fileExtension}>
                        {file.extension}
                      </span>
                    )}
                  </div>
                  
                  <div style={styles.fileMeta}>
                    <span style={styles.fileDirectory} title={file.directory}>
                      <Folder size={10} color="#666666" />
                      {file.directory ? file.directory.split('/').pop() : 'Unknown'}
                    </span>
                    
                    {file.size_readable && (
                      <span style={styles.fileSize}>
                        <HardDrive size={10} color="#666666" />
                        {file.size_readable}
                      </span>
                    )}
                    
                    {file.modified_readable && (
                      <span style={styles.fileDate}>
                        <Calendar size={10} color="#666666" />
                        {formatDate(file.modified_readable)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div style={styles.fileActions}>
                  {/* Open button */}
                  <button
                    onClick={() => openFile(file, `open-${index}`)}
                    style={{
                      ...styles.fileActionButton,
                      background: openingIndex === `open-${index}` ? '#e0e0e0' : 'transparent',
                      borderColor: openingIndex === `open-${index}` ? '#000000' : '#e0e0e0',
                      transform: isHovered ? 'scale(1.1)' : 'scale(1)'
                    }}
                    title="Open file"
                    disabled={openingIndex === `open-${index}`}
                    onMouseEnter={(e) => {
                      if (openingIndex !== `open-${index}`) {
                        e.currentTarget.style.background = '#f0f0f0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (openingIndex !== `open-${index}`) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {openingIndex === `open-${index}` ? (
                      <div style={styles.loadingSpinner} />
                    ) : copiedIndex === `open-${index}` ? (
                      <Check size={12} color="#4CAF50" />
                    ) : (
                      <Play size={12} color="#4CAF50" />
                    )}
                  </button>
                  
                  {/* Copy filename button */}
                  <button
                    onClick={() => copyFileName(file.filename, `name-${index}`)}
                    style={{
                      ...styles.fileActionButton,
                      transform: isHovered ? 'scale(1.1)' : 'scale(1)'
                    }}
                    title="Copy filename"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f0f0f0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {copiedIndex === `name-${index}` ? (
                      <Check size={12} color="#4CAF50" />
                    ) : (
                      <Copy size={12} color="#666666" />
                    )}
                  </button>
                  
                  {/* Copy path button */}
                  <button
                    onClick={() => copyFullPath(file.path || file.directory, `path-${index}`)}
                    style={{
                      ...styles.fileActionButton,
                      transform: isHovered ? 'scale(1.1)' : 'scale(1)'
                    }}
                    title="Copy full path"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f0f0f0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {copiedIndex === `path-${index}` ? (
                      <Check size={12} color="#4CAF50" />
                    ) : (
                      <ExternalLink size={12} color="#666666" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer with selection hint */}
      <div style={styles.footer}>
        <div style={styles.footerHint}>
          <span style={styles.footerIcon}>📋</span>
          <span style={styles.footerText}>
            Click <Play size={10} color="#4CAF50" style={{ margin: '0 2px' }} /> to open, or type <code style={styles.footerCode}>open {filteredFiles[0]?.number || 1}</code>
          </span>
        </div>
        
        {filteredFiles.length !== totalFiles && (
          <div style={styles.footerFilter}>
            Showing {filteredFiles.length} of {totalFiles} files
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    margin: "16px 0",
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    transition: "box-shadow 0.3s ease",
    ':hover': {
      boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
    }
  },
  
  errorMessage: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "#ffebee",
    borderBottom: "1px solid #f44336",
    color: "#f44336",
    fontSize: "12px",
    animation: "slideInDown 0.3s ease-out",
  },
  
  successMessage: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "#e8f5e9",
    borderBottom: "1px solid #4CAF50",
    color: "#4CAF50",
    fontSize: "12px",
    animation: "slideInDown 0.3s ease-out",
  },
  
  errorText: {
    flex: 1,
  },
  
  successText: {
    flex: 1,
  },
  
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "#f5f5f5",
    borderBottom: "1px solid #e0e0e0",
  },
  
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  
  searchIcon: {
    width: "28px",
    height: "28px",
    background: "#e0e0e0",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  
  headerTitle: {
    color: "#000000",
    fontSize: "14px",
    fontWeight: "600",
  },
  
  headerSubtitle: {
    color: "#666666",
    fontSize: "12px",
    marginLeft: "4px",
  },
  
  headerActions: {
    display: "flex",
    gap: "4px",
  },
  
  headerButton: {
    width: "28px",
    height: "28px",
    background: "transparent",
    border: "1px solid #e0e0e0",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  
  searchContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "#f5f5f5",
    borderBottom: "1px solid #e0e0e0",
  },
  
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#000000",
    fontSize: "13px",
    outline: "none",
    padding: "4px 0",
  },
  
  clearSearch: {
    width: "20px",
    height: "20px",
    background: "#e0e0e0",
    border: "none",
    borderRadius: "10px",
    color: "#000000",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  
  statsBar: {
    display: "flex",
    gap: "12px",
    padding: "8px 12px",
    background: "#f5f5f5",
    borderBottom: "1px solid #e0e0e0",
    flexWrap: "wrap",
  },
  
  stat: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  
  statEmoji: {
    fontSize: "12px",
  },
  
  statLabel: {
    color: "#666666",
    fontSize: "11px",
  },
  
  sortBar: {
    display: "flex",
    gap: "4px",
    padding: "8px 12px",
    background: "#f5f5f5",
    borderBottom: "1px solid #e0e0e0",
  },
  
  sortButton: {
    background: "transparent",
    border: "none",
    fontSize: "11px",
    fontWeight: "500",
    padding: "2px 6px",
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "2px",
    transition: "all 0.2s",
  },
  
  sortIndicator: {
    color: "#000000",
    fontSize: "12px",
  },
  
  sortPlaceholder: {
    flex: 1,
  },
  
  fileList: {
    overflowY: "auto",
    scrollbarWidth: "thin",
    scrollbarColor: "#000000 #f0f0f0",
    transition: "max-height 0.3s ease",
    background: "#ffffff",
  },
  
  fileItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 12px",
    borderBottom: "1px solid #e0e0e0",
    transition: "all 0.2s ease",
    cursor: "pointer",
  },
  
  fileNumber: {
    width: "28px",
    height: "28px",
    background: "#f0f0f0",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#000000",
    fontSize: "12px",
    fontWeight: "600",
  },
  
  fileIcon: {
    width: "28px",
    height: "28px",
    background: "#f5f5f5",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  
  fileIconEmoji: {
    fontSize: "14px",
  },
  
  fileContent: {
    flex: 1,
    minWidth: 0,
  },
  
  fileNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginBottom: "2px",
  },
  
  fileName: {
    color: "#000000",
    fontSize: "13px",
    fontWeight: "500",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "200px",
  },
  
  fileExtension: {
    color: "#666666",
    fontSize: "11px",
    background: "#f0f0f0",
    padding: "1px 4px",
    borderRadius: "3px",
  },
  
  fileMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  
  fileDirectory: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    color: "#666666",
    fontSize: "10px",
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  
  fileSize: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    color: "#666666",
    fontSize: "10px",
  },
  
  fileDate: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    color: "#666666",
    fontSize: "10px",
  },
  
  fileActions: {
    display: "flex",
    gap: "4px",
  },
  
  fileActionButton: {
    width: "24px",
    height: "24px",
    background: "transparent",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  
  loadingSpinner: {
    width: "12px",
    height: "12px",
    border: "2px solid #000000",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  
  noResults: {
    padding: "24px",
    textAlign: "center",
    color: "#666666",
    fontSize: "13px",
  },
  
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    background: "#f5f5f5",
    borderTop: "1px solid #e0e0e0",
  },
  
  footerHint: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  
  footerIcon: {
    fontSize: "14px",
  },
  
  footerText: {
    color: "#666666",
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    gap: "2px",
  },
  
  footerCode: {
    background: "#e0e0e0",
    padding: "2px 4px",
    borderRadius: "4px",
    color: "#000000",
    fontSize: "11px",
    fontFamily: "monospace",
  },
  
  footerFilter: {
    color: "#666666",
    fontSize: "11px",
  },
};

// Add global animations
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes slideInDown {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;
document.head.appendChild(style);