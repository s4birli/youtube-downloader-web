#!/usr/bin/env python3
import sys
import os
import logging
import requests
import uuid
import shutil
import threading
import time
from typing import Dict, Any
from flask import Flask, request, jsonify, make_response, Response, send_file
from flask_cors import CORS
import yt_dlp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, 
     resources={r"/*": {"origins": "*"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Create downloads directory if it doesn't exist
DOWNLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "downloads")
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

@app.after_request
def add_cors_headers(response):
    # Allow requests from any origin
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    if request.method == 'OPTIONS':
        return response
    return response

# -----------------------------------------------------------
# CLASS OR HELPER FUNCTIONS
# -----------------------------------------------------------
class VideoDownloader:
    """
    Handles YouTube video information retrieval and downloading operations
    using yt_dlp.
    """
    def __init__(self) -> None:
        self.ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'no_color': True
        }

    def get_video_info(self, url: str) -> Dict[str, Any]:
        """
        Get video information and available qualities using yt_dlp.

        Args:
            url: YouTube video URL

        Returns:
            Dictionary with video info and available formats
        """
        if not url.startswith(('http://www.youtube.com', 'https://www.youtube.com', 
                               'http://youtu.be', 'https://youtu.be')):
            return {"success": False, "error": "Invalid YouTube URL. Please enter a valid URL."}

        try:
            logger.info("Getting video information using yt_dlp...")
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                # Log all available formats for debugging
                logger.info(f"Available formats: {len(info['formats'])}")
                for f in info['formats']:
                    if f.get('ext') == 'mp4' and f.get('filesize'):
                        logger.info(f"Format: {f.get('format_id')} - {f.get('height')}p - "
                                    f"{f.get('filesize')/1024/1024:.1f}MB - "
                                    f"vcodec: {f.get('vcodec')} - acodec: {f.get('acodec')}")

                # Priority: MP4 + h264 + aac
                formats = []

                # 1) Look for h264 video codec and aac audio codec
                h264_formats = []
                for f in info['formats']:
                    if (
                        f.get('ext') == 'mp4' and 
                        f.get('filesize') and
                        f.get('format_id') and
                        f.get('vcodec', '').startswith('avc') and
                        (f.get('acodec', '') == 'aac' or f.get('acodec', '') == 'mp4a')
                    ):
                        h264_formats.append({
                            "format_id": f.get('format_id'),
                            "height": f.get('height', 'N/A'),
                            "filesize": f.get('filesize', 0),
                            "ext": f.get('ext', 'mp4'),
                            "vcodec": f.get('vcodec', 'unknown'),
                            "acodec": f.get('acodec', 'unknown'),
                            "format_note": f.get('format_note', ''),
                            "is_compatible": True
                        })
                
                # 2) If we found any h264+aac, great. Otherwise, fallback to any mp4
                if h264_formats:
                    formats = h264_formats
                else:
                    # Fallback: any mp4 with filesize
                    fallback_mp4 = []
                    for f in info['formats']:
                        if (
                            f.get('ext') == 'mp4' and 
                            f.get('filesize') and
                            f.get('format_id')
                        ):
                            fallback_mp4.append({
                                "format_id": f.get('format_id'),
                                "height": f.get('height', 'N/A'),
                                "filesize": f.get('filesize', 0),
                                "ext": f.get('ext', 'mp4'),
                                "vcodec": f.get('vcodec', 'unknown'),
                                "acodec": f.get('acodec', 'unknown'),
                                "format_note": f.get('format_note', ''),
                                "is_compatible": False
                            })
                    formats = fallback_mp4

                # Sort by filesize (largest first)
                formats = sorted(formats, key=lambda x: x.get('filesize', 0), reverse=True)

                if not formats:
                    return {"success": False, "error": "No suitable video format found."}

                # Convert to the final "format_choices" structure
                format_choices = []
                for i, f in enumerate(formats[:5], 1):
                    size_mb = f.get('filesize', 0) / (1024 * 1024)
                    codec_info = "H.264/AAC" if f.get('is_compatible', False) else f"{f.get('vcodec', 'unknown')}/{f.get('acodec', 'unknown')}"
                    format_choices.append({
                        "id": f.get('format_id'),
                        "height": f.get('height', 'N/A'),
                        "size_mb": round(size_mb, 1),
                        "compatibility": "Mac Compatible" if f.get('is_compatible', False) else "Standard",
                        "codec_info": codec_info
                    })

                # Format the duration from seconds to MM:SS or HH:MM:SS
                duration_seconds = info.get('duration', 0)
                if duration_seconds:
                    minutes, seconds = divmod(duration_seconds, 60)
                    hours, minutes = divmod(minutes, 60)
                    
                    if hours > 0:
                        formatted_duration = f"{int(hours):02d}:{int(minutes):02d}:{int(seconds):02d}"
                    else:
                        formatted_duration = f"{int(minutes):02d}:{int(seconds):02d}"
                else:
                    formatted_duration = "00:00"

                return {
                    "success": True,
                    "title": info['title'],
                    "thumbnail": info.get('thumbnail'),
                    "duration": formatted_duration,  # Now returns formatted time string
                    "formats": format_choices
                }
        except yt_dlp.utils.DownloadError as e:
            logger.error(f"Could not get video information: {str(e)}")
            return {"success": False, "error": f"Could not get video information: {str(e)}"}
        except Exception as e:
            logger.error(f"An unexpected error occurred: {str(e)}")
            return {"success": False, "error": f"An unexpected error occurred: {str(e)}"}

    def download_video(self, url: str, format_id: str = None, is_audio: bool = False) -> Dict[str, Any]:
        """
        Download a video or audio file to the server.
        
        Args:
            url: YouTube URL
            format_id: Format ID for video downloads
            is_audio: Whether to download audio only
            
        Returns:
            Dictionary with download result info
        """
        try:
            # Create a unique directory for this download
            download_id = str(uuid.uuid4())
            download_path = os.path.join(DOWNLOAD_DIR, download_id)
            os.makedirs(download_path, exist_ok=True)
            
            if is_audio:
                # Audio download options
                ydl_opts = {
                    'format': 'bestaudio/best',
                    'postprocessors': [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': 'mp3',
                        'preferredquality': '192',
                    }],
                    'outtmpl': os.path.join(download_path, '%(title)s.%(ext)s'),
                    'quiet': True,
                    'no_warnings': True
                }
            else:
                # Video download options with specific format
                # Using format_id+bestaudio to ensure we get audio with video
                # The format string means:
                # 1. Try to get the specified format_id with audio
                # 2. If that's not available, get the video format and merge with best audio
                ydl_opts = {
                    'format': f'{format_id}+bestaudio/best',
                    'merge_output_format': 'mp4',  # Ensure output is mp4
                    'outtmpl': os.path.join(download_path, '%(title)s.%(ext)s'),
                    'quiet': True,
                    'no_warnings': True
                }
            
            logger.info(f"Starting download with options: {ydl_opts}")
            
            # Download the file
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                
            # Get the downloaded file path
            downloaded_files = os.listdir(download_path)
            if not downloaded_files:
                raise Exception("Download completed but no file found")
                
            file_path = os.path.join(download_path, downloaded_files[0])
            file_name = downloaded_files[0]
            
            # Get file extension
            file_ext = os.path.splitext(file_name)[1].lower()
            if is_audio and file_ext != '.mp3':
                # Rename to .mp3 if not already
                new_file_name = os.path.splitext(file_name)[0] + '.mp3'
                new_file_path = os.path.join(download_path, new_file_name)
                os.rename(file_path, new_file_path)
                file_path = new_file_path
                file_name = new_file_name
            elif not is_audio and file_ext != '.mp4':
                # Rename to .mp4 if not already
                new_file_name = os.path.splitext(file_name)[0] + '.mp4'
                new_file_path = os.path.join(download_path, new_file_name)
                os.rename(file_path, new_file_path)
                file_path = new_file_path
                file_name = new_file_name
            
            logger.info(f"Download completed: {file_path}")
            
            return {
                "success": True,
                "download_id": download_id,
                "file_name": file_name,
                "title": info.get('title', 'Unknown')
            }
            
        except Exception as e:
            logger.error(f"Download error: {str(e)}")
            return {"success": False, "error": str(e)}

