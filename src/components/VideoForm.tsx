import React from 'react';
import { FaSearch } from 'react-icons/fa';
import { VideoFormProps } from '../types';

const VideoForm: React.FC<VideoFormProps> = ({ url, setUrl, loading, handleSubmit }) => {
    return (
        <div className="max-w-2xl mx-auto bg-[#1F1F1F] p-6 rounded-lg shadow-lg mb-8">
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="url" className="block text-sm font-medium mb-2">
                        YouTube Video URL
                    </label>
                    <div className="flex">
                        <input
                            type="text"
                            id="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="flex-grow px-4 py-2 rounded-l-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                            placeholder="https://www.youtube.com/watch?v=..."
                            disabled={loading}
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#FF0000] hover:bg-[#CC0000] px-4 py-2 rounded-r-md flex items-center justify-center transition-colors disabled:bg-gray-500"
                        >
                            <FaSearch className="mr-2" />
                            Get Info
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default VideoForm;