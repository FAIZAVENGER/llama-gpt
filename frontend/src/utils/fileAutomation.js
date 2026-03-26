// src/utils/fileAutomation.js
// Client-side file automation for local device operations

class FileAutomation {
  constructor() {
    this.lastSearchResults = null;
    this.isSearching = false;
    this.fileHandles = new Map();
    this.hasAccess = false;
  }

  /**
   * Search for files on the local device
   * @param {string} pattern - Filename pattern to search for
   * @returns {Promise<Array>} - Array of matching files
   */
  async searchFiles(pattern) {
    this.isSearching = true;
    
    try {
      // First, check if we can use the File System Access API
      if ('showDirectoryPicker' in window) {
        return await this.searchWithModernAPI(pattern);
      } else {
        return await this.searchWithLegacyAPI(pattern);
      }
    } catch (error) {
      console.error('File search error:', error);
      return this.getInstructionalMessage(pattern);
    } finally {
      this.isSearching = false;
    }
  }

  /**
   * Search using modern File System Access API (Chrome, Edge, Opera)
   */
  async searchWithModernAPI(pattern) {
    try {
      // Show a clear message to the user first
      const shouldProceed = confirm(
        `🔍 File Search Required\n\n` +
        `To search for "${pattern}", I need to access your files.\n\n` +
        `When the folder picker opens:\n` +
        `1. Navigate to the folder you want to search (like Documents or Downloads)\n` +
        `2. Click "Allow" or "Select Folder"\n` +
        `3. I'll search that folder and its subfolders\n\n` +
        `Note: You can choose any folder - I'll only read file names, not the contents.`
      );
      
      if (!shouldProceed) {
        return [];
      }

      // Let user select a directory to search
      const directoryHandle = await window.showDirectoryPicker({
        id: 'file-search',
        mode: 'read',
        startIn: 'documents'
      });
      
      // Get the directory name for display
      const dirName = directoryHandle.name;
      
      const results = [];
      const patternLower = pattern.toLowerCase();
      
      // Recursively search directory (limited depth for performance)
      const searchDir = async (dirHandle, path = '', depth = 0) => {
        if (depth > 3) return; // Limit depth to avoid performance issues
        
        try {
          for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file') {
              const filename = entry.name;
              const fileLower = filename.toLowerCase();
              
              // Check if filename matches pattern
              if (fileLower.includes(patternLower) || 
                  patternLower.split('.').some(part => part && fileLower.includes(part))) {
                
                // Get basic file info without reading content
                let fileInfo = {
                  path: path + filename,
                  filename: filename,
                  directory: path || '/',
                  extension: filename.split('.').pop()?.toLowerCase() || '',
                  category: this.getFileCategory(filename.split('.').pop()?.toLowerCase() || ''),
                  handle: entry,
                  hasHandle: true,
                  size_readable: '?',
                  modified_readable: '?'
                };

                // Try to get size and modified date (may fail if no permission)
                try {
                  const file = await entry.getFile();
                  fileInfo.size = file.size;
                  fileInfo.size_readable = this.formatSize(file.size);
                  fileInfo.modified = new Date(file.lastModified).toISOString();
                  fileInfo.modified_readable = new Date(file.lastModified).toLocaleString();
                } catch (e) {
                  // If we can't get file details, that's okay
                  fileInfo.size_readable = 'Size unknown';
                  fileInfo.modified_readable = 'Date unknown';
                }
                
                results.push(fileInfo);
              }
            } else if (entry.kind === 'directory') {
              // Skip hidden directories and system folders
              if (!entry.name.startsWith('.') && 
                  !['node_modules', 'venv', 'env', '__pycache__', 'System', 'Library'].includes(entry.name)) {
                try {
                  const subDirHandle = await dirHandle.getDirectoryHandle(entry.name);
                  await searchDir(subDirHandle, path + entry.name + '/', depth + 1);
                } catch (e) {
                  // Skip directories we can't access
                }
              }
            }
          }
        } catch (err) {
          console.log('Error accessing directory:', err);
        }
      };
      
      await searchDir(directoryHandle);
      
      // Store results for selection
      this.lastSearchResults = {
        pattern,
        results,
        timestamp: new Date().toISOString(),
        method: 'modern',
        searchPath: dirName
      };
      
      // Store file handles for later opening
      results.forEach((file, index) => {
        if (file.handle) {
          this.fileHandles.set(index.toString(), file.handle);
        }
      });
      
