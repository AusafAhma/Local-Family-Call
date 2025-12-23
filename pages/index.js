import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
    const [username, setUsername] = useState('');
    const [copied, setCopied] = useState(false);
    const router = useRouter();

    const handleJoin = (e) => {
        e.preventDefault();
        if (username.trim()) {
            router.push(`/room?username=${encodeURIComponent(username.trim())}`);
        }
    };

    const copyMeetingLink = () => {
        const meetingLink = window.location.origin;
        navigator.clipboard.writeText(meetingLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
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

                    <div className="share-section">
                        <div className="share-label">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M13 10c-.7 0-1.3.3-1.8.7l-3.3-1.9c.1-.3.1-.5.1-.8s0-.5-.1-.8l3.3-1.9c.5.5 1.1.7 1.8.7 1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3c0 .3 0 .5.1.8L7.8 5.7C7.3 5.3 6.7 5 6 5c-1.7 0-3 1.3-3 3s1.3 3 3 3c.7 0 1.3-.3 1.8-.7l3.3 1.9c-.1.3-.1.5-.1.8 0 1.7 1.3 3 3 3s3-1.3 3-3-1.3-3-3-3z" />
                            </svg>
                            Share this meeting link with others
                        </div>
                        <div className="link-box">
                            <span className="meeting-link">
                                {typeof window !== 'undefined' ? window.location.origin : 'Loading...'}
                            </span>
                            <button
                                onClick={copyMeetingLink}
                                className="copy-btn"
                                type="button"
                                title="Copy meeting link"
                            >
                                {copied ? (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                                        </svg>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z" />
                                            <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z" />
                                        </svg>
                                        Copy Link
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

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
