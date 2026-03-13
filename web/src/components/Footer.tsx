import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-surface-dark/50 border-t border-white/5 py-12 px-6 lg:px-24">
            <div className="max-w-[1440px] mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div className="space-y-4">
                        <h5 className="text-white font-bold uppercase tracking-widest text-xs">Platform</h5>
                        <ul className="space-y-2 text-white/50 text-sm font-medium">
                            <li><Link className="hover:text-primary" href="#">Download App</Link></li>
                            <li><Link className="hover:text-primary" href="#">TV Devices</Link></li>
                            <li><Link className="hover:text-primary" href="#">Subscription Plans</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h5 className="text-white font-bold uppercase tracking-widest text-xs">Help</h5>
                        <ul className="space-y-2 text-white/50 text-sm font-medium">
                            <li><Link className="hover:text-primary" href="#">Account</Link></li>
                            <li><Link className="hover:text-primary" href="#">Help Center</Link></li>
                            <li><Link className="hover:text-primary" href="#">Contact Us</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h5 className="text-white font-bold uppercase tracking-widest text-xs">Legal</h5>
                        <ul className="space-y-2 text-white/50 text-sm font-medium">
                            <li><Link className="hover:text-primary" href="#">Privacy Policy</Link></li>
                            <li><Link className="hover:text-primary" href="#">Terms of Use</Link></li>
                            <li><Link className="hover:text-primary" href="#">Cookie Prefs</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h5 className="text-white font-bold uppercase tracking-widest text-xs">Connect</h5>
                        <div className="flex gap-4">
                            <span className="material-symbols-outlined text-white/50 hover:text-primary cursor-pointer">social_leaderboard</span>
                            <span className="material-symbols-outlined text-white/50 hover:text-primary cursor-pointer">groups</span>
                            <span className="material-symbols-outlined text-white/50 hover:text-primary cursor-pointer">rss_feed</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 gap-4">
                    <div className="flex items-center gap-2 text-primary opacity-50">
                        <span className="material-symbols-outlined text-2xl">movie_filter</span>
                        <h2 className="text-white text-lg font-bold">Trailer</h2>
                    </div>
                    <p className="text-white/30 text-xs">© 2024 Trailer Entertainment Inc. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
