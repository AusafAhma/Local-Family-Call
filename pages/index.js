import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
    const [username, setUsername] = useState('');
    const router = useRouter();

    const handleJoin = (e) => {
        e.preventDefault();
        if (username.trim()) {
            router.push(`/room?username=${encodeURIComponent(username.trim())}`);
        }
    };

    return (
        <>
            <Head>
                <title>Family Video Call</title>
                <meta name="description" content="Simple video calling for family" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <div className="container">
                <div className="join-card">
                    <div className="logo">
                        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                            <rect width="60" height="60" rx="12" fill="url(#gradient)" />
                            <path d="M20 22C20 20.8954 20.8954 20 22 20H30L40 30L30 40H22C20.8954 40 20 39.1046 20 38V22Z" fill="white" />
                            <defs>
                                <linearGradient id="gradient" x1="0" y1="0" x2="60" y2="60">
                                    <stop stopColor="#667eea" />
                                    <stop offset="1" stopColor="#764ba2" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    <h1>Family Video Call</h1>
                    <p className="subtitle">Connect with your loved ones</p>

                    <form onSubmit={handleJoin} className="join-form">
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            maxLength={30}
                            required
                            autoFocus
                        />
                        <button type="submit" disabled={!username.trim()}>
                            Join Call
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M7 3L15 10L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </form>

                    <div className="features">
                        <div className="feature">
                            <span className="icon">🎥</span>
                            <span>HD Video & Audio</span>
                        </div>
                        <div className="feature">
                            <span className="icon">👥</span>
                            <span>Up to 10 participants</span>
                        </div>
                        <div className="feature">
                            <span className="icon">🔒</span>
                            <span>Secure & Private</span>
                        </div>
                    </div>
                </div>

                <div className="background-decoration">
                    <div className="circle circle-1"></div>
                    <div className="circle circle-2"></div>
                    <div className="circle circle-3"></div>
                </div>
            </div>
        </>
    );
}
