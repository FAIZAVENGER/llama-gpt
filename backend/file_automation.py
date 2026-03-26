# file_automation.py
import os
import subprocess
import platform
import threading
import time
import json
from pathlib import Path
import fnmatch
import re
from datetime import datetime, timedelta
import webbrowser
import urllib.parse

# Try to import psutil, but don't fail if not available
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    print("⚠️ psutil not installed. Some features may be limited.")

class FileAutomation:
    def __init__(self):
        self.system = platform.system()
        self.home_dir = str(Path.home())
        self.search_results = {}
        self.last_search_results = None  # Store last search results for selection
        self.search_thread = None
        self.is_searching = False
        self.index_cache = {}
        self.common_dirs = self._get_common_directories()
        
        # Common application paths
        self.app_paths = self._get_common_app_paths()
        
        # Common websites
        self.websites = {
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
            'flipkart': 'https://flipkart.com',
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
            'trello': 'https://trello.com',
            'asana': 'https://asana.com',
            'jira': 'https://jira.com',
            'confluence': 'https://confluence.com',
        }
        
        print(f"✅ File Automation initialized on {self.system}")
        print(f"📁 Home directory: {self.home_dir}")
        
    def _get_common_directories(self):
        """Get common directories to search based on OS"""
        common = []
        
        # Documents folders
        if self.system == "Windows":
            common.extend([
                os.path.join(self.home_dir, "Documents"),
                os.path.join(self.home_dir, "Downloads"),
                os.path.join(self.home_dir, "Desktop"),
                os.path.join(self.home_dir, "Pictures"),
                os.path.join(self.home_dir, "Music"),
                os.path.join(self.home_dir, "Videos"),
                "C:\\Program Files",
                "C:\\Program Files (x86)",
            ])
        else:  # macOS/Linux
            common.extend([
                os.path.join(self.home_dir, "Documents"),
                os.path.join(self.home_dir, "Downloads"),
                os.path.join(self.home_dir, "Desktop"),
                os.path.join(self.home_dir, "Pictures"),
                os.path.join(self.home_dir, "Music"),
                os.path.join(self.home_dir, "Videos"),
                os.path.join(self.home_dir, "Projects"),
                os.path.join(self.home_dir, "Work"),
                "/Applications" if self.system == "Darwin" else "/usr/local",
            ])
        
        # Also add the entire home directory for thorough search
        common.append(self.home_dir)
        
        # Filter only existing directories
        existing_dirs = [d for d in common if os.path.exists(d)]
        print(f"📂 Searching in: {len(existing_dirs)} directories")
        return existing_dirs
    
    def _get_common_app_paths(self):
        """Get common application paths based on OS"""
        apps = {}
        
        if self.system == "Windows":
            # Windows common app paths
            program_files = os.environ.get('ProgramFiles', 'C:\\Program Files')
            program_files_x86 = os.environ.get('ProgramFiles(x86)', 'C:\\Program Files (x86)')
            local_app_data = os.environ.get('LOCALAPPDATA', os.path.join(self.home_dir, 'AppData', 'Local'))
            
            apps.update({
                'chrome': os.path.join(program_files_x86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
                'firefox': os.path.join(program_files, 'Mozilla Firefox', 'firefox.exe'),
                'edge': os.path.join(program_files_x86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
                'vscode': os.path.join(local_app_data, 'Programs', 'Microsoft VS Code', 'Code.exe'),
                'code': os.path.join(local_app_data, 'Programs', 'Microsoft VS Code', 'Code.exe'),
                'excel': os.path.join(program_files, 'Microsoft Office', 'root', 'Office16', 'EXCEL.EXE'),
                'word': os.path.join(program_files, 'Microsoft Office', 'root', 'Office16', 'WINWORD.EXE'),
                'powerpoint': os.path.join(program_files, 'Microsoft Office', 'root', 'Office16', 'POWERPNT.EXE'),
                'outlook': os.path.join(program_files, 'Microsoft Office', 'root', 'Office16', 'OUTLOOK.EXE'),
                'notepad': 'notepad.exe',
                'calculator': 'calc.exe',
                'paint': 'mspaint.exe',
                'spotify': os.path.join(local_app_data, 'Spotify', 'Spotify.exe'),
                'slack': os.path.join(local_app_data, 'slack', 'slack.exe'),
                'discord': os.path.join(local_app_data, 'Discord', 'app-*', 'Discord.exe'),
                'telegram': os.path.join(local_app_data, 'Telegram Desktop', 'Telegram.exe'),
                'zoom': os.path.join(program_files, 'Zoom', 'bin', 'Zoom.exe'),
                'teams': os.path.join(local_app_data, 'Microsoft', 'Teams', 'current', 'Teams.exe'),
            })
            
        elif self.system == "Darwin":  # macOS
            # macOS app paths (in /Applications)
            apps.update({
                'chrome': '/Applications/Google Chrome.app',
                'firefox': '/Applications/Firefox.app',
                'safari': '/Applications/Safari.app',
                'vscode': '/Applications/Visual Studio Code.app',
                'code': '/Applications/Visual Studio Code.app',
                'excel': '/Applications/Microsoft Excel.app',
                'word': '/Applications/Microsoft Word.app',
                'powerpoint': '/Applications/Microsoft PowerPoint.app',
                'outlook': '/Applications/Microsoft Outlook.app',
                'notes': '/Applications/Notes.app',
                'calendar': '/Applications/Calendar.app',
                'music': '/Applications/Music.app',
                'photos': '/Applications/Photos.app',
                'preview': '/Applications/Preview.app',
                'terminal': '/Applications/Utilities/Terminal.app',
                'finder': '/System/Library/CoreServices/Finder.app',
                'spotify': '/Applications/Spotify.app',
                'slack': '/Applications/Slack.app',
                'discord': '/Applications/Discord.app',
                'telegram': '/Applications/Telegram.app',
                'zoom': '/Applications/zoom.us.app',
                'teams': '/Applications/Microsoft Teams.app',
            })
            
        else:  # Linux
            # Linux common commands (using 'which' to find paths)
            apps.update({
                'chrome': 'google-chrome',
                'firefox': 'firefox',
                'vscode': 'code',
                'code': 'code',
                'libreoffice': 'libreoffice',
                'terminal': 'gnome-terminal',
                'calculator': 'gnome-calculator',
                'files': 'nautilus',
            })
        
        return apps
    
    def search_files(self, filename_pattern, search_paths=None, case_sensitive=False, file_types=None, max_results=1000):
        """
        Search for files matching pattern
        
        Args:
            filename_pattern: String to search for in filenames
            search_paths: List of paths to search (uses common dirs if None)
            case_sensitive: Whether search is case sensitive
            file_types: List of extensions to filter (e.g., ['.pdf', '.docx'])
            max_results: Maximum number of results to return (set high to get all files)
        
        Returns:
            List of matching file paths
        """
        results = []
        
        if search_paths is None:
            search_paths = self.common_dirs
        
        # Convert pattern to lowercase for case-insensitive search
        if not case_sensitive:
            pattern_lower = filename_pattern.lower()
        else:
            pattern_lower = filename_pattern
        
        # Remove file extension from pattern if present for better matching
        pattern_without_ext = pattern_lower
        if '.' in pattern_lower:
            pattern_without_ext = pattern_lower.split('.')[0]
        
        # File type filter
        ext_filter = None
        if file_types:
            ext_filter = tuple(ext.lower() if ext.startswith('.') else f'.{ext.lower()}' 
                              for ext in file_types)
            print(f"🔍 Filtering by extensions: {ext_filter}")
        
        print(f"🔍 Searching for: '{filename_pattern}' in {len(search_paths)} directories...")
        files_found = 0
        
        for search_path in search_paths:
            if not os.path.exists(search_path):
                continue
                
            try:
                for root, dirs, files in os.walk(search_path):
                    # Skip hidden directories and system folders for speed
                    dirs[:] = [d for d in dirs if not d.startswith('.') and 
                              d not in ['node_modules', 'venv', 'env', '__pycache__', 'Library', 'System']]
                    
                    for file in files:
                        try:
                            # Check file type filter
                            if ext_filter and not file.lower().endswith(ext_filter):
                                continue
                            
                            # Check filename pattern (case insensitive)
                            file_lower = file.lower() if not case_sensitive else file
                            
                            # Check if pattern matches anywhere in filename (with or without extension)
                            if (pattern_lower in file_lower or 
                                pattern_without_ext in file_lower or
                                filename_pattern.lower() in file_lower):
                                
                                full_path = os.path.join(root, file)
                                file_size = os.path.getsize(full_path)
                                mod_time = os.path.getmtime(full_path)
                                
                                # Determine file type
                                file_ext = os.path.splitext(file)[1].lower()
                                file_category = self._get_file_category(file_ext)
                                
                                results.append({
                                    'path': full_path,
                                    'filename': file,
                                    'size': file_size,
                                    'size_readable': self._format_size(file_size),
                                    'modified': datetime.fromtimestamp(mod_time).isoformat(),
                                    'modified_readable': datetime.fromtimestamp(mod_time).strftime('%Y-%m-%d %H:%M:%S'),
                                    'directory': root,
                                    'extension': file_ext,
                                    'category': file_category
                                })
                                files_found += 1
                                
                                if len(results) >= max_results:
                                    print(f"✅ Found {files_found} files (reached max results)")
                                    return results
                        except (PermissionError, OSError):
                            continue
                            
            except (PermissionError, OSError):
                continue
        
        print(f"✅ Found {files_found} files matching '{filename_pattern}'")
        
        # Store in last_search_results for selection
        self.last_search_results = {
            'pattern': filename_pattern,
            'results': results,
            'timestamp': datetime.now().isoformat()
        }
        
        return results
    
    def _get_file_category(self, extension):
        """Categorize file by extension"""
        extension = extension.lower()
        
        # Images
        if extension in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.ico', '.svg']:
            return 'image'
        
        # Documents
        if extension in ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt']:
            return 'document'
        
        # Spreadsheets
        if extension in ['.xls', '.xlsx', '.csv', '.ods', '.numbers']:
            return 'spreadsheet'
        
        # Presentations
        if extension in ['.ppt', '.pptx', '.key', '.odp']:
            return 'presentation'
        
        # Code files
        if extension in ['.py', '.js', '.html', '.css', '.java', '.cpp', '.c', '.php', '.rb', '.go', '.rs']:
            return 'code'
        
        # Archives
        if extension in ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2']:
            return 'archive'
        
        # Audio
        if extension in ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a']:
            return 'audio'
        
        # Video
        if extension in ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm']:
            return 'video'
        
        # Executables
        if extension in ['.exe', '.msi', '.app', '.deb', '.rpm', '.dmg']:
            return 'executable'
        
        return 'other'
    
    def search_files_async(self, filename_pattern, callback=None, search_paths=None, 
                          case_sensitive=False, file_types=None, max_results=1000):
        """Search files in background thread"""
        if self.is_searching:
            return {"error": "Search already in progress"}
        
        self.is_searching = True
        
        def search_thread_func():
            try:
                results = self.search_files(
                    filename_pattern, 
                    search_paths, 
                    case_sensitive, 
                    file_types,
                    max_results
                )
                
                # Store results with timestamp
                result_id = f"search_{int(time.time())}"
                self.search_results[result_id] = {
                    'pattern': filename_pattern,
                    'results': results,
                    'timestamp': datetime.now().isoformat(),
                    'count': len(results)
                }
                
                self.is_searching = False
                
                if callback:
                    callback({
                        'success': True,
                        'result_id': result_id,
                        'count': len(results),
                        'results': results[:10]  # First 10 for preview
                    })
                    
            except Exception as e:
                self.is_searching = False
                if callback:
                    callback({'success': False, 'error': str(e)})
        
        thread = threading.Thread(target=search_thread_func)
        thread.daemon = True
        thread.start()
        
        return {"status": "searching", "message": "Search started in background"}
    
    def quick_search(self, filename_pattern, max_results=20):
        """Quick search in common locations only (non-recursive but faster)"""
        results = []
        pattern_lower = filename_pattern.lower()
        pattern_without_ext = pattern_lower.split('.')[0] if '.' in pattern_lower else pattern_lower
        
        for search_path in self.common_dirs:
            if not os.path.exists(search_path):
                continue
            
            try:
                # Walk through directories but limit depth for speed
                for root, dirs, files in os.walk(search_path):
                    # Limit depth to 3 levels for quick search
                    depth = root.replace(search_path, '').count(os.sep)
                    if depth > 3:
                        dirs[:] = []  # Don't go deeper
                    
                    for file in files:
                        try:
                            file_lower = file.lower()
                            if (pattern_lower in file_lower or 
                                pattern_without_ext in file_lower or
                                filename_pattern.lower() in file_lower):
                                
                                full_path = os.path.join(root, file)
                                file_ext = os.path.splitext(file)[1].lower()
                                file_category = self._get_file_category(file_ext)
                                
                                results.append({
                                    'path': full_path,
                                    'filename': file,
                                    'size': os.path.getsize(full_path),
                                    'size_readable': self._format_size(os.path.getsize(full_path)),
                                    'modified': datetime.fromtimestamp(
                                        os.path.getmtime(full_path)
                                    ).isoformat(),
                                    'directory': root,
                                    'extension': file_ext,
                                    'category': file_category
                                })
                                if len(results) >= max_results:
                                    return results
                        except (PermissionError, OSError):
                            continue
            except (PermissionError, OSError):
                continue
        
        return results
    
    def find_file_and_open(self, filename_pattern):
        """Find a file and open it - main function for AI to use"""
        print(f"🔍 Looking for: {filename_pattern}")
        
        # Clean up the filename pattern
        filename_pattern = filename_pattern.strip().strip('"').strip("'")
        
        # First try quick search
        results = self.quick_search(filename_pattern, max_results=10)
        
        if not results:
            # If not found, do a full search
            results = self.search_files(filename_pattern, max_results=1000)
        
        if results:
            if len(results) == 1:
                # Only one file found, open it directly
                file_to_open = results[0]['path']
                return self.open_file(file_to_open)
            else:
                # Multiple files found, store in last_search_results
                self.last_search_results = {
                    'pattern': filename_pattern,
                    'results': results,
                    'timestamp': datetime.now().isoformat()
                }
                return {
                    "success": True,
                    "multiple": True,
                    "count": len(results),
                    "results": results,
                    "message": f"Found {len(results)} files matching '{filename_pattern}'. Please select one by number."
                }
        else:
            return {
                "success": False,
                "error": f"No files found matching '{filename_pattern}'"
            }
    
    def open_file_by_number(self, number):
        """Open a file by its number from the last search results"""
        if not self.last_search_results:
            return {"success": False, "error": "No recent search results found. Please search for files first."}
        
        results = self.last_search_results.get('results', [])
        
        try:
            index = int(number) - 1
            if 0 <= index < len(results):
                file_to_open = results[index]['path']
                return self.open_file(file_to_open)
            else:
                return {
                    "success": False, 
                    "error": f"Invalid number. Please select a number between 1 and {len(results)}"
                }
        except ValueError:
            return {"success": False, "error": "Please provide a valid number"}
    
    def open_file(self, file_path):
        """Open a file with default application - works for ALL file types"""
        try:
            if not os.path.exists(file_path):
                return {"success": False, "error": f"File not found: {file_path}"}
            
            print(f"📂 Opening: {file_path}")
            
            # Get file info for response
            file_size = os.path.getsize(file_path)
            file_ext = os.path.splitext(file_path)[1].lower()
            file_category = self._get_file_category(file_ext)
            filename = os.path.basename(file_path)
            
            if self.system == "Windows":
                os.startfile(file_path)
            elif self.system == "Darwin":  # macOS
                subprocess.run(["open", file_path], check=True)
            else:  # Linux
                subprocess.run(["xdg-open", file_path], check=True)
            
            # Success message based on file type
            category_emojis = {
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
            }
            
            emoji = category_emojis.get(file_category, '📁')
            
            return {
                "success": True, 
                "message": f"{emoji} Successfully opened: {filename}",
                "path": file_path,
                "filename": filename,
                "category": file_category,
                "size": self._format_size(file_size)
            }
        except Exception as e:
            error_msg = f"Failed to open file: {str(e)}"
            print(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}
    
    def open_application(self, app_name):
        """Open an application by name"""
        try:
            app_name = app_name.lower().strip()
            print(f"🚀 Opening application: {app_name}")
            
            # Check if it's a known app
            if app_name in self.app_paths:
                app_path = self.app_paths[app_name]
                
                # Check if path exists (for Windows/macOS)
                if os.path.exists(app_path) or app_path in ['notepad.exe', 'calc.exe', 'mspaint.exe']:
                    if self.system == "Windows":
                        if os.path.exists(app_path):
                            os.startfile(app_path)
                        else:
                            # Try running as command
                            subprocess.run([app_path], shell=True)
                    elif self.system == "Darwin":
                        subprocess.run(["open", "-a", app_path], check=True)
                    else:
                        subprocess.run([app_path], check=True)
                    
                    return {
                        "success": True,
                        "message": f"🚀 Opened application: {app_name}",
                        "app": app_name
                    }
            
            # If not found in predefined paths, try to find it
            if self.system == "Windows":
                # Try to find the app using where command
                try:
                    result = subprocess.run(["where", app_name], capture_output=True, text=True)
                    if result.returncode == 0:
                        app_path = result.stdout.strip().split('\n')[0]
                        os.startfile(app_path)
                        return {
                            "success": True,
                            "message": f"🚀 Opened application: {app_name}",
                            "app": app_name
                        }
                except:
                    pass
                
                # Try running directly
                try:
                    subprocess.run([app_name], shell=True)
                    return {
                        "success": True,
                        "message": f"🚀 Opened application: {app_name}",
                        "app": app_name
                    }
                except:
                    pass
                    
            elif self.system == "Darwin":
                # On macOS, try to open by bundle identifier or name
                try:
                    subprocess.run(["open", "-a", app_name], check=True)
                    return {
                        "success": True,
                        "message": f"🚀 Opened application: {app_name}",
                        "app": app_name
                    }
                except:
                    pass
            
            return {
                "success": False,
                "error": f"Could not find application: {app_name}"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def open_website(self, website_name, search_query=None):
        """Open a website, optionally with a search query"""
        try:
            website_name = website_name.lower().strip()
            print(f"🌐 Opening website: {website_name}")
            
            # Check if it's a known website
            if website_name in self.websites:
                url = self.websites[website_name]
                
                # If it's YouTube and there's a search query
                if website_name == 'youtube' and search_query:
                    search_encoded = urllib.parse.quote(search_query)
                    url = f"https://www.youtube.com/results?search_query={search_encoded}"
                elif website_name == 'google' and search_query:
                    search_encoded = urllib.parse.quote(search_query)
                    url = f"https://www.google.com/search?q={search_encoded}"
                elif website_name == 'gmail' and search_query:
                    search_encoded = urllib.parse.quote(search_query)
                    url = f"https://mail.google.com/mail/u/0/#search/{search_encoded}"
                elif website_name == 'github' and search_query:
                    search_encoded = urllib.parse.quote(search_query)
                    url = f"https://github.com/search?q={search_encoded}"
                
                webbrowser.open(url)
                
                response_msg = f"🌐 Opened {website_name}"
                if search_query:
                    response_msg += f" and searched for: {search_query}"
                
                return {
                    "success": True,
                    "message": response_msg,
                    "url": url,
                    "website": website_name
                }
            
            # If not a known website, treat as a custom URL
            if '.' in website_name:
                if not website_name.startswith(('http://', 'https://')):
                    url = 'https://' + website_name
                else:
                    url = website_name
                
                webbrowser.open(url)
                return {
                    "success": True,
                    "message": f"🌐 Opened website: {website_name}",
                    "url": url
                }
            
            # Try searching Google
            search_encoded = urllib.parse.quote(website_name)
            url = f"https://www.google.com/search?q={search_encoded}"
            webbrowser.open(url)
            
            return {
                "success": True,
                "message": f"🌐 Searched Google for: {website_name}",
                "url": url
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def open_youtube_video(self, search_query):
        """Open YouTube and search for videos"""
        try:
            print(f"🎬 Searching YouTube for: {search_query}")
            search_encoded = urllib.parse.quote(search_query)
            url = f"https://www.youtube.com/results?search_query={search_encoded}"
            webbrowser.open(url)
            
            return {
                "success": True,
                "message": f"🎬 Opened YouTube and searched for: {search_query}",
                "url": url,
                "search": search_query
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def open_youtube_history(self):
        """Open YouTube watch history"""
        try:
            url = "https://www.youtube.com/feed/history"
            webbrowser.open(url)
            
            return {
                "success": True,
                "message": "🎬 Opened your YouTube watch history",
                "url": url
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def open_youtube_trending(self):
        """Open YouTube trending page"""
        try:
            url = "https://www.youtube.com/feed/trending"
            webbrowser.open(url)
            
            return {
                "success": True,
                "message": "📈 Opened YouTube trending",
                "url": url
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def open_youtube_subscriptions(self):
        """Open YouTube subscriptions"""
        try:
            url = "https://www.youtube.com/feed/subscriptions"
            webbrowser.open(url)
            
            return {
                "success": True,
                "message": "📺 Opened your YouTube subscriptions",
                "url": url
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def open_vs_code(self, folder_path=None):
        """Open VS Code, optionally with a folder"""
        try:
            app_name = 'vscode'
            if app_name in self.app_paths:
                app_path = self.app_paths[app_name]
                
                if self.system == "Windows":
                    if folder_path and os.path.exists(folder_path):
                        subprocess.run([app_path, folder_path])
                    else:
                        os.startfile(app_path)
                elif self.system == "Darwin":
                    if folder_path and os.path.exists(folder_path):
                        subprocess.run(["open", "-a", app_path, folder_path])
                    else:
                        subprocess.run(["open", "-a", app_path])
                else:
                    if folder_path and os.path.exists(folder_path):
                        subprocess.run([app_path, folder_path])
                    else:
                        subprocess.run([app_path])
                
                msg = "🚀 Opened VS Code"
                if folder_path:
                    msg += f" with folder: {folder_path}"
                
                return {
                    "success": True,
                    "message": msg
                }
            
            return {"success": False, "error": "VS Code not found"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def open_file_location(self, file_path):
        """Open folder containing the file in file explorer"""
        try:
            if not os.path.exists(file_path):
                return {"success": False, "error": "File not found"}
            
            folder_path = os.path.dirname(file_path)
            print(f"📂 Opening folder: {folder_path}")
            
            if self.system == "Windows":
                subprocess.run(["explorer", folder_path], check=True)
            elif self.system == "Darwin":  # macOS
                subprocess.run(["open", folder_path], check=True)
            else:  # Linux
                subprocess.run(["xdg-open", folder_path], check=True)
            
            return {
                "success": True,
                "message": f"✅ Opened folder: {folder_path}",
                "folder": folder_path
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_file_info(self, file_path):
        """Get detailed file information"""
        try:
            if not os.path.exists(file_path):
                return {"success": False, "error": "File not found"}
            
            stat = os.stat(file_path)
            file_ext = os.path.splitext(file_path)[1].lower()
            file_category = self._get_file_category(file_ext)
            
            return {
                "success": True,
                "path": file_path,
                "filename": os.path.basename(file_path),
                "size": stat.st_size,
                "size_readable": self._format_size(stat.st_size),
                "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "created_readable": datetime.fromtimestamp(stat.st_ctime).strftime('%Y-%m-%d %H:%M:%S'),
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "modified_readable": datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S'),
                "extension": file_ext,
                "category": file_category,
                "directory": os.path.dirname(file_path)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _format_size(self, size_bytes):
        """Format file size in human readable format"""
        if size_bytes == 0:
            return "0 B"
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} TB"
    
    def find_recent_files(self, hours=24, search_paths=None, max_results=50):
        """Find recently modified files"""
        results = []
        cutoff_time = time.time() - (hours * 3600)
        
        if search_paths is None:
            search_paths = self.common_dirs[:3]  # Only search a few dirs for recent files
        
        for search_path in search_paths:
            if not os.path.exists(search_path):
                continue
            
            try:
                for root, dirs, files in os.walk(search_path):
                    dirs[:] = [d for d in dirs if not d.startswith('.')]
                    
                    for file in files:
                        try:
                            full_path = os.path.join(root, file)
                            mtime = os.path.getmtime(full_path)
                            if mtime > cutoff_time:
                                file_ext = os.path.splitext(file)[1].lower()
                                file_category = self._get_file_category(file_ext)
                                
                                results.append({
                                    'path': full_path,
                                    'filename': file,
                                    'modified': datetime.fromtimestamp(mtime).isoformat(),
                                    'modified_readable': datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S'),
                                    'size': os.path.getsize(full_path),
                                    'size_readable': self._format_size(os.path.getsize(full_path)),
                                    'category': file_category,
                                    'extension': file_ext
                                })
                                if len(results) >= max_results:
                                    return results
                        except (PermissionError, OSError):
                            continue
            except (PermissionError, OSError):
                continue
        
        return results
    
    def search_by_content(self, text_pattern, search_paths=None, file_types=None):
        """
        Search for files containing specific text content
        Limited to text files for performance
        """
        results = []
        
        if search_paths is None:
            search_paths = self.common_dirs[:2]  # Only search a couple dirs for content search
        
        # Text file extensions
        text_extensions = ['.txt', '.py', '.js', '.html', '.css', '.json', '.md', 
                          '.xml', '.yaml', '.yml', '.ini', '.cfg', '.conf', '.log', '.csv']
        
        if file_types:
            text_extensions = [ext if ext.startswith('.') else f'.{ext}' for ext in file_types]
        
        pattern = text_pattern.lower()
        print(f"🔍 Searching content for: '{text_pattern}'")
        
        for search_path in search_paths:
            if not os.path.exists(search_path):
                continue
            
            try:
                for root, dirs, files in os.walk(search_path):
                    dirs[:] = [d for d in dirs if not d.startswith('.')]
                    
                    for file in files:
                        if not any(file.lower().endswith(ext) for ext in text_extensions):
                            continue
                        
                        try:
                            full_path = os.path.join(root, file)
                            
                            # Only read first few KB for performance
                            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                                content = f.read(10240)  # Read first 10KB
                                if pattern in content.lower():
                                    file_ext = os.path.splitext(file)[1].lower()
                                    file_category = self._get_file_category(file_ext)
                                    
                                    results.append({
                                        'path': full_path,
                                        'filename': file,
                                        'match': 'content match',
                                        'directory': root,
                                        'category': file_category,
                                        'extension': file_ext
                                    })
                                    if len(results) >= 20:
                                        return results
                        except (PermissionError, OSError, UnicodeDecodeError):
                            continue
            except (PermissionError, OSError):
                continue
        
        return results
    
    def get_search_result(self, result_id):
        """Get stored search results by ID"""
        if result_id in self.search_results:
            return self.search_results[result_id]
        return None
    
    def clear_old_results(self, hours=1):
        """Clear search results older than specified hours"""
        cutoff = datetime.now() - timedelta(hours=hours)
        to_delete = []
        
        for result_id, data in self.search_results.items():
            if 'timestamp' in data:
                result_time = datetime.fromisoformat(data['timestamp'])
                if result_time < cutoff:
                    to_delete.append(result_id)
        
        for result_id in to_delete:
            del self.search_results[result_id]
        
        return len(to_delete)


# Global instance
file_automation = FileAutomation()