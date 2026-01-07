'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FaKey, FaVideo, FaCheckCircle, FaTrash, FaRedo, FaPlus, FaDesktop, FaBan, FaToggleOn, FaToggleOff } from 'react-icons/fa';

interface License {
  _id: string;
  key: string;
  description: string;
  max_devices: number;
  devices: string[];
  valid_until: string;
  is_active: boolean;
  tool_id: number;
}

interface Stats {
  total_licenses: number;
  active_licenses: number;
  total_videos: number;
  success_rate: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);

  // New license form
  const [newKey, setNewKey] = useState('');
  const [description, setDescription] = useState('');
  const [maxDevices, setMaxDevices] = useState(1);
  const [toolId, setToolId] = useState(2); // 1: Veo, 2: Sora
  const [expirationType, setExpirationType] = useState('1m'); // 1d, 1w, 1m, 1y, forever, custom
  const [customDate, setCustomDate] = useState('');
  const router = useRouter();

  const fetchData = async () => {
    try {
      const statsRes = await axios.get('/api/dashboard');
      const licensesRes = await axios.get('/api/licenses');

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (licensesRes.data.success) setLicenses(licensesRes.data.licenses);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Simple Auth Check
    const checkAuth = () => {
      const hasToken = document.cookie.includes('auth_token=');
      if (!hasToken) {
        router.push('/login');
      } else {
        fetchData();
      }
    };
    checkAuth();
  }, [router]);

  const generateKey = () => {
    const prefix = toolId === 1 ? 'VEO-' : 'SORA-';
    const key = prefix + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setNewKey(key);
  };

  const createLicense = async () => {
    try {
      let validUntil = new Date();
      if (expirationType === 'custom' && customDate) {
        validUntil = new Date(customDate);
      } else if (expirationType === '1d') validUntil.setDate(validUntil.getDate() + 1);
      else if (expirationType === '1w') validUntil.setDate(validUntil.getDate() + 7);
      else if (expirationType === '1m') validUntil.setDate(validUntil.getDate() + 30);
      else if (expirationType === '1y') validUntil.setDate(validUntil.getDate() + 365);
      else if (expirationType === 'forever') validUntil.setFullYear(2099);

      await axios.post('/api/licenses', {
        key: newKey,
        description,
        max_devices: maxDevices,
        tool_id: toolId,
        valid_until: validUntil
      });

      setNewKey('');
      setDescription('');
      fetchData();
    } catch (error) {
      alert('Error creating license');
    }
  };

  const deleteLicense = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await axios.delete(`/api/licenses/${id}`);
      fetchData();
    } catch (error) {
      alert('Error deleting license');
    }
  };

  const resetDevices = async (id: string) => {
    try {
      await axios.put(`/api/licenses/${id}`, { devices: [] });
      fetchData();
      alert('Devices reset successfully');
    } catch (error) {
      alert('Error resetting devices');
    }
  }

  const toggleLicenseStatus = async (id: string, currentStatus: boolean) => {
    try {
      await axios.put(`/api/licenses/${id}`, { is_active: !currentStatus });
      fetchData();
    } catch (error) {
      alert('Error updating license status');
    }
  };

  const handleLogout = () => {
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/login');
  };

  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="bg-purple-600 p-2 rounded-lg text-2xl">🚀</span> Admin Dashboard
          </h1>
          <button onClick={handleLogout} className="bg-gray-800 hover:bg-red-600/20 text-gray-400 hover:text-red-400 px-4 py-2 rounded-lg text-sm transition border border-gray-700">
            Đăng xuất
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard icon={<FaKey />} title="Total Licenses" value={stats?.total_licenses || 0} color="bg-blue-600" />
          <StatCard icon={<FaCheckCircle />} title="Active Licenses" value={stats?.active_licenses || 0} color="bg-green-600" />
          <StatCard icon={<FaVideo />} title="Total Videos" value={stats?.total_videos || 0} color="bg-purple-600" />
          <StatCard icon={<FaCheckCircle />} title="Success Rate" value={(stats?.success_rate || 0) + '%'} color="bg-orange-600" />
        </div>

        {/* License Manager */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <FaKey className="text-yellow-500" /> License Manager
          </h2>

          {/* Create Form */}
          <div className="bg-gray-700 p-4 rounded-lg mb-8 space-y-4">
            <div className="flex gap-4 flex-wrap items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-gray-400 block mb-1">Tool Type</label>
                <select
                  value={toolId}
                  onChange={(e) => setToolId(parseInt(e.target.value))}
                  className="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-sm outline-none focus:border-purple-500"
                >
                  <option value={1}>Veo 3</option>
                  <option value={2}>Sora</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-gray-400 block mb-1">License Key</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Key..."
                    className="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full font-mono text-sm"
                  />
                  <button onClick={generateKey} className="bg-gray-600 px-3 rounded hover:bg-gray-500"><FaRedo /></button>
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-gray-400 block mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Client name..."
                  className="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-sm"
                />
              </div>
            </div>

            <div className="flex gap-4 flex-wrap items-end">
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm text-gray-400 block mb-1">Expiration</label>
                <select
                  value={expirationType}
                  onChange={(e) => setExpirationType(e.target.value)}
                  className="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-sm outline-none focus:border-purple-500"
                >
                  <option value="1d">1 Day</option>
                  <option value="1w">1 Week</option>
                  <option value="1m">1 Month</option>
                  <option value="1y">1 Year</option>
                  <option value="forever">Forever (2099)</option>
                  <option value="custom">📅 Custom Date/Time</option>
                </select>
                {expirationType === 'custom' && (
                  <input
                    type="datetime-local"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm outline-none focus:border-purple-500"
                  />
                )}
              </div>
              <div className="w-32">
                <label className="text-sm text-gray-400 block mb-1">Max Devices</label>
                <input
                  type="number"
                  value={maxDevices}
                  onChange={(e) => setMaxDevices(parseInt(e.target.value))}
                  className="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-sm"
                />
              </div>
              <div className="flex-1"></div>
              <button onClick={createLicense} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 h-[38px] transition shadow-lg shadow-purple-900/20">
                <FaPlus /> Create License
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-700 text-gray-300 text-sm uppercase">
                  <th className="p-4 rounded-tl-lg">Key</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Tool</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Devices</th>
                  <th className="p-4">Valid Until</th>
                  <th className="p-4 text-right rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {licenses.map(lic => {
                  const isExpired = new Date() > new Date(lic.valid_until);
                  const isRowDisabled = !lic.is_active || isExpired;

                  return (
                    <tr key={lic._id} className={`border-b border-gray-700 hover:bg-gray-750 transition ${isRowDisabled ? 'opacity-50 grayscale' : ''}`}>
                      <td className="p-4 font-mono text-yellow-400 font-bold">{lic.key}</td>
                      <td className="p-4 text-center">
                        {!lic.is_active ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                            Blocked
                          </span>
                        ) : new Date() > new Date(lic.valid_until) ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            Expired
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-500/20 text-green-400 border border-green-500/30">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${lic.tool_id === 1 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'}`}>
                          {lic.tool_id === 1 ? 'Veo 3' : 'Sora'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-300">{lic.description}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${lic.devices.length >= lic.max_devices ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                          {lic.devices.length} / {lic.max_devices}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">
                        {new Date(lic.valid_until).getFullYear() === 2099 ? 'Forever' : new Date(lic.valid_until).toLocaleString()}
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => toggleLicenseStatus(lic._id, lic.is_active)}
                          title={lic.is_active ? "Block Key" : "Unblock Key"}
                          className={`p-2 rounded transition border ${lic.is_active ? 'bg-red-600/10 text-red-400 border-red-600/30 hover:bg-red-600 hover:text-white' : 'bg-green-600/10 text-green-400 border-green-600/30 hover:bg-green-600 hover:text-white'}`}
                        >
                          {lic.is_active ? <FaBan /> : <FaToggleOn />}
                        </button>
                        <button onClick={() => resetDevices(lic._id)} title="Reset Devices" className="bg-blue-600/10 text-blue-400 border border-blue-600/30 hover:bg-blue-600 hover:text-white p-2 rounded transition">
                          <FaDesktop />
                        </button>
                        <button onClick={() => deleteLicense(lic._id)} title="Delete" className="bg-orange-600/10 text-orange-400 border border-orange-600/30 hover:bg-orange-600 hover:text-white p-2 rounded transition">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {licenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">No licenses found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }: any) {
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center text-xl`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  )
}
