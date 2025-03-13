import React, { useState } from 'react';
import axios from 'axios';
import Header from './components/Header';
import VideoForm from './components/VideoForm';
import VideoInfo from './components/VideoInfo';
import { VideoInfoType } from './types';

// Backend API URL (Flask server)
const API_BASE_URL = 'http://localhost:5000';

function App() {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfoType | null>(null);
  const [downloadType, setDownloadType] = useState<string>('video');
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

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
      const response = await axios.post(`${API_BASE_URL}/api/info`, { url });
      if (response.data.success) {
        setVideoInfo({
          title: response.data.title,
          duration: response.data.duration ? response.data.duration.toString() : "0:00",
          qualities: response.data.formats.map((format: any) => format.height + 'p'),
          thumbnail: response.data.thumbnail
        });

        // Set default quality to highest available
        if (response.data.formats.length > 0) {
          setSelectedQuality(response.data.formats[0].id);
        }
      } else {
        setError(response.data.error);
      }
    } catch (err: any) {
      setError('Could not get video information: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!url.trim() || !selectedQuality) {
      setError('URL and quality selection are required');
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/download`, {
        url: url,
        format_id: selectedQuality
      }, {
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
      let filename = 'video.mp4';

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
      setError('Download failed: ' + (err.response?.data?.error || err.message));
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#282828] text-white">
      <Header />

      <div className="container mx-auto px-4 py-8">
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