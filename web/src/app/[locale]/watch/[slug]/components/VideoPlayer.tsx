'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MovieDetail } from '@/services/movie.service';

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

interface VideoPlayerProps {
    movie: MovieDetail;
}

export default function VideoPlayer({ movie }: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const ytPlayerRef = useRef<any>(null);
    const ytIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const isYouTube = movie.trailerUrl?.includes('youtube.com/embed') ?? false;
    const videoId = isYouTube
        ? movie.trailerUrl!.split('/embed/')[1]?.split('?')[0]
        : null;
    const hasVideo = movie.trailerUrl || movie.videoUrl;

    // ─── YouTube IFrame API ────────────────────────────
    useEffect(() => {
        if (!isYouTube || !videoId) return;

        const createPlayer = () => {
            const checkAndCreate = () => {
                const el = document.getElementById('yt-player');
                if (!el || ytPlayerRef.current) return;

                ytPlayerRef.current = new window.YT.Player('yt-player', {
                    videoId,
                    playerVars: {
                        autoplay: 0,
                        controls: 0,
                        modestbranding: 1,
                        rel: 0,
                        showinfo: 0,
                        iv_load_policy: 3,
                        fs: 0,
                        disablekb: 1,
                        origin: window.location.origin,
                    },
                    events: {
                        onReady: (e: any) => setDuration(e.target.getDuration()),
                        onStateChange: (e: any) => setIsPlaying(e.data === window.YT.PlayerState.PLAYING),
                        onError: (e: any) => console.error('YouTube Player Error:', e.data),
                    },
                });
            };
            setTimeout(checkAndCreate, 100);
        };

        if (window.YT && window.YT.Player) {
            createPlayer();
        } else {
            if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
                const tag = document.createElement('script');
                tag.src = 'https://www.youtube.com/iframe_api';
                document.head.appendChild(tag);
            }
            window.onYouTubeIframeAPIReady = createPlayer;
        }

        return () => {
            ytPlayerRef.current?.destroy();
            ytPlayerRef.current = null;
        };
    }, [isYouTube, videoId]);

    useEffect(() => {
        if (!isYouTube) return;
        ytIntervalRef.current = setInterval(() => {
            if (ytPlayerRef.current?.getCurrentTime) setCurrentTime(ytPlayerRef.current.getCurrentTime());
            if (ytPlayerRef.current?.getDuration) {
                const d = ytPlayerRef.current.getDuration();
                if (d > 0) setDuration(d);
            }
        }, 500);
        return () => { if (ytIntervalRef.current) clearInterval(ytIntervalRef.current); };
    }, [isYouTube]);

    // ─── Controls ──────────────────────────────────────
    const togglePlay = useCallback(() => {
        if (isYouTube) {
            const player = ytPlayerRef.current;
            if (!player) return;
            isPlaying ? player.pauseVideo() : player.playVideo();
        } else {
            const video = videoRef.current;
            if (!video) return;
            if (video.paused) { video.play(); setIsPlaying(true); }
            else { video.pause(); setIsPlaying(false); }
        }
    }, [isYouTube, isPlaying]);

    const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (isYouTube) ytPlayerRef.current?.seekTo(time, true);
        else if (videoRef.current) videoRef.current.currentTime = time;
        setCurrentTime(time);
    }, [isYouTube]);

    const rewind = useCallback(() => {
        const t = Math.max(0, currentTime - 10);
        if (isYouTube) ytPlayerRef.current?.seekTo(t, true);
        else if (videoRef.current) videoRef.current.currentTime = t;
        setCurrentTime(t);
    }, [isYouTube, currentTime]);

    const forward = useCallback(() => {
        const t = Math.min(duration, currentTime + 10);
        if (isYouTube) ytPlayerRef.current?.seekTo(t, true);
        else if (videoRef.current) videoRef.current.currentTime = t;
        setCurrentTime(t);
    }, [isYouTube, currentTime, duration]);

    const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        setIsMuted(vol === 0);
        if (isYouTube) { ytPlayerRef.current?.setVolume(vol * 100); if (vol > 0) ytPlayerRef.current?.unMute(); }
        else if (videoRef.current) { videoRef.current.volume = vol; videoRef.current.muted = false; }
    }, [isYouTube]);

    const toggleMute = useCallback(() => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        if (isYouTube) { newMuted ? ytPlayerRef.current?.mute() : ytPlayerRef.current?.unMute(); }
        else if (videoRef.current) {
            videoRef.current.muted = newMuted;
            if (!newMuted && volume === 0) { setVolume(0.5); videoRef.current.volume = 0.5; }
        }
    }, [isYouTube, isMuted, volume]);

    const toggleFullScreen = useCallback(() => {
        const container = document.getElementById('player-container');
        if (!container) return;
        if (!document.fullscreenElement) { container.requestFullscreen(); setIsFullScreen(true); }
        else { document.exitFullscreen(); setIsFullScreen(false); }
    }, []);

    const handleTimeUpdate = () => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime); };
    const handleLoadedMetadata = () => { if (videoRef.current) setDuration(videoRef.current.duration); };

    const formatTime = (time: number) => {
        const h = Math.floor(time / 3600);
        const m = Math.floor((time % 3600) / 60);
        const s = Math.floor(time % 60);
        if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <>
            <div id="player-container" className="relative aspect-video bg-black rounded-xl overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 w-full h-full bg-black">
                    {!hasVideo ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-surface-dark">
                            <span className="material-symbols-outlined text-[64px] text-gray-600 mb-4">movie</span>
                            <p className="text-gray-400 text-lg">No video available</p>
                        </div>
                    ) : isYouTube ? (
                        <div className="w-full h-full pointer-events-none relative z-0">
                            <div id="yt-player" className="absolute inset-0 w-full h-full" />
                        </div>
                    ) : (
                        <video
                            ref={videoRef}
                            className="w-full h-full object-contain"
                            src={movie.videoUrl || movie.trailerUrl || ''}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onClick={togglePlay}
                            playsInline
                        />
                    )}
                </div>

                {isYouTube && hasVideo && (
                    <div className="absolute inset-0 z-10 cursor-pointer" onClick={togglePlay} />
                )}

                <div className={`absolute inset-0 flex items-center justify-center transition-opacity pointer-events-none z-20 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
                    <button className="size-20 rounded-full bg-primary flex items-center justify-center text-white shadow-[0_0_30px_rgba(236,19,55,0.4)]">
                        <span className="material-symbols-outlined text-5xl fill">{isPlaying ? 'pause' : 'play_arrow'}</span>
                    </button>
                </div>

                <div className={`absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`} />

                <div className={`absolute bottom-0 left-0 w-full p-4 lg:p-6 space-y-4 z-30 transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                    <div className="relative h-1.5 w-full bg-white/20 rounded-full cursor-pointer group/progress flex items-center">
                        <input type="range" min="0" max={duration || 100} step="0.1" value={currentTime} onChange={handleSeek} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-40" />
                        <div className="absolute h-full bg-primary rounded-full transition-all duration-100 pointer-events-none" style={{ width: `${progress}%` }} />
                        <div className="absolute top-1/2 -translate-y-1/2 bg-white rounded-full scale-0 group-hover/progress:scale-100 transition-transform pointer-events-none z-30 shadow-md size-4" style={{ left: `calc(${progress}% - 8px)` }} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={togglePlay} className="hover:text-primary transition-colors text-white z-40">
                                <span className="material-symbols-outlined text-3xl fill">{isPlaying ? 'pause' : 'play_arrow'}</span>
                            </button>
                            <button onClick={rewind} className="hover:text-primary transition-colors text-white z-40">
                                <span className="material-symbols-outlined">replay_10</span>
                            </button>
                            <button onClick={forward} className="hover:text-primary transition-colors text-white z-40">
                                <span className="material-symbols-outlined">forward_10</span>
                            </button>
                            <div className="flex items-center gap-2 group/vol">
                                <button onClick={toggleMute} className="hover:text-primary transition-colors text-white z-40">
                                    <span className="material-symbols-outlined">
                                        {isMuted || volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
                                    </span>
                                </button>
                                <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300 ease-in-out relative flex items-center z-40">
                                    <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white" />
                                </div>
                            </div>
                            <span className="text-sm font-medium text-white">{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-white">
                            <button className="hover:text-primary transition-colors z-40"><span className="material-symbols-outlined">closed_caption</span></button>
                            <button className="hover:text-primary transition-colors z-40"><span className="material-symbols-outlined">settings</span></button>
                            <button onClick={toggleFullScreen} className="hover:text-primary transition-colors z-40">
                                <span className="material-symbols-outlined">{isFullScreen ? 'fullscreen_exit' : 'fullscreen'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; height: 12px; width: 12px; border-radius: 50%; background: white; cursor: pointer; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
                input[type='range']::-webkit-slider-runnable-track { -webkit-appearance: none; background: transparent; }
                #yt-player iframe { width: 100% !important; height: 100% !important; position: absolute; top: 0; left: 0; }
            `}</style>
        </>
    );
}