# -----------------------------------------------------------
# ROUTES
# -----------------------------------------------------------

@app.route('/api/info', methods=['POST', 'OPTIONS'])
def get_info_endpoint():
    if request.method == 'OPTIONS':
        return make_response('', 200)
    
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({"success": False, "error": "URL is required"}), 400
    
    downloader = VideoDownloader()
    info_result = downloader.get_video_info(url)
    
    if info_result.get("success"):
        return jsonify(info_result)
    else:
        return jsonify(info_result), 400

@app.route('/api/download', methods=['POST', 'OPTIONS'])
def download_video_endpoint():
    if request.method == 'OPTIONS':
        return make_response('', 200)
    
    data = request.get_json()
    url = data.get('url')
    is_audio = data.get('isAudio', False)
    
    logger.info(f"Download request received - URL: {url}, Audio: {is_audio}")
    
    if not url:
        return jsonify({"success": False, "error": "URL is required"}), 400
    
    # If we're downloading video, ensure format_id is provided
    if not is_audio and not data.get('format_id'):
        return jsonify({"success": False, "error": "format_id is required for video downloads"}), 400
    
    try:
        downloader = VideoDownloader()
        format_id = data.get('format_id') if not is_audio else None
        
        # Download the file to server
        download_result = downloader.download_video(url, format_id, is_audio)
        
        if not download_result.get("success"):
            return jsonify(download_result), 400
        
        # Construct full download URL including server domain/port
        # This ensures frontend gets complete URL rather than relative path
        file_name = download_result.get("file_name")
        download_id = download_result.get("download_id")
        
        # Use request.host_url to get the base URL including protocol, domain and port
        base_url = request.host_url.rstrip('/')
        download_url = f"{base_url}/api/file/{download_id}/{file_name}"
        
        # Return download info - frontend will use this info to request the file
        return jsonify({
            "success": True,
            "download_id": download_id,
            "file_name": file_name,
            "title": download_result.get("title"),
            "download_url": download_url
        })
    
    except Exception as e:
        logger.error(f"Error in download endpoint: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/file/<download_id>/<file_name>', methods=['GET'])
def serve_file(download_id, file_name):
    """Serve the downloaded file to the user"""
    try:
        file_path = os.path.join(DOWNLOAD_DIR, download_id, file_name)
        print(file_path)
        
        if not os.path.exists(file_path):
            return jsonify({"success": False, "error": "File not found"}), 404
        
        # Use Flask's built-in send_file function which has proven reliability
        # Setting as_attachment=True to force the browser to download rather than play
        response = send_file(
            file_path,
            as_attachment=True,
            download_name=file_name,
            conditional=True  # Enables partial content support
        )
        
        # Add content disposition for better browser compatibility
        response.headers["Content-Disposition"] = f'attachment; filename="{file_name}"'
        
        # Schedule cleanup after download completes
        @response.call_on_close
        def cleanup_file():
            try:
                # Give a small delay to ensure file is fully sent
                # This helps with some browser implementations
                import threading
                
                def delayed_cleanup():
                    import time
                    time.sleep(2)  # 2 second delay before cleanup
                    download_dir = os.path.join(DOWNLOAD_DIR, download_id)
                    if os.path.exists(download_dir):
                        shutil.rmtree(download_dir)
                        logger.info(f"Cleaned up download directory: {download_dir}")
                
                # Run cleanup in background thread
                cleanup_thread = threading.Thread(target=delayed_cleanup)
                cleanup_thread.daemon = True
                cleanup_thread.start()
                
            except Exception as e:
                logger.error(f"Error scheduling cleanup: {e}")
        
        return response
        
    except Exception as e:
        logger.error(f"Error serving file: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# Cleanup route to periodically remove old files
@app.route('/api/cleanup', methods=['POST'])
def cleanup():
    """Admin endpoint to clean up old downloads"""
    try:
        count = 0
        for download_id in os.listdir(DOWNLOAD_DIR):
            download_path = os.path.join(DOWNLOAD_DIR, download_id)
            if os.path.isdir(download_path):
                shutil.rmtree(download_path)
                count += 1
        
        return jsonify({"success": True, "message": f"Cleaned up {count} download directories"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# -----------------------------------------------------------
# RUN THE APP
# -----------------------------------------------------------
if __name__ == '__main__':
    print("Starting YouTube Downloader API on http://localhost:5002")
    app.run(host='0.0.0.0', port=5002, debug=False)