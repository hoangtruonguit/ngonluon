import Image from 'next/image';
import Link from 'next/link';
import ContinueWatchingCard from '@/components/ContinueWatchingCard';
import MovieCard from '@/components/MovieCard';

export default function Home() {
    return (
        <>
            {/* Hero Section */}
            <section className="relative h-screen w-full overflow-hidden">
                {/* Mock Video Background */}
                <div className="absolute inset-0 scale-105">
                    <Image
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaxZgdlklFYfzm1mu2meRJAaUNh585P9z7B5WhDT6R3WtUqh2DNWMbX8PEzewT3O4Lvrr9Llkt0LxY7TrGo7g5QsdG7JoNYqCvcCR5xpWJVZ3lE83VV82tS92C00liOE8dlG0elp9DFfijyZvLG_R_o1c4IB9zxRyIzdAaMLkK7QRel3RJDQLVA1plnI_QV7y18-UfeTch5NbgGWVOlBmnMSa_upHF4eH6LzzcYjYJQYBryvUqIiOuUUdyMgK4JC0G1Kpf8O5HuLI"
                        alt="Cinematic wide shot of epic desert planet landscape"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-black/30"></div>
                </div>
                <div className="hero-gradient absolute inset-0"></div>

                <div className="relative h-full flex flex-col justify-end pb-24 px-6 lg:px-24 max-w-[1440px] mx-auto">
                    <div className="max-w-2xl flex flex-col gap-6">
                        <div className="flex items-center gap-2">
                            <span className="bg-primary px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase text-white">Trending #1</span>
                            <span className="text-white/60 text-sm font-medium">2024 • Sci-Fi • 2h 46m</span>
                        </div>
                        <h1 className="text-white text-6xl lg:text-8xl font-black leading-[0.9] tracking-tighter">
                            DUNE:<br /><span className="text-primary">PART TWO</span>
                        </h1>
                        <p className="text-white/80 text-lg lg:text-xl font-medium leading-relaxed max-w-xl">
                            Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <button className="flex items-center gap-3 bg-primary hover:bg-primary/90 transition-all transform hover:scale-105 px-8 py-4 rounded-lg text-white font-bold text-lg shadow-xl shadow-primary/20">
                                <span className="material-symbols-outlined fill-1">play_arrow</span>
                                Watch Now
                            </button>
                            <button className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-all glass px-8 py-4 rounded-lg text-white font-bold text-lg">
                                <span className="material-symbols-outlined">info</span>
                                More Info
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="relative z-10 -mt-10 pb-24 space-y-12">
                {/* Category Chips */}
                <div className="px-6 lg:px-24 max-w-[1440px] mx-auto">
                    <div className="flex gap-3 overflow-x-auto hide-scrollbar py-2">
                        <button className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary px-6 text-white text-sm font-bold shadow-lg shadow-primary/30">All</button>
                        {['Action', 'Sci-Fi', 'Drama', 'Horror', 'Documentary', 'Comedy'].map((genre) => (
                            <button key={genre} className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full bg-surface-dark border border-white/5 px-6 text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm font-semibold">{genre}</button>
                        ))}
                    </div>
                </div>

                {/* Continue Watching Row */}
                <section className="px-6 lg:px-24 max-w-[1440px] mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-white text-2xl font-bold tracking-tight">Continue Watching</h2>
                        <Link className="text-primary text-sm font-bold hover:underline flex items-center gap-1" href="#">View All <span className="material-symbols-outlined text-sm">arrow_forward_ios</span></Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <ContinueWatchingCard
                            title="Interstellar"
                            timeLeft="45m left"
                            progress={70}
                            imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuB2m5Rh1FLP1HGOF8XoltCzDDa5xqdcIuDc3mdn-6oxC0pOseE_TcYiY7HPqGUOZ7wzG1BzXh7q0xLKTdGw8Bd-_G0g5Vv95iGE-Cqrb4gVabvaKWPBwDh0ruTTG5xS2I9p3OIZB6BDhkrm2XxeaagSJfpDttAYWiXLiJXFcTpWtjJLCZhtiYl692ExamhDPAD0L5NJXHVWYQYKH2ECh_I8OkjzUatzfKl390DapPpWM4EF-Ml7L0mppqufangDQ0igCV5aESg56fg"
                        />
                        <ContinueWatchingCard
                            title="The Batman"
                            timeLeft="1h 10m left"
                            progress={30}
                            imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuDgKQ1Mh6b_C8ikcTwWSmtdAz9_AXnDftNA8lwfI545hsjIlAWSgGKa6uxXPcNqfQkLSWXnRo9vVOje3C5C-xJ0YG_g1TMuc1YPyP3613Jtep93egYN2Z6tspWJQVpg4W-0GkZOFcb17o0QtqFWVbFfnF7aUq7TGyNqMfDGtD8RoFMPd4k9h2Ri--eciRy-SUS1d30Or4IzShcijzkAJ1aFvMJbw39YgiPINcAbr7cMpCV7zacYcIwKNWi53w_eudGTdSLES7GeUCU"
                        />
                        <ContinueWatchingCard
                            title="Inception"
                            timeLeft="20m left"
                            progress={85}
                            imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuAsNEwXo6UcuKqS9wmW_lFKJhKyHWH2lUzxRzS5HfW_DYdeWg_mh85lmuca3sqgEL7EfJSA9i2Tspmf5IBN5uVZl6ljpiFxwQZ-1lW8jP6RaffhBCJpZ4jobyaAi9zsNxx-3zIxYjcA_qMZcf2-KnJmtiCyUfA-zFAwzHOQIgg-BfsLg5TleCbmKFJEqoM_9PS-lcvz_iUoGGVzttFGX8Lz2Xp575xCwoOEB_MjoP6sjiYf4tLFkWf6At095nIi6U2iZm1kEpyGil0"
                        />
                        <ContinueWatchingCard
                            title="The Matrix"
                            timeLeft="55m left"
                            progress={45}
                            imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuAwVEpzYUuOJ39tsHX1YhIi1EBh8mtfSvaSiX61IS9MMDkOEKHFOMsRnTr3OuyFPVb3Pem7H6bRJGdvaHrYNn_gXyIRbCOEbUoRgUbV6lQBjdukCqG82VP5lNnEDNyP9pp38ttV1iWujP4nIV_MwOEUtqaF1LojfLhX0MH-gxzmSzF5-O_N5-jBvw9aTv7XCm0uILLWxbvXWtSQHD41wYPZT3O5LpqBuP4iOPL_TdH7HEjBCi26awT1nv278psVGpWOV8Cd-iZmEEs"
                        />
                    </div>
                </section>

                {/* Trending Now Carousel */}
                <section className="pl-6 lg:pl-24 max-w-[1440px] mx-auto overflow-hidden">
                    <h2 className="text-white text-2xl font-bold tracking-tight mb-6">Trending Now</h2>
                    <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-6">
                        <MovieCard
                            title="Beyond Light"
                            rating="9.2"
                            description="A journey to the edges of the galaxy to find a missing civilization lost to time and space."
                            imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuA_pzoqWnmIMFaHzzj6J238MJBNoaHpjtz9uyLvC1TAfSU39BVCiX_-s0RLeQZkK3HWBZqsZCSgOAaeQBlBJD829GCy50tje3embNFU47h_BiCTuZwuTSHm_nUkJyWiOlhhL-gB7cJo_I7-eIvWTLDn9DQNpwXuMfgtiASNgN8MD3rZHx5LcZkFHbPYiqCfBDMTE5glXn6Grtv6kjgwsmdF6HgzDxlzXKr-CvjiOHyfVpopTw_r-jLEKwpoHHvFJFGQnGfeKlqF91s"
                            showWatchButton={true}
                        />
                        <MovieCard
                            title="Neon Pulse"
                            rating="8.5"
                            description="In a cyberpunk future, a rogue hacker discovers a conspiracy that could bring down the global grid."
                            imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuDnuJo4bB9cxnaYOtogjBycj2pJTW3xPVxEpj7l4yJ3vwwA8pbfLy801Xa0wjLMwuUeNc3Y7cxOwylOilYPJ39FqvUFRQmHPO2beP4FXJI7aZpiqTOOvwsWrsljPeRsX8nVa-4jfB8ZmppUacJYKAI_Oop7q9H-D9nvj81gv3ABDYLj_LPkF58MZyGCKvEORrGLA6GPrryv3O7a7Kfep1KAis4aGGoUWGGm3ieDhBOzRdr1sEDL2cz8kLCckjxDtDx2KGB8z5HC1vo"
                            showWatchButton={true}
                        />
                        <MovieCard
                            title="The Summit"
                            rating="8.9"
                            description="One man's struggle against nature and his own past during a record-breaking solo climb."
                            imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuAkZx5EZSKCsF_qlNSgFG2ccVc3pkH2MwgGgeqO6ApHR0kSGjgJoCpv1sfMuMsJhpVUGkAy03L3d7HoCs4fUUv05NneqKFMp8g6nJ7Bx6OhPoipY435rFolCnJkkjCGuI9inN6LJ1ckUaUEaK-QlPBKJ88H08mEWUuwEKXJuPmZhm17K4ZNa3rDrrzT5lo_ZJ_LpYVYlWeyRGCr2z9te3PHbwDESSwjuRSu38Hjj_cQ-WB6__u8yCdPHgwk6nJTiMa2WRTYGxrn-9E"
                            showWatchButton={true}
                        />
                        <MovieCard
                            title="Echo One"
                            rating="7.4"
                            description="A sentient AI begins to question its purpose after witnessing human compassion for the first time."
                            imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuAOKbABRw6liD-HxqMbhKE0vyHwKRqFknKcXCCoLWKEp4VytZhx0DIx9hlD12BFD7ZSbczLXavrR_DIwbSixIP09p8wkB4ziNT8K_lK0nEi7P6MTa2ytyNUrk8hLuRwNi3A794RRc3ns_u3ZjA6AJcP2Os-dF6zcaeWtfgWS4r_Sgcp1UMqg2lo8hUZWsnTQnEBzhuTY83IzFFA_VgCMAmzdOuSCdUpw6talE-CZH9FpAVhCeD9Ia_LHdTRHtH5pXEtHctg69oV3us"
                            showWatchButton={true}
                        />
                        <MovieCard
                            title="Dark Woods"
                            rating="8.1"
                            description="A small town's secrets are unearthed when a mysterious celestial object crashes nearby."
                            imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuBfd1M_WsnxG8XUljJAw973UFnaIo_aoFKjo9nd7qn235GE_s6bTKOwYT1HjXXpP75NQohyFLE4PpoaOHmjQ_hNHdMhGyRzF3q1bHVehC1uE2xmD3kYbhC7Rn9ndqLEjghRdQ8SgS2dCnrDOmf9rBw_KTKWpGH9tuuURoxB_wKMUSZ1BFWiGgytjTy9ZJkgm-pM0H7LYcZuzSfPdwpau3pEi-dJmamh4PLktWYprYg0BNxVRrT71olulcNIUCuTXGndQW-XWXJij-U"
                            showWatchButton={true}
                        />
                    </div>
                </section>

                {/* New Releases Carousel */}
                <section className="pl-6 lg:pl-24 max-w-[1440px] mx-auto overflow-hidden">
                    <h2 className="text-white text-2xl font-bold tracking-tight mb-6">New Releases</h2>
                    <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-6">
                        <MovieCard
                            title="Aquatica"
                            rating="7.8"
                            description="Exploring the depths of Earth's final frontier where a new ecosystem has evolved in isolation."
                            imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuAbWncq1d0n6QkXFAscyv1F3sp_Mcv_o8_1VfQGi_sxINF6X4oLCzdEirZ6b0Fd0Iy1tQDDwp1-7OLC2CJGD69CUxZvtv5aspWxtbJmjFGKBlrzGQjSd6q1PBP9siJgJZxAH60SbD-wNYtYL_41lK4gDSbdzwIwjUbdZr5kErZC-aeNHbS1cHGvET62qLPfcjJ-gBHifcVQcsmWAzKNYM4p9LSZ7cg3ip6JSon_tMg0J2vU-ZifwgiES84M0dtKQMzc6bG2lJlvdzM"
                            showWatchButton={false}
                        />
                        <MovieCard
                            title="Sunset Blvd"
                            rating="8.2"
                            description="A nostalgic trip back to the 80s through the eyes of two young dreamers in Los Angeles."
                            imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuCSCU_AFZ69aUxg3FHzPU4OiUJqanOBTArraDiqjlZ3hzx70IFoKVovopfcVlQn5t3xqcz9XLtgK-RrX3IRyzLo9RlzV8-CgNrW5IEH01W1C4sDpiVVp9U9eYcIxHLX66oCStTs-Oea0d5FkoEb52yAMdK1lp1l5Cu_Z9ux28JP3LwbpcAJldTJ1ul2Y4Ek-Q2-KD-ZbO7sSPwMm3gjFaovxPP1Qvlxj92puB5kyilOvd74lhVo2BOgHdghiph_SQF21ykUYc-e2aw"
                            showWatchButton={false}
                        />
                        <MovieCard
                            title="Noir"
                            rating="9.0"
                            description="A modern take on the detective genre, shot in stunning high-contrast monochrome."
                            imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuDHlEKBcGEIyjPJwlRE-duN8wp2l6F1RkAD3ImKGm0JIEfHh_xH_9DcadmTFxQBFVKTCueHL6ioDIFrQCQ6aOyuUG-aE-kmsT-XJXLqFg7qUXMuhwP2ZdAWdJTK6QuZpbkGsh3I9S54vh4YBwM_WloyWRVvQ8ba2_WzGAuyF7Oys8gYWc3ZbT1jXUERWntIWNhvORWWRFlQbrE9XjpNpALy2i3l4XQipngyZ7vnA-Ztdx7z0rrLCBV8JO_7foTGLDLFlAfY9aEIjio"
                            showWatchButton={false}
                        />
                    </div>
                </section>
            </main>
        </>
    );
}
