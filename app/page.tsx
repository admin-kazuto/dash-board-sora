'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FaKey, FaVideo, FaCheckCircle, FaTrash, FaRedo, FaPlus, FaDesktop, FaBan, FaToggleOn, FaToggleOff, FaFilter } from 'react-icons/fa';

// === TOOL REGISTRY (Must match server-side TOOL_MAP) ===
const TOOL_CONFIG: Record<number, { name: string; prefix: string; color: string; borderColor: string; bg: string }> = {
  1: { name: 'Text-to-Video', prefix: 'T2V', color: 'bg-emerald-500/20 text-emerald-400', borderColor: 'border-emerald-500/30', bg: 'bg-emerald-600' },
  2: { name: 'Text-to-Image', prefix: 'T2I', color: 'bg-pink-500/20 text-pink-400', borderColor: 'border-pink-500/30', bg: 'bg-pink-600' },
  3: { name: 'Image-to-Video', prefix: 'I2V', color: 'bg-cyan-500/20 text-cyan-400', borderColor: 'border-cyan-500/30', bg: 'bg-cyan-600' },
  4: { name: 'Start-End', prefix: 'SE', color: 'bg-amber-500/20 text-amber-400', borderColor: 'border-amber-500/30', bg: 'bg-amber-600' },
  5: { name: 'Character Sync', prefix: 'SYNC', color: 'bg-rose-500/20 text-rose-400', borderColor: 'border-rose-500/30', bg: 'bg-rose-600' },
};

const ALL_TOOL_IDS = Object.keys(TOOL_CONFIG).map(Number);

interface License {
  _id: string;
  key: string;
  description: string;
  max_devices: number;
  devices: string[];
  valid_until: string;
  is_active: boolean;
  tools: number[];      // Array of allowed tool IDs
  tool_id?: number;     // Legacy field (backward compat)
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
  const [selectedTools, setSelectedTools] = useState<number[]>([1, 2, 3, 4, 5]); // Default: all
  const [expirationType, setExpirationType] = useState('1m');
  const [customDate, setCustomDate] = useState('');
  const [filterTool, setFilterTool] = useState(0); // 0 = All
  const router = useRouter();

  // Helper: normalize license data (handle legacy tool_id → tools)
  const normalizeLicense = (lic: any): License => {
    if (lic.tools && Array.isArray(lic.tools) && lic.tools.length > 0) {
      return lic;
    }
    // Legacy: convert tool_id to tools array
    if (lic.tool_id) {
      return { ...lic, tools: [lic.tool_id] };
    }
    return { ...lic, tools: [1, 2, 3, 4, 5] }; // Fallback: all tools
  };

