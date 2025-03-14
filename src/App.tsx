import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import VideoForm from './components/VideoForm';
import VideoInfo from './components/VideoInfo';
import { VideoInfoType } from './types';

// Backend API URL (Flask server)
const API_BASE_URL = 'http://localhost:5002';

// Configure axios defaults
axios.defaults.withCredentials = false; // Don't send cookies
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// Create an axios instance with CORS configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false
});

function App() {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfoType | null>(null);
  const [downloadType, setDownloadType] = useState<string>('video');
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [serverStatus, setServerStatus] = useState<string>('checking');

  // Check if the server is running
  useEffect(() => {
    const checkServer = async () => {
      try {
        // Try to make a simple request to the server
        await api.post('/api/info', { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
        setServerStatus('connected');
      } catch (err: any) {
        console.error('Server connection error:', err);
        if (err.code === 'ERR_NETWORK') {
          setServerStatus('disconnected');
        } else {
          // If we get a different error, the server is at least responding
          setServerStatus('connected');
        }
      }
    };

    checkServer();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    setError('');
    setVideoInfo(null);

    try {
      const response = await api.post('/api/info', { url });
      if (response.data.success) {
        // Store the original format objects to use for download
        const formatOptions = response.data.formats.map((format: any) => ({
          id: format.id,
          label: `${format.height}p (${format.size_mb} MB)`
        }));

        setVideoInfo({
          title: response.data.title,
          duration: response.data.duration ? response.data.duration.toString() : "0:00",
          qualities: formatOptions,
          thumbnail: response.data.thumbnail
        });

        // Set default quality to highest available
        if (formatOptions.length > 0) {
          setSelectedQuality(formatOptions[0].id);
        }
      } else {
        setError(response.data.error);
      }
    } catch (err: any) {
      console.error('API error:', err);
      setError('Could not get video information: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('URL is required');
      return;
    }

    if (downloadType === 'video' && !selectedQuality) {
      setError('Please select a quality for video download');
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);

    try {
      const requestData = downloadType === 'audio'
        ? { url, isAudio: true }
        : { url, format_id: selectedQuality, isAudio: false };

      const response = await api.post('/api/download', requestData, {
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            // Update progress status
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setDownloadProgress(percentCompleted);
          }
        },
        responseType: 'blob' // Get downloaded file as blob
      });

      // Download completed, save file for user
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Get filename from response header or use default name
      const contentDisposition = response.headers['content-disposition'];
      let filename = downloadType === 'video' ? 'video.mp4' : 'audio.mp3';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setDownloading(false);
    } catch (err: any) {
      console.error('Download error:', err);
      setError('Download failed: ' + (err.response?.data?.error || err.message));
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#282828] text-white">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {serverStatus === 'disconnected' && (
          <div className="max-w-2xl mx-auto bg-yellow-600 text-white p-3 rounded-md mb-4">
            Cannot connect to the server. Please make sure the Python backend is running.
          </div>
        )}

        <VideoForm
          url={url}
          setUrl={setUrl}
          loading={loading}
          handleSubmit={handleSubmit}
        />

        {error && (
          <div className="max-w-2xl mx-auto bg-red-500 text-white p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF0000] border-t-transparent"></div>
          </div>
        )}

        {videoInfo && !loading && (
          <VideoInfo
            videoInfo={videoInfo}
            downloadType={downloadType}
            setDownloadType={setDownloadType}
            selectedQuality={selectedQuality}
            setSelectedQuality={setSelectedQuality}
            downloading={downloading}
            handleDownload={handleDownload}
            downloadProgress={downloadProgress}
          />
        )}
      </div>
    </div>
  );
}

export default App;