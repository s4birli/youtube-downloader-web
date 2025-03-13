import React, { useState } from 'react';
import Header from './components/Header';
import VideoForm from './components/VideoForm';
import VideoInfo from './components/VideoInfo';
import { VideoInfoType } from './types';

function App() {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfoType | null>(null);
  const [downloadType, setDownloadType] = useState<string>('video');
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [downloading, setDownloading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setVideoInfo({
        title: "Sample Video Title",
        duration: "10:30",
        qualities: ["1080p", "720p", "480p"],
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg" // Sample thumbnail
      });
      setLoading(false);
    }, 2000);
  };

  const handleDownload = () => {
    setDownloading(true);
    // Simulate download
    setTimeout(() => {
      setDownloading(false);
    }, 3000);
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
          />
        )}
      </div>
    </div>
  );
}

export default App;