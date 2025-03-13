# YouTube Video Downloader

A desktop application built with Electron, Python, and React that allows users to download YouTube videos in various formats and qualities.

## Features

- Download YouTube videos in different quality options
- Download audio-only versions of videos
- Simple and intuitive user interface
- Cross-platform (Windows, macOS, Linux)

## Technology Stack

- **Frontend**: React with TypeScript and Tailwind CSS
- **Backend**: Python with Flask API
- **Desktop Application**: Electron

## Prerequisites

- Node.js (v14+)
- Python (v3.7+)
- npm or yarn

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/youtube-downloader-web.git
   cd youtube-downloader-web
   ```

2. Install Node.js dependencies:
   ```
   npm install
   ```

3. Install Python dependencies:
   ```
   pip install -r python/requirements.txt
   ```

## Development

1. Start the React development server:
   ```
   npm run react-start
   ```

2. In a separate terminal, start the Electron application:
   ```
   npm start
   ```

## Building for Production

To build the application for production:

```
npm run build
```

This will create distributable packages in the `dist` directory for your current platform.

## Legal Disclaimer

This application is intended for educational purposes and personal use only. Downloading copyrighted material without permission may be against the law in your country. Users are responsible for complying with applicable laws and YouTube's terms of service.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
