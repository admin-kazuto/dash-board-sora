'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FaLock, FaUser } from 'react-icons/fa';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const resp = await axios.post('/api/auth/login', { username, password });
            if (resp.data.success) {
                // Successful login, the cookie is set by the server
                router.push('/');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
                <div className="p-8 text-center bg-gray-750">
                    <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg">
                        🚀
                    </div>
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <p className="text-gray-400 text-sm mt-1">Vui lòng đăng nhập để quản lý license</p>
                </div>

                <form onSubmit={handleLogin} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 block ml-1">Tài khoản</label>
                        <div className="relative">
                            <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-purple-500 transition"
                                placeholder="Nhập tài khoản..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 block ml-1">Mật khẩu</label>
                        <div className="relative">
                            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-purple-500 transition"
                                placeholder="Nhập mật khẩu..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-900/20 transition-all active:scale-[0.98]"
                    >
                        {loading ? 'Đang xác thực...' : 'Đăng nhập'}
                    </button>
                </form>
            </div>
        </div>
    );
}
