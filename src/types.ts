export interface VideoInfoType {
    title: string;
    duration: string;
    qualities: string[];
    thumbnail: string;
}

export interface VideoFormProps {
    url: string;
    setUrl: (url: string) => void;
    loading: boolean;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export interface VideoInfoProps {
    videoInfo: VideoInfoType;
    downloadType: string;
    setDownloadType: (type: string) => void;
    selectedQuality: string;
    setSelectedQuality: (quality: string) => void;
    downloading: boolean;
    handleDownload: () => void;
    downloadProgress: number;
} 