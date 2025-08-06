"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface VideoPlayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoSrc: string;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ isOpen, onClose, videoSrc }) => {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-auto p-0 bg-black border-0 rounded-lg overflow-hidden">
                <DialogHeader>
                  <DialogTitle className="sr-only">Reproductor de Video</DialogTitle>
                </DialogHeader>
                <video width="100%" height="auto" controls autoPlay>
                    <source src={videoSrc} type="video/mp4" />
                    Tu navegador no soporta la etiqueta de vídeo.
                </video>
            </DialogContent>
        </Dialog>
    );
};

export default VideoPlayerModal;
