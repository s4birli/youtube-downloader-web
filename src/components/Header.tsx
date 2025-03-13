import React from 'react';
import { FaYoutube } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

const Header: React.FC = () => {
    return (
        <header className="bg-[#282828] border-b border-[#484848]">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo and Title */}
                    <div className="flex items-center">
                        <FaYoutube className="text-[#FF0000] text-4xl mr-2" />
                        <h1 className="text-2xl font-bold text-white">YouTube Downloader</h1>
                    </div>

                    {/* Sponsor Buttons */}
                    <div className="flex items-center gap-2">
                        <a
                            href="https://www.buymeacoffee.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#FFDD00] text-black rounded-lg text-sm font-semibold hover:bg-[#FFED4A] transition-colors"
                        >
                            <img
                                src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
                                alt="Buy me a coffee"
                                className="h-3"
                            />
                            <span>Buy me a coffee</span>
                        </a>

                        <a
                            href="https://ko-fi.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#13C3FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00B9FF] transition-colors"
                        >
                            <img
                                src="https://storage.ko-fi.com/cdn/cup-border.png"
                                alt="Ko-fi"
                                className="h-3"
                            />
                            <span>Support on Ko-fi</span>
                        </a>

                        <a
                            href="https://github.com/sponsors"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#2A3039] text-white rounded-lg text-sm font-semibold hover:bg-[#383F4A] transition-colors"
                        >
                            <FontAwesomeIcon icon={faGithub} className="text-base" />
                            <span>Sponsor</span>
                        </a>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;