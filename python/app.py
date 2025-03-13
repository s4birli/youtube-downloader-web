#!/usr/bin/env python3
import os
import sys
import logging
import tempfile
import json
from typing import Dict, List, Optional, Any
from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import yt_dlp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("youtube_downloader.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Configure CORS more explicitly
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})

# Application directory
APP_PATH = os.path.dirname(os.path.abspath(__file__))
DOWNLOADS_FOLDER = os.path.join(APP_PATH, "downloads")
os.makedirs(DOWNLOADS_FOLDER, exist_ok=True)

class VideoDownloader:
    """Handles YouTube video downloading operations."""
    
    def __init__(self) -> None:
        """Initialize the VideoDownloader with default configuration."""
        self.ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'progress_hooks': [self._progress_hook],
            'outtmpl': os.path.join(DOWNLOADS_FOLDER, '%(title)s.%(ext)s'),
            'quiet': True,
            'no_warnings': True
        }
        self.progress_percentage = 0
        self.status_message = ""

    def _progress_hook(self, d: Dict[str, Any]) -> None:
        """
        Handle download progress updates.
        
        Args:
            d: Dictionary containing download information
        """
        if d['status'] == 'downloading':
            percent_str = d.get('_percent_str', '0%').strip()
            self.progress_percentage = float(percent_str.replace('%', ''))
            self.status_message = "downloading"
        elif d['status'] == 'finished':
            self.status_message = "processing"
            self.progress_percentage = 100

    @staticmethod
    def _clean_filename(title: str, max_length: int = 20) -> str:
        """
        Clean filename by removing invalid characters and limiting length.
        
        Args:
            title: Original filename
            max_length: Maximum length for the filename
            
        Returns:
            Cleaned filename
        """
        invalid_chars = '<>:"/\\|?*'
        clean_title = ''.join(char for char in title if char not in invalid_chars)
        return clean_title[:max_length].strip()

    def _get_video_formats(self, info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Get available video formats sorted by quality.
        
        Args:
            info: Video information dictionary
            
        Returns:
            List of available video formats
        """
        formats = [f for f in info['formats'] 
                  if f.get('ext') == 'mp4' and f.get('filesize')]
        return sorted(formats, key=lambda x: x.get('filesize', 0), reverse=True)

    def get_video_info(self, url: str) -> dict:
        """
        Get video information and available qualities.
        
        Args:
            url: YouTube video URL
            
        Returns:
            Dictionary with video info and available formats
        """
        if not url.startswith(('http://www.youtube.com', 'https://www.youtube.com', 
                               'http://youtu.be', 'https://youtu.be')):
            return {"success": False, "error": "Invalid YouTube URL. Please enter a valid URL."}

        try:
            logger.info("Getting video information...")
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                formats = self._get_video_formats(info)
                
                if not formats:
                    return {"success": False, "error": "No suitable video format found."}
                
                format_choices = []
                for i, f in enumerate(formats[:5], 1):
                    size_mb = f.get('filesize', 0) / (1024 * 1024)
                    format_choices.append({
                        "id": f.get('format_id'),
                        "height": f.get('height', 'N/A'),
                        "size_mb": round(size_mb, 1)
                    })
                
                return {
                    "success": True,
                    "title": info['title'],
                    "thumbnail": info.get('thumbnail'),
                    "duration": info.get('duration'),
                    "formats": format_choices
                }
        except yt_dlp.utils.DownloadError as e:
            logger.error(f"Could not get video information: {str(e)}")
            return {"success": False, "error": f"Could not get video information: {str(e)}"}
        except Exception as e:
            logger.error(f"An unexpected error occurred: {str(e)}")
            return {"success": False, "error": f"An unexpected error occurred: {str(e)}"}

    def download_video(self, url: str, format_id: str) -> Dict[str, Any]:
        """
        Download a YouTube video with the specified format.
        
        Args:
            url: YouTube video URL
            format_id: Selected format ID
            
        Returns:
            Dictionary with download status and file path
        """
        try:
            self.ydl_opts['format'] = f"{format_id}+bestaudio[ext=m4a]"
            
            logger.info("Starting download...")
            
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                filename = ydl.prepare_filename(info)
                
                return {
                    "success": True, 
                    "message": "Download completed successfully!",
                    "file_path": filename
                }
                
        except Exception as e:
            logger.error(f"Error during download: {str(e)}")
            return {"success": False, "error": f"Error during download: {str(e)}"}

# API endpoints
@app.route('/api/info', methods=['POST', 'OPTIONS'])
def get_video_info():
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'status': 'ok'})
        return response
        
    data = request.json
    url = data.get('url')
    
    if not url:
        return jsonify({"success": False, "error": "URL is required"}), 400
    
    downloader = VideoDownloader()
    info = downloader.get_video_info(url)
    
    if info["success"]:
        return jsonify(info)
    else:
        return jsonify(info), 400

@app.route('/api/download', methods=['POST', 'OPTIONS'])
def download_video():
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'status': 'ok'})
        return response
        
    data = request.json
    url = data.get('url')
    format_id = data.get('format_id')
    
    if not url or not format_id:
        return jsonify({"success": False, "error": "URL and format_id are required"}), 400
    
    downloader = VideoDownloader()
    result = downloader.download_video(url, format_id)
    
    if result["success"]:
        # Serve the file to the user
        try:
            return send_file(
                result["file_path"], 
                as_attachment=True,
                download_name=os.path.basename(result["file_path"])
            )
        except Exception as e:
            return jsonify({"success": False, "error": f"Could not send file: {str(e)}"}), 500
    else:
        return jsonify(result), 400

if __name__ == '__main__':
    print(f"YouTube Downloader API running: http://localhost:5000")
    # Add no-browser flag to prevent appearing as an icon on Windows
    app.run(host='127.0.0.1', port=5000, debug=False)