  const fetchData = async () => {
    try {
      const statsRes = await axios.get('/api/dashboard');
      const licensesRes = await axios.get('/api/licenses');

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (licensesRes.data.success) {
        setLicenses(licensesRes.data.licenses.map(normalizeLicense));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const toggleTool = (toolId: number) => {
    setSelectedTools(prev =>
      prev.includes(toolId)
        ? prev.filter(t => t !== toolId)
        : [...prev, toolId].sort()
    );
  };

  const selectAllTools = () => setSelectedTools([...ALL_TOOL_IDS]);
  const clearAllTools = () => setSelectedTools([]);

  const generateKey = () => {
    // Use prefix of first selected tool, or 'ALL' if all selected
    let prefix = 'ALL';
    if (selectedTools.length === 1) {
      const cfg = TOOL_CONFIG[selectedTools[0]];
      prefix = cfg ? cfg.prefix : 'KEY';
    } else if (selectedTools.length > 0 && selectedTools.length < ALL_TOOL_IDS.length) {
      prefix = selectedTools.map(id => TOOL_CONFIG[id]?.prefix || '').join('+');
    }
    const seg = () => Math.random().toString(36).substring(2, 10).toUpperCase();
    const key = prefix + '-' + seg() + '-' + seg() + '-' + seg() + '-' + seg() + '-' + seg();
    setNewKey(key);
  };

  const createLicense = async () => {
    if (selectedTools.length === 0) {
      alert('Phải chọn ít nhất 1 tool!');
      return;
    }
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
        tools: selectedTools,
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

  const deleteDevice = async (licId: string, deviceId: string) => {
    if (!confirm('Xóa thiết bị này khỏi license?')) return;
    try {
      const license = licenses.find(l => l._id === licId);
      if (!license) return;
      const newDevices = license.devices.filter(d => d !== deviceId);
      await axios.put(`/api/licenses/${licId}`, { devices: newDevices });
      fetchData();
    } catch (error) {
      alert('Lỗi xóa thiết bị');
    }
  };

  const renewLicense = async (licId: string) => {
    const months = prompt('Nhập số tháng muốn gia hạn (ví dụ: 1):', '1');
    if (!months) return;

    const numMonths = parseInt(months);
    if (isNaN(numMonths) || numMonths <= 0) {
      alert('Số tháng không hợp lệ');
      return;
    }

    try {
      const license = licenses.find(l => l._id === licId);
      if (!license) return;

      const currentExpiry = new Date(license.valid_until);
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      const newExpiry = new Date(baseDate);
      newExpiry.setMonth(newExpiry.getMonth() + numMonths);

      await axios.put(`/api/licenses/${licId}`, { valid_until: newExpiry });
      fetchData();
      alert(`Gia hạn thành công thêm ${numMonths} tháng`);
    } catch (error) {
      alert('Lỗi gia hạn license');
    }
  };

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

  // Filter logic: show license if it has the filterTool in its tools array
  const filteredLicenses = filterTool === 0
    ? licenses
    : licenses.filter(l => (l.tools || []).includes(filterTool));

  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="bg-purple-600 p-2 rounded-lg text-2xl text-white">🚀</span> Admin Dashboard
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
          <div className="bg-gray-700/50 p-6 rounded-lg mb-8 space-y-4 border border-gray-600">
            {/* Row 1: Tools Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">Tools Included</label>
                <div className="flex gap-2">
                  <button onClick={selectAllTools} className="text-[10px] px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white transition border border-purple-600/30">
                    All
                  </button>
                  <button onClick={clearAllTools} className="text-[10px] px-2 py-0.5 rounded bg-gray-600/20 text-gray-400 hover:bg-gray-600 hover:text-white transition border border-gray-600/30">
                    None
                  </button>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(TOOL_CONFIG).map(([id, cfg]) => {
                  const toolId = parseInt(id);
                  const isSelected = selectedTools.includes(toolId);
                  return (
                    <button
                      key={id}
                      onClick={() => toggleTool(toolId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${isSelected
                        ? `${cfg.bg} text-white border-transparent shadow-lg`
                        : `bg-gray-900 text-gray-500 border-gray-700 hover:border-gray-500`
                        }`}
                    >
                      {isSelected ? '✓ ' : ''}{cfg.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Key + Description */}
            <div className="flex gap-4 flex-wrap items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-gray-400 block mb-1">License Key</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Click generate →"
                    className="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full font-mono text-sm text-yellow-400"
                  />
                  <button onClick={generateKey} className="bg-gray-600 px-3 rounded hover:bg-gray-500 transition"><FaRedo /></button>
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-gray-400 block mb-1">Description (Client Name)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Client name..."
                  className="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-sm"
                />
              </div>
            </div>

            {/* Row 3: Expiration + Devices + Create */}
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
                    className="mt-2 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm w-full outline-none focus:border-purple-500"
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

          {/* Filter Bar */}
          <div className="flex items-center gap-3 mb-4">
            <FaFilter className="text-gray-500" />
            <span className="text-sm text-gray-400">Filter by Tool:</span>
            <select
              value={filterTool}
              onChange={(e) => setFilterTool(parseInt(e.target.value))}
              className="bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-sm outline-none focus:border-purple-500"
            >
              <option value={0}>All Tools</option>
              {Object.entries(TOOL_CONFIG).map(([id, cfg]) => (
                <option key={id} value={id}>{cfg.name}</option>
              ))}
            </select>
            <span className="text-xs text-gray-500 ml-2">
              {filteredLicenses.length} / {licenses.length} licenses
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-700/50 text-gray-300 text-sm uppercase">
                  <th className="p-4 rounded-tl-lg">Key</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Tools</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Devices (IDs)</th>
                  <th className="p-4">Valid Until</th>
                  <th className="p-4 text-right rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredLicenses.map(lic => {
                  const isExpired = new Date() > new Date(lic.valid_until);
                  const isRowDisabled = !lic.is_active || isExpired;
                  const licTools = lic.tools || [];

                  return (
                    <tr key={lic._id} className={`border-b border-gray-700 hover:bg-gray-750/50 transition ${isRowDisabled ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                      <td className="p-4">
                        <div className="font-mono text-yellow-400 font-bold">{lic.key}</div>
                        <div className="text-[10px] text-gray-500 mt-1">ID: {lic._id}</div>
                      </td>
                      <td className="p-4 text-center">
                        {!lic.is_active ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                            Blocked
                          </span>
                        ) : isExpired ? (
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
                        <div className="flex flex-wrap gap-1">
                          {licTools.length === ALL_TOOL_IDS.length ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border bg-purple-500/20 text-purple-400 border-purple-500/30">
                              ALL TOOLS
                            </span>
                          ) : (
                            licTools.map(tid => {
                              const cfg = TOOL_CONFIG[tid];
                              if (!cfg) return null;
                              return (
                                <span key={tid} className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${cfg.color} ${cfg.borderColor}`}>
                                  {cfg.prefix}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-gray-300">{lic.description}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold w-fit ${lic.devices.length >= lic.max_devices ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                            {lic.devices.length} / {lic.max_devices} slots
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {lic.devices.map(devId => (
                              <div key={devId} className="flex items-center gap-1 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700 text-[10px] text-gray-400">
                                <span>{devId.substring(0, 8)}...</span>
                                <button onClick={() => deleteDevice(lic._id, devId)} className="text-red-500 hover:text-red-400">
                                  <FaTrash size={8} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`text-sm ${isExpired ? 'text-orange-400' : 'text-gray-400'}`}>
                          {new Date(lic.valid_until).getFullYear() === 2099 ? 'Forever' : new Date(lic.valid_until).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {new Date(lic.valid_until).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => renewLicense(lic._id)}
                            title="Renew License"
                            className="bg-green-600/10 text-green-400 border border-green-600/30 hover:bg-green-600 hover:text-white p-2 rounded transition"
                          >
                            <FaRedo />
                          </button>
                          <button
                            onClick={() => toggleLicenseStatus(lic._id, lic.is_active)}
                            title={lic.is_active ? "Block Key" : "Unblock Key"}
                            className={`p-2 rounded transition border ${lic.is_active ? 'bg-red-600/10 text-red-400 border-red-600/30 hover:bg-red-600 hover:text-white' : 'bg-green-600/10 text-green-400 border-green-600/30 hover:bg-green-600 hover:text-white'}`}
                          >
                            {lic.is_active ? <FaBan /> : <FaToggleOn />}
                          </button>
                          <button onClick={() => resetDevices(lic._id)} title="Reset All Devices" className="bg-blue-600/10 text-blue-400 border border-blue-600/30 hover:bg-blue-600 hover:text-white p-2 rounded transition">
                            <FaDesktop />
                          </button>
                          <button onClick={() => deleteLicense(lic._id)} title="Delete License" className="bg-orange-600/10 text-orange-400 border border-orange-600/30 hover:bg-orange-600 hover:text-white p-2 rounded transition">
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredLicenses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500 italic">No licenses found in database</td>
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
