// frontend/src/utils/desktopFileAutomation.js
class DesktopFileAutomation {
  constructor() {
    this.lastSearchResults = null;
    this.homeDir = null;
  }

  async init() {
    if (window.electronAPI) {
      try {
        this.homeDir = await window.electronAPI.getHomeDir();
        console.log('📁 Desktop automation initialized, home dir:', this.homeDir);
      } catch (error) {
        console.error('Failed to initialize desktop automation:', error);
      }
    }
  }

  async searchFiles(pattern) {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    console.log('🔍 Searching for:', pattern);
    
    try {
      // Ask user to select folder
      const searchPath = await window.electronAPI.selectFolder();
      if (!searchPath) {
        return []; // User cancelled
      }

      console.log('📂 Searching in:', searchPath);
      const result = await window.electronAPI.searchFiles(pattern, searchPath);
      
      if (result.success) {
        this.lastSearchResults = {
          pattern,
          results: result.results,
          timestamp: new Date().toISOString()
        };
        return result.results;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('File search error:', error);
      throw error;
    }
  }

  async openFileByNumber(number) {
    if (!window.electronAPI) {
      return {
        success: false,
        error: 'Electron API not available'
      };
    }

    if (!this.lastSearchResults) {
      return {
        success: false,
        error: 'No recent search results found. Please search for files first.'
      };
    }

    return await window.electronAPI.openFileByNumber(number);
  }

  async openFile(filePath) {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    return await window.electronAPI.openFile(filePath);
  }

  async openWebsite(url) {
    if (!window.electronAPI) {
      window.open(url, '_blank');
      return { success: true };
    }
    return await window.electronAPI.openExternal(url);
  }

  formatFileList(results, pattern) {
    let formatted = `🔍 I found ${results.length} file(s) matching '${pattern}':\n\n`;
    
    // Add note that these are from your local machine
    formatted += `*Files from your computer*\n\n`;
    
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
  }
}

const desktopFileAutomation = new DesktopFileAutomation();
export default desktopFileAutomation;