      return {
        results,
        searchPath: dirName,
        method: 'modern'
      };
      
    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('dismissed')) {
        // User cancelled - return empty results with message
        return {
          cancelled: true,
          message: 'Search cancelled. Try again when ready.'
        };
      }
      console.error('Modern API error:', error);
      return {
        error: true,
        message: 'Could not access files. Please try a different folder.'
      };
    }
  }

  /**
   * Search using legacy file input (fallback for all browsers)
   */
  async searchWithLegacyAPI(pattern) {
    return new Promise((resolve) => {
      const message = 
        `🔍 File Search\n\n` +
        `To search for "${pattern}":\n\n` +
        `1. Click "Choose Folder" in the next dialog\n` +
        `2. Navigate to your Documents or Downloads folder\n` +
        `3. Select the folder and click "Upload"\n\n` +
        `Note: Your files are NOT uploaded anywhere - this happens locally in your browser.`;
      
      alert(message);
      
      // Create a file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.webkitdirectory = true;
      input.style.display = 'none';
      
      input.onchange = async (event) => {
        const files = Array.from(event.target.files);
        const results = [];
        const patternLower = pattern.toLowerCase();
        
        // Get the root directory name
        let rootDir = '';
        if (files.length > 0 && files[0].webkitRelativePath) {
          rootDir = files[0].webkitRelativePath.split('/')[0];
        }
        
        for (const file of files) {
          const filename = file.name;
          const fileLower = filename.toLowerCase();
          const path = file.webkitRelativePath || file.name;
          const directory = path.substring(0, path.lastIndexOf('/')) || '/';
          
          if (fileLower.includes(patternLower) || 
              patternLower.split('.').some(part => part && fileLower.includes(part))) {
            
            results.push({
              path: path,
              filename: filename,
              size: file.size,
              size_readable: this.formatSize(file.size),
              modified: new Date(file.lastModified).toISOString(),
              modified_readable: new Date(file.lastModified).toLocaleString(),
              directory: directory,
              extension: filename.split('.').pop()?.toLowerCase() || '',
              category: this.getFileCategory(filename.split('.').pop()?.toLowerCase() || ''),
              file: file,
              type: file.type
            });
          }
        }
        
        // Store results for selection
        this.lastSearchResults = {
          pattern,
          results,
          timestamp: new Date().toISOString(),
          method: 'legacy',
          searchPath: rootDir
        };
        
        // Store file references for later opening
        results.forEach((file, index) => {
          if (file.file) {
            this.fileHandles.set(index.toString(), file.file);
          }
        });
        
        document.body.removeChild(input);
        resolve({
          results,
          searchPath: rootDir,
          method: 'legacy'
        });
      };
      
      input.oncancel = () => {
        document.body.removeChild(input);
        resolve({
          cancelled: true,
          message: 'Search cancelled. Try again when ready.'
        });
      };
      
      document.body.appendChild(input);
      input.click();
    });
  }

  /**
   * Get instructional message when no file access
   */
  getInstructionalMessage(pattern) {
    return {
      instructional: true,
      message: `🔍 **How to search for files:**

Since browsers have security limitations, here's how to find "${pattern}":

**Option 1: Manual Search (Recommended)**
1. Open your File Explorer/Finder
2. Navigate to Documents or Downloads folder
3. Use the search bar to find "${pattern}"
4. Come back and tell me what you found

**Option 2: Let me help you search**
Try this instead:
- "find pdf files" - I'll help you search for PDFs
- "show me documents" - I'll guide you through finding documents

**Option 3: Upload a specific file**
Use the paperclip icon 📎 to upload a file you want me to analyze.

What would you like to do?`
    };
  }

  /**
   * Open a file on the local device
   * @param {Object} file - File object with handle or file reference
   * @returns {Promise<Object>} - Result of the operation
   */
  async openFile(file) {
    try {
      // Show instructions for opening files
      const instructions = 
        `📂 **Opening "${file.filename}"**\n\n` +
        `Since browsers can't directly open files from your system, here are your options:\n\n` +
        `1. **Manual Open**: Open your File Explorer/Finder and navigate to:\n` +
        `   ${file.directory || 'the folder where this file is located'}\n\n` +
        `2. **Download a Copy**: Click the link below to download this file\n\n` +
        `3. **Upload to Analyze**: Use the paperclip icon to upload and analyze the file`;
      
      // If we have a file handle, try to create a download link
      if (file.handle || file.file) {
        try {
          const fileData = file.handle ? await file.handle.getFile() : file.file;
          const url = URL.createObjectURL(fileData);
          
          return {
            success: true,
            message: instructions,
            downloadUrl: url,
            filename: file.filename,
            canDownload: true
          };
        } catch (e) {
          console.error('Error creating download:', e);
        }
      }
      
      return {
        success: true,
        message: instructions,
        canDownload: false,
        filename: file.filename,
        directory: file.directory
      };
      
    } catch (error) {
      console.error('Error opening file:', error);
      return {
        success: false,
        error: 'Could not open file. Please try downloading it manually.',
        instructions: true
      };
    }
  }

  /**
   * Open a file by its number from last search results
   * @param {number} number - File number (1-based index)
   * @returns {Promise<Object>} - Result of the operation
   */
  async openFileByNumber(number) {
    if (!this.lastSearchResults) {
      return {
        success: false,
        error: 'No recent search results found. Please search for files first.'
      };
    }
    
    const results = this.lastSearchResults.results;
    const index = number - 1;
    
    if (index >= 0 && index < results.length) {
      const file = results[index];
      return this.openFile(file);
    } else {
      return {
        success: false,
        error: `Invalid number. Please select a number between 1 and ${results.length}`
      };
    }
  }

  /**
   * Open a website in browser
   */
  openWebsite(website, searchQuery = '') {
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
      'meet': 'https://meet.google.com'
    };
    
    let url = '';
    
    if (websites[website]) {
      url = websites[website];
      
      if (website === 'youtube' && searchQuery) {
        url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
      } else if (website === 'google' && searchQuery) {
        url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      }
    } else if (website.includes('.')) {
      url = website.startsWith('http') ? website : 'https://' + website;
    } else {
      url = `https://www.google.com/search?q=${encodeURIComponent(website)}`;
    }
    
    window.open(url, '_blank');
    
    return {
      success: true,
      message: `🌐 Opened ${website}`,
      url
    };
  }

  /**
   * Open YouTube and search for videos
   */
  openYouTube(searchQuery) {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    window.open(url, '_blank');
    
    return {
      success: true,
      message: `🎬 Searching YouTube for: ${searchQuery}`,
      url
    };
  }

  /**
   * Format file size
   */
  formatSize(bytes) {
    if (!bytes) return 'Unknown';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Get file category based on extension
   */
  getFileCategory(ext) {
    const categories = {
      'image': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'],
      'document': ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'md'],
      'spreadsheet': ['xls', 'xlsx', 'csv', 'ods', 'numbers'],
      'presentation': ['ppt', 'pptx', 'key', 'odp'],
      'code': ['py', 'js', 'html', 'css', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs', 'ts', 'jsx', 'tsx'],
      'archive': ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
      'audio': ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
      'video': ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm']
    };
    
    for (const [category, extensions] of Object.entries(categories)) {
      if (extensions.includes(ext)) return category;
    }
    
    return 'other';
  }

  /**
   * Format file list for display
   */
  formatFileList(searchResult, pattern) {
    const { results, searchPath, method } = searchResult;
    
    let formatted = `🔍 Found ${results.length} file(s) matching '${pattern}' in **${searchPath || 'selected folder'}**:\n\n`;
    
    formatted += `📁 **Search location:** ${searchPath || 'Your selected folder'}\n`;
    formatted += `ℹ️ **Note:** I can show you where files are, but to open them you'll need to:\n`;
    formatted += `   • Open them manually in File Explorer/Finder\n`;
    formatted += `   • Upload them using the 📎 button\n\n`;
    formatted += `**Found files:**\n\n`;
    
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
        'other': '📁'
      };
      const emoji = emojis[file.category] || '📁';
      
      formatted += `${index + 1}. ${emoji} **${file.filename}**\n`;
      formatted += `   📁 Location: ${file.directory}\n`;
      formatted += `   📦 Size: ${file.size_readable}\n\n`;
    });
    
    formatted += '\n**To open a file:**\n';
    formatted += '1. Note the folder location above\n';
    formatted += '2. Open your File Explorer/Finder\n';
    formatted += '3. Navigate to that folder\n';
    formatted += '4. Open the file manually\n\n';
    formatted += 'Or type **"help with files"** for more options.';
    
    return formatted;
  }
}

// Create singleton instance
const fileAutomation = new FileAutomation();
export default fileAutomation;