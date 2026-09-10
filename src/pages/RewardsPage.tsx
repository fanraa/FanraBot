import React, { useEffect, useState, useRef } from 'react';
import { 
  Users, 
  Coins, 
  MessageSquare, 
  Cpu, 
  CheckCircle2, 
  Award, 
  Search, 
  Volume2, 
  Info,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileText,
  Calendar,
  Image,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { LoadingView } from '../components/LoadingView';

const PREDEFINED_RULES = [
  { id: 'new_account', name: 'Bonus Akun Baru', desc: 'Pertama kali chat' },
  { id: 'whatsapp_interaction', name: 'Interaksi WhatsApp', desc: 'Per bubble pesan' },
  { id: 'command_trigger', name: 'Perintah/Command', desc: 'Trigger menu fitur' },
  { id: 'daily_active', name: 'Reward Aktif Harian', desc: 'Setiap pergantian hari' },
  { id: 'group_mention', name: 'Mention Bot di Grup', desc: 'Tag bot dalam pesan grup' },
  { id: 'upload_media', name: 'Kirim Media', desc: 'Kirim foto/video ke bot' },
  { id: 'payment', name: 'Donasi/Topup', desc: 'Konfirmasi transfer' },
  { id: 'invite_link', name: 'Undang Via Link', desc: 'Member join via link undangan' }
];

interface Stats {
  totalUsers: number;
  totalPointsGenerated: number;
  messagesToday: number;
  aiRequestsToday: number;
  activeUsersToday: number;
  premiumUsers: number;
}

interface Member {
  rank: number;
  id: string;
  name: string;
  phone: string;
  points: number;
  level: number;
  totalMessages: number;
  joinedAt: string;
}

interface RecentUser {
  id: string;
  name: string;
  points: number;
  joinedAt: string;
}

export default function RewardsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [leaderboard, setLeaderboard] = useState<Member[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Economy Rules State
  const [economyRules, setEconomyRules] = useState<{id: string, poin: number, isEditing: boolean}[]>([
    { id: 'new_account', poin: 25, isEditing: false },
    { id: 'whatsapp_interaction', poin: 1, isEditing: false },
    { id: 'command_trigger', poin: 2, isEditing: false },
    { id: 'daily_active', poin: 10, isEditing: false },
  ]);
  const [showRuleDropdown, setShowRuleDropdown] = useState(false);

  const updateEconomyRule = (id: string, poin: string | number) => {
    // Only numbers
    let valStr = poin.toString().replace(/[^0-9]/g, '');
    let val = parseInt(valStr, 10);
    if (isNaN(val)) val = 0;
    setEconomyRules(prev => prev.map(rule => rule.id === id ? { ...rule, poin: val } : rule));
  };
  
  const toggleEditRule = (id: string, isEditing: boolean) => {
    setEconomyRules(prev => prev.map(rule => rule.id === id ? { ...rule, isEditing } : rule));
  };
  
  const handleSaveRule = (id: string) => {
    setEconomyRules(prev => 
      prev
        .map(rule => {
          if (rule.id === id) {
            let val = Number(rule.poin) || 0;
            if (val > 500) val = 500;
            if (val < 0) val = 0;
            return { ...rule, poin: val, isEditing: false };
          }
          return rule;
        })
        .filter(rule => rule.poin > 0 || rule.isEditing)
    );
  };

  const handleAddRule = (id: string) => {
    if (!economyRules.find(r => r.id === id)) {
      setEconomyRules(prev => [...prev, { id, poin: 0, isEditing: true }]);
    }
    setShowRuleDropdown(false);
  };
  
  // Handle click outside for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRuleDropdown(false);
      }
    }
    if (showRuleDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showRuleDropdown]);

  const fetchRewardsData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/whatsapp/rewards/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setLeaderboard(data.leaderboard || []);
        setRecentUsers(data.recentUsers || []);
      }
    } catch (err) {
      console.error('Failed to load rewards data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewardsData();
  }, []);

  // Filter leaderboard
  const filteredLeaderboard = leaderboard.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    return (
      member.name.toLowerCase().includes(searchLower) ||
      member.phone.toLowerCase().includes(searchLower)
    );
  });

  // Pagination helper
  const totalPages = Math.ceil(filteredLeaderboard.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLeaderboard.slice(indexOfFirstItem, indexOfLastItem);

  // Mask phone standard
  const maskPhone = (phone: string) => {
    if (!phone) return '-';
    // Match only digits
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length < 8) return phone;
    return `${clean.slice(0, 5)}****${clean.slice(-4)}`;
  };

  return (
    <div id="rewards_root" className="space-y-6 w-full max-w-full pb-32 md:pb-8">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-on-surface">Sistem Loyalitas & Point Bot</h1>
          <p className="text-xs sm:text-sm text-on-surface-muted">Pusat monitoring poin, level, limit harian, dan statistik interaksi pengguna FanraBot WhatsApp. Atur dan pantau keaktifan ekonomi poin secara langsung.</p>
        </div>
        <button 
          onClick={fetchRewardsData}
          disabled={loading}
          id="refresh_rewards_btn"
          title="Refresh Data"
          className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-subtle rounded-md transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {loading ? (
        <LoadingView message="Memuat data statistik Rewards..." />
      ) : (
        <>
          {/* Section 1: Global Stats */}
          <div id="rewards_stats_grid" className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Stat 1 */}
            <div id="stat_total_users" className="bg-white border border-outline rounded-lg p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-muted uppercase tracking-wider">Total Pengguna</span>
                <Users className="w-4 h-4 text-primary shrink-0" />
              </div>
              <div className="mt-4">
                <h3 className="text-xl sm:text-2xl font-bold text-on-surface">{stats?.totalUsers || 0}</h3>
                <p className="text-[10px] text-on-surface-variant mt-1 font-medium">Interaksi WhatsApp</p>
              </div>
            </div>

            {/* Stat 2 */}
            <div id="stat_total_points" className="bg-white border border-outline rounded-lg p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-muted uppercase tracking-wider">Poin Beredar</span>
                <Coins className="w-4 h-4 text-primary shrink-0" />
              </div>
              <div className="mt-4">
                <h3 className="text-xl sm:text-2xl font-bold text-on-surface">{stats?.totalPointsGenerated || 0}</h3>
                <p className="text-[10px] text-on-surface-variant mt-1 font-medium">Sirkulasi Global</p>
              </div>
            </div>

            {/* Stat 3 */}
            <div id="stat_messages_today" className="bg-white border border-outline rounded-lg p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-muted uppercase tracking-wider">Pesan Hari Ini</span>
                <MessageSquare className="w-4 h-4 text-primary shrink-0" />
              </div>
              <div className="mt-4">
                <h3 className="text-xl sm:text-2xl font-bold text-on-surface">{stats?.messagesToday || 0}</h3>
                <p className="text-[10px] text-on-surface-variant mt-1 font-medium">Traffic Masuk</p>
              </div>
            </div>

            {/* Stat 4 */}
            <div id="stat_ai_requests" className="bg-white border border-outline rounded-lg p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-muted uppercase tracking-wider">AI Requests</span>
                <Cpu className="w-4 h-4 text-primary shrink-0" />
              </div>
              <div className="mt-4">
                <h3 className="text-xl sm:text-2xl font-bold text-on-surface">{stats?.aiRequestsToday || 0}</h3>
                <p className="text-[10px] text-on-surface-variant mt-1 font-medium">Chat & Intent</p>
              </div>
            </div>

            {/* Stat 5 */}
            <div id="stat_active_today" className="bg-white border border-outline rounded-lg p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-muted uppercase tracking-wider">Aktif Hari Ini</span>
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              </div>
              <div className="mt-4">
                <h3 className="text-xl sm:text-2xl font-bold text-on-surface">{stats?.activeUsersToday || 0}</h3>
                <p className="text-[10px] text-on-surface-variant mt-1 font-medium">User Berinteraksi</p>
              </div>
            </div>

            {/* Stat 6 */}
            <div id="stat_premium" className="bg-white border border-outline rounded-lg p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-muted uppercase tracking-wider">User Loyal</span>
                <Award className="w-4 h-4 text-primary shrink-0" />
              </div>
              <div className="mt-4">
                <h3 className="text-xl sm:text-2xl font-bold text-on-surface">{stats?.premiumUsers || 0}</h3>
                <p className="text-[10px] text-on-surface-variant mt-1 font-medium">Poin &gt;= 200</p>
              </div>
            </div>
          </div>

          <div id="rewards_middle_layout" className="flex flex-col gap-6">
            {/* Top Content: Leaderboard */}
            <div id="rewards_left_col" className="bg-white border border-outline rounded-lg p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-on-surface">Leaderboard Global</h2>
                  <p className="text-xs text-on-surface-muted mt-0.5">Peringkat 20 pengguna tersetia berdasarkan akumulasi poin interaksi.</p>
                </div>

                <div className="relative max-w-xs w-full">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-on-surface-variant" />
                  </span>
                  <input 
                    type="text" 
                    placeholder="Cari user (nama/phone)..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 border border-outline rounded-xl text-xs sm:text-sm bg-surface focus:outline-primary transition-shadow"
                  />
                </div>
              </div>

              {filteredLeaderboard.length === 0 ? (
                <div id="no_members_found" className="text-center py-12 text-on-surface-muted text-sm border border-outline border-dashed rounded-xl">
                  Tidak ada pengguna setia yang cocok dengan pencarian Anda.
                </div>
              ) : (
                <div id="leaderboard_table_wrapper" className="overflow-x-auto border border-outline rounded-xl">
                  <table className="min-w-full divide-y divide-outline">
                    <thead>
                      <tr className="bg-surface-subtle">
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-on-surface-muted uppercase tracking-wider w-16">Rank</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-on-surface-muted uppercase tracking-wider">Nama</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-on-surface-muted uppercase tracking-wider">Nomor HP</th>
                        <th className="px-4 py-3 text-center text-[11px] font-bold text-on-surface-muted uppercase tracking-wider">Poin</th>
                        <th className="px-4 py-3 text-center text-[11px] font-bold text-on-surface-muted uppercase tracking-wider">Level</th>
                        <th className="px-4 py-3 text-center text-[11px] font-bold text-on-surface-muted uppercase tracking-wider">Total Chat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline bg-white">
                      {currentItems.map((member, idx) => {
                        const rankNumber = indexOfFirstItem + idx + 1;
                        let rankBadge = '';
                        let rowClass = 'hover:bg-neutral-55 transition-colors';
                        
                        if (rankNumber === 1) {
                          rankBadge = '🥇';
                          rowClass = 'bg-amber-50/40 hover:bg-amber-50 transition-colors font-medium';
                        } else if (rankNumber === 2) {
                          rankBadge = '🥈';
                          rowClass = 'bg-slate-50 hover:bg-slate-100 transition-colors font-medium';
                        } else if (rankNumber === 3) {
                          rankBadge = '🥉';
                          rowClass = 'bg-amber-50/10 hover:bg-amber-50/20 transition-colors font-medium';
                        }

                        return (
                          <tr key={member.id} className={rowClass}>
                            <td className="px-4 py-3.5 whitespace-nowrap text-left">
                              <span className="flex items-center justify-start text-sm font-semibold text-on-surface-variant">
                                {rankBadge ? (
                                  <span className="text-xl mr-1 select-none">{rankBadge}</span>
                                ) : (
                                  rankNumber
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="text-sm font-medium text-on-surface">{member.name}</div>
                              <div className="text-[10px] text-on-surface-muted mt-0.5">Joined {new Date(member.joinedAt).toLocaleDateString()}</div>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-sm text-on-surface-muted font-mono">
                              {maskPhone(member.phone)}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-center text-sm font-bold text-amber-600">
                              {member.points}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-center text-sm font-semibold text-on-surface-variant">
                              ⭐ {member.level}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-center text-sm text-on-surface-muted font-medium">
                              {member.totalMessages}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div id="leaderboard_pagination" className="flex items-center justify-between border-t border-outline pt-4">
                   <p className="text-xs text-on-surface-muted">
                    Menampilkan <span className="font-semibold text-on-surface">{indexOfFirstItem + 1}</span> - <span className="font-semibold text-on-surface">{Math.min(indexOfLastItem, filteredLeaderboard.length)}</span> dari <span className="font-semibold text-on-surface">{filteredLeaderboard.length}</span> user
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1 px-2 border border-outline rounded-lg text-xs font-semibold text-on-surface-variant bg-white hover:bg-surface-subtle disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 inline" /> Prev
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 px-2 border border-outline rounded-lg text-xs font-semibold text-on-surface-variant bg-white hover:bg-surface-subtle disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5 inline" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Content: Point Economy and Recent Interactivity */}
            <div id="rewards_right_col" className="flex flex-col gap-6">
              {/* Card 1: Point Economy Rules & Interactive Simulation */}
              <div id="point_economy_card" className="bg-white border border-outline rounded-lg p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-on-surface flex items-center gap-1.5">
                      🪙 Point Economy
                    </h2>
                    <p className="text-xs text-on-surface-muted mt-0.5">Sistem keseimbangan tarif poin FanraBot. Anda dapat menyesuaikannya.</p>
                  </div>
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      onClick={() => setShowRuleDropdown(!showRuleDropdown)}
                      className="text-xs font-semibold px-3 py-1.5 bg-primary text-white hover:bg-primary/90 rounded-md transition-colors"
                    >
                      + Tambah Aturan
                    </button>
                    
                    {showRuleDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-outline rounded-lg shadow-lg z-10 py-1 overflow-hidden">
                        {PREDEFINED_RULES.filter(pr => !economyRules.find(er => er.id === pr.id)).length === 0 ? (
                          <div className="px-4 py-3 text-xs text-on-surface-muted text-center">Semua aturan sudah aktif</div>
                        ) : (
                          PREDEFINED_RULES.filter(pr => !economyRules.find(er => er.id === pr.id)).map(pr => (
                            <button
                              key={pr.id}
                              onClick={() => handleAddRule(pr.id)}
                              className="w-full text-left px-4 py-2 hover:bg-surface-subtle transition-colors flex flex-col"
                            >
                              <span className="text-xs font-semibold text-on-surface-variant">{pr.name}</span>
                              <span className="text-[10px] text-on-surface-muted">{pr.desc}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  {economyRules.map(rule => {
                    const preset = PREDEFINED_RULES.find(p => p.id === rule.id);
                    if (!preset) return null;
                    return (
                      <div key={rule.id} className="p-3 bg-surface-subtle rounded-md border border-outline flex items-center justify-between group">
                        <div>
                          <p className="font-semibold text-on-surface-variant">{preset.name}</p>
                          <p className="text-[10px] text-on-surface-muted">{preset.desc}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {rule.isEditing ? (
                            <div className="flex items-center gap-2">
                              {/* Point Edit with fixed + */}
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-600 font-bold text-sm select-none pointer-events-none">+</span>
                                <input 
                                  type="number"
                                  min="0"
                                  max="500"
                                  value={rule.poin === 0 && !rule.isEditing ? '' : rule.poin} 
                                  onChange={(e) => updateEconomyRule(rule.id, e.target.value)}
                                  className="bg-white border border-outline pl-6 pr-2 py-1 rounded-md text-amber-600 font-bold text-sm w-20 outline-none focus:border-primary transition-colors text-left"
                                />
                              </div>
                              <button onClick={() => handleSaveRule(rule.id)} className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">Simpan</button>
                            </div>
                          ) : (
                            <>
                              <span className="text-amber-600 font-bold text-sm w-20 text-right">+{rule.poin}</span>
                              <button onClick={() => toggleEditRule(rule.id, true)} className="text-[10px] font-semibold text-on-surface-muted hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card 2: Recent Interacted Users */}
              <div id="recent_users_card" className="bg-white border border-outline rounded-lg p-6 shadow-xs space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-on-surface flex items-center gap-1.5">
                    ⏱️ Interaksi Terbaru
                  </h2>
                  <p className="text-xs text-on-surface-muted mt-0.5">Sesi pendaftaran dan aktivitas baru terdeteksi.</p>
                </div>

                {recentUsers.length === 0 ? (
                  <div className="text-center py-6 text-on-surface-muted text-xs border border-outline border-dashed rounded-xl">
                    Belum ada aktivitas user masuk dalam log.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                    {recentUsers.map(user => (
                      <div 
                        key={user.id} 
                        className="p-3 bg-surface hover:bg-surface-subtle border border-outline rounded-md flex justify-between items-center transition-colors"
                      >
                        <div className="truncate max-w-[70%]">
                          <p className="font-semibold text-xs text-on-surface-variant truncate">{user.name}</p>
                          <p className="text-[9px] text-on-surface-muted mt-0.5 font-mono">
                            ID: {user.id.split('@')[0]}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-primary font-extrabold text-xs block">{user.points} pts</span>
                          <span className="text-[8px] text-on-surface-muted block mt-0.5">
                            {new Date(user.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Decorative Footnote */}
      <div id="rewards_footnote_box" className="p-4 bg-surface border border-outline rounded-lg flex items-start gap-3">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-on-surface-muted leading-relaxed">
          <p className="font-semibold text-on-surface-variant">Skema Optimasi & Aturan Sinkronisasi:</p>
          <p className="mt-0.5">
            Sistem ini menggunakan mekanisme buffering memori server-side yang meluruh secara harian (auto-reset). Points dan limit dihitung instan di dalam memori dan dikompres / ditulis ke Firestore dalam batch flush interval setiap 60 detik (60.000 ms) untuk menghemat bandwidth baca/tulis server demi keunggulan kuota Firestore gratis Anda.
          </p>
        </div>
      </div>
    </div>
  );
}
