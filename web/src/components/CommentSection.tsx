'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from '@/i18n/routing';
import { movieService, MovieComment } from '@/services/movie.service';
import Image from 'next/image';

interface CommentSectionProps {
    movieId: string;
    className?: string;
}

export default function CommentSection({ movieId, className = "mt-12" }: CommentSectionProps) {
    const { isLoggedIn } = useAuth();
    const router = useRouter();

    const [comment, setComment] = useState('');
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [sortBy, setSortBy] = useState<'newest' | 'top'>('newest');
    const [comments, setComments] = useState<MovieComment[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchComments = async () => {
        setIsLoading(true);
        const fetched = await movieService.getCommentsByMovie(movieId, 0, 50);
        setComments(fetched);
        setIsLoading(false);
    };

    useEffect(() => {
        if (movieId) {
            fetchComments();
        }
    }, [movieId]);

    const handlePostComment = async () => {
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }

        if (!comment.trim()) return;

        setIsSubmitting(true);
        const newComment = await movieService.addComment(movieId, comment, isSpoiler);
        if (newComment) {
            setComment('');
            setIsSpoiler(false);
            setComments([newComment, ...comments]);
        }
        setIsSubmitting(false);
    };

    const sortedComments = [...comments].sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // If sorting by top, we'd need likes count. Let's just fallback to newest for now.
        return 0;
    });

    return (
        <div className={`bg-surface-dark/30 rounded-xl p-6 border border-white/5 ${className}`}>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">chat_bubble</span>
                    <h3 className="text-xl font-bold text-white">
                        Discussion <span className="text-gray-500 font-normal ml-2">({comments.length})</span>
                    </h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSortBy('newest')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${sortBy === 'newest' ? 'bg-primary text-secondary' : 'bg-surface-dark text-gray-400 hover:bg-white/10'}`}
                    >
                        Newest
                    </button>
                    <button
                        onClick={() => setSortBy('top')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${sortBy === 'top' ? 'bg-primary text-secondary' : 'bg-surface-dark text-gray-400 hover:bg-white/10'}`}
                    >
                        Top Rated
                    </button>
                </div>
            </div>

            <div className="mb-10">
                <div className="flex gap-4">
                    <div className="size-10 rounded-full bg-gray-700 shrink-0 overflow-hidden relative">
                         {/* user avatar could go here if logged in */}
                         <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-gray-400">person</span>
                    </div>
                    <div className="flex-1 space-y-4">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full bg-surface-dark border border-white/10 rounded-xl p-4 text-sm focus:ring-1 focus:ring-primary focus:outline-none min-h-[100px] text-white placeholder:text-gray-500"
                            placeholder={isLoggedIn ? "Write a comment..." : "Log in to post a comment..."}
                        />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsSpoiler(!isSpoiler)}>
                                    <div className={`size-4 border rounded flex items-center justify-center transition-colors ${isSpoiler ? 'border-primary' : 'border-gray-600 group-hover:border-primary'}`}>
                                        <div className={`size-2 bg-primary rounded-sm transition-opacity ${isSpoiler ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
                                    </div>
                                    <span className="text-xs text-gray-400">Spoiler?</span>
                                </label>
                            </div>
                            <button 
                                onClick={handlePostComment}
                                disabled={isSubmitting || (isLoggedIn && !comment.trim())}
                                className="px-8 py-2 bg-primary text-secondary font-bold rounded-lg hover:scale-105 transition-transform w-full sm:w-auto disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isLoggedIn ? (isSubmitting ? 'POSTING...' : 'POST') : 'LOG IN TO POST'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {isLoading ? (
                    <div className="flex justify-center"><div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                ) : sortedComments.length > 0 ? (
                    sortedComments.map(c => (
                        <div key={c.id} className="flex gap-4">
                            <div className="size-10 rounded-full bg-gray-700 shrink-0 overflow-hidden relative">
                                {c.user.avatarUrl ? (
                                    <Image src={c.user.avatarUrl} alt={c.user.fullName || 'User'} fill sizes="40px" className="object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-gray-400">person</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <span className="text-white font-bold text-sm mr-2">{c.user.fullName || 'User'}</span>
                                        <span className="text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {c.isSpoiler && (
                                        <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold uppercase rounded-full">Spoiler</span>
                                    )}
                                </div>
                                <p className={`text-sm ${c.isSpoiler ? 'text-gray-500 blur-sm hover:blur-none transition-all cursor-pointer' : 'text-gray-300'}`} title={c.isSpoiler ? 'Hover to reveal spoiler' : ''}>
                                    {c.content}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center text-sm">No comments yet. Be the first!</p>
                )}
            </div>
        </div>
    );
}