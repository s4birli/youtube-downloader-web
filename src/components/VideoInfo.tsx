import React from 'react';
import { FaDownload } from 'react-icons/fa';
import { VideoInfoProps } from '../types';

const VideoInfo: React.FC<VideoInfoProps> = ({
    videoInfo,
    downloadType,
    setDownloadType,
    selectedQuality,
    setSelectedQuality,
    downloading,
    handleDownload,
    downloadProgress
}) => {
    return (
        <div className="max-w-2xl mx-auto bg-[#1F1F1F] p-6 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="md:w-1/2">
                    <img
                        src={videoInfo.thumbnail}
                        alt={videoInfo.title}
                        className="w-full h-auto rounded-lg"
                    />
                </div>
                <div className="md:w-1/2">
                    <h2 className="text-xl font-bold mb-2">{videoInfo.title}</h2>
                    <p className="text-gray-400 mb-4">Duration: {videoInfo.duration}</p>

                    <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Download Type</p>
                        <div className="flex gap-2">
                            <button
                                className={`px-4 py-2 rounded-md ${downloadType === 'video' ? 'bg-[#FF0000] text-white' : 'bg-gray-700 text-gray-300'}`}
                                onClick={() => setDownloadType('video')}
                            >
                                Video
                            </button>
                            <button
                                className={`px-4 py-2 rounded-md ${downloadType === 'audio' ? 'bg-[#FF0000] text-white' : 'bg-gray-700 text-gray-300'}`}
                                onClick={() => setDownloadType('audio')}
                            >
                                Audio Only
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="quality" className="block text-sm font-medium mb-2">
                            Quality
                        </label>
                        <select
                            id="quality"
                            value={selectedQuality}
                            onChange={(e) => setSelectedQuality(e.target.value)}
                            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                        >
                            <option value="">Select Quality</option>
                            {videoInfo.qualities.map((quality) => (
                                <option key={quality} value={quality}>
                                    {quality}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {downloading && (
                <div className="mb-4">
                    <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
                        <div
                            className="bg-[#FF0000] h-4 rounded-full"
                            style={{ width: `${downloadProgress}%` }}
                        ></div>
                    </div>
                    <p className="text-center text-sm">{downloadProgress}% Downloaded</p>
                </div>
            )}

            <div className="flex justify-center">
                <button
                    onClick={handleDownload}
                    disabled={!selectedQuality || downloading}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#FF0000] rounded-lg font-semibold hover:bg-[#CC0000] transition-colors disabled:opacity-50 disabled:bg-gray-700 w-full md:w-auto"
                >
                    {downloading ? (
                        <>
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                            Downloading...
                        </>
                    ) : (
                        <>
                            <FaDownload />
                            Download {downloadType === 'video' ? 'Video' : 'Audio'}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default VideoInfo;