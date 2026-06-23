import React, { useState, useMemo, useEffect } from "react";
import { Search, RotateCcw, Check, X, ShieldAlert, ArrowUpDown, UserCheck, Smartphone } from "lucide-react";
import { Graduate, ActivityLog } from "../types";

interface ReceptionistPanelProps {
  graduates: Graduate[];
  onTogglePresence: (id: string, isPresent: boolean) => void;
  logs: ActivityLog[];
  onResetData: () => void;
}

export default function ReceptionistPanel({ graduates, onTogglePresence, logs, onResetData }: ReceptionistPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPresence, setFilterPresence] = useState<"all" | "present" | "absent">("all");
  const [filterProdi, setFilterProdi] = useState<string>("all");
  const [quickNimInput, setQuickNimInput] = useState("");
  const [quickCheckInMessage, setQuickCheckInMessage] = useState<{ type: "success" | "error" | null, text: string }>({ type: null, text: "" });

  // Get list of unique majors (Prodi)
  const uniqueProdis = useMemo(() => {
    const prodis = new Set<string>();
    graduates.forEach(g => {
      if (g.prodi) prodis.add(g.prodi);
    });
    return Array.from(prodis).sort();
  }, [graduates]);

  // Filter and search logic
  const filteredGraduates = useMemo(() => {
    return graduates.filter(g => {
      const matchesSearch = 
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.nim.includes(searchQuery) ||
        g.seatCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.prodi && g.prodi.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPresence = 
        filterPresence === "all" ||
        (filterPresence === "present" && g.isPresent) ||
        (filterPresence === "absent" && !g.isPresent);

      const matchesProdi = 
        filterProdi === "all" || 
        g.prodi === filterProdi;

      return matchesSearch && matchesPresence && matchesProdi;
    });
  }, [graduates, searchQuery, filterPresence, filterProdi]);

  // Quick check-in by NIM
  const handleQuickCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNim = quickNimInput.trim();
    if (!cleanNim) return;

    // Find graduate
    const grad = graduates.find(g => g.nim === cleanNim || g.id === cleanNim);
    if (!grad) {
      setQuickCheckInMessage({
        type: "error",
        text: `NIM "${cleanNim}" tidak ditemukan.`
      });
      setQuickNimInput("");
      return;
    }

    if (grad.isPresent) {
      setQuickCheckInMessage({
        type: "error",
        text: `${grad.name} (NIM ${grad.nim}) sudah ditandai hadir sebelumnya.`
      });
    } else {
      onTogglePresence(grad.id, true);
      setQuickCheckInMessage({
        type: "success",
        text: `BERHASIL! ${grad.name} (Kursi ${grad.seatCode}) telah check-in.`
      });
    }

    setQuickNimInput("");
  };

  // Clear check-in message after 4 seconds
  useEffect(() => {
    if (quickCheckInMessage.type) {
      const timer = setTimeout(() => {
        setQuickCheckInMessage({ type: null, text: "" });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [quickCheckInMessage]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full" id="receptionist-panel-container">
      {/* Search & Actions Panel */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Quick Check-in Bar */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Smartphone className="text-blue-600" size={16} />
            Check-In Cepat (Ketik NIM / Scan Barcode)
          </h3>
          <form onSubmit={handleQuickCheckIn} className="flex gap-2">
            <input
              type="text"
              placeholder="Ketik NIM Wisudawan lalu tekan Enter..."
              value={quickNimInput}
              onChange={(e) => setQuickNimInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-800 rounded-2xl px-4 py-3 text-sm focus:outline-none placeholder-slate-400 font-mono"
              id="quick-nim-input"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all duration-150 cursor-pointer shadow hover:scale-[1.01]"
            >
              Hadir!
            </button>
          </form>

          {/* Quick Check In Status */}
          {quickCheckInMessage.type && (
            <div
              id="quick-check-in-feedback"
              className={`mt-3 p-4 rounded-2xl text-xs font-semibold leading-relaxed animate-fade-in ${
                quickCheckInMessage.type === "success"
                  ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                  : "bg-rose-50 border border-rose-100 text-rose-700"
              }`}
            >
              {quickCheckInMessage.text}
            </div>
          )}
        </div>

        {/* Filters and List */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-sm font-bold text-slate-800">Daftar Kehadiran Wisudawan</h3>

            <div className="flex flex-wrap gap-2">
              {/* Reset to Default */}
              <button
                onClick={() => {
                  if (window.confirm("Apakah Anda yakin ingin menyetel ulang data kembali ke contoh awal? Semua perubahan akan hilang.")) {
                    onResetData();
                  }
                }}
                className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-xl transition-colors duration-150 cursor-pointer font-medium"
                id="reset-sample-data-btn"
              >
                <RotateCcw size={12} />
                Setel Ulang Contoh
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari Nama, NIM, Kursi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 text-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs focus:outline-none"
                id="table-search-input"
              />
            </div>

            {/* Filter Status Kehadiran */}
            <select
              value={filterPresence}
              onChange={(e: any) => setFilterPresence(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
            >
              <option value="all">Semua Status (Hadir & Belum)</option>
              <option value="present">Sudah Hadir</option>
              <option value="absent">Belum Hadir</option>
            </select>

            {/* Filter Program Studi */}
            <select
              value={filterProdi}
              onChange={(e) => setFilterProdi(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
            >
              <option value="all">Semua Program Studi</option>
              {uniqueProdis.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Results count label */}
          <div className="text-[11px] text-slate-400 font-bold font-mono mb-3 uppercase tracking-wider">
            Menampilkan {filteredGraduates.length} dari {graduates.length} wisudawan
          </div>

          {/* Table list */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
            <table className="w-full text-left border-collapse" id="graduates-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">Kursi</th>
                  <th className="py-3 px-4">Wisudawan</th>
                  <th className="py-3 px-4">Prodi / Fakultas</th>
                  <th className="py-3 px-4 text-center">Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGraduates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400 text-xs font-sans">
                      Tidak ada data wisudawan cocok dengan pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  filteredGraduates.map((g) => (
                    <tr
                      key={g.id}
                      className={`hover:bg-slate-50 transition-colors duration-100 ${
                        g.isPresent ? "bg-emerald-50/20" : ""
                      }`}
                      id={`row-${g.id}`}
                    >
                      {/* Seat Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 text-xs">
                        {g.seatCode}
                      </td>

                      {/* Name & NIM */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 text-xs">{g.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{g.nim}</div>
                      </td>

                      {/* Prodi & Faculty */}
                      <td className="py-3.5 px-4 text-xs">
                        <div className="text-slate-700 font-semibold">{g.prodi}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{g.faculty || "Umum"}</div>
                      </td>

                      {/* Presence Checkbox Action */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center">
                          <button
                            id={`presence-toggle-btn-${g.id}`}
                            onClick={() => onTogglePresence(g.id, !g.isPresent)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-150 border
                              ${
                                g.isPresent
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                  : "bg-white border-slate-200 hover:border-slate-300 text-slate-300 hover:text-slate-400"
                              }
                            `}
                          >
                            <Check size={16} className={g.isPresent ? "stroke-[3]" : "opacity-0"} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Real-time Activity Sidebar */}
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-[585px]">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            Aktivitas Check-In Terbaru
          </h3>

          {/* Logs scrollable area */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar" id="activity-logs-list">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs py-20 leading-relaxed font-sans">
                <UserCheck size={28} className="text-slate-300 mb-2" />
                Belum ada aktivitas check-in terdeteksi hari ini.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs flex items-start gap-2.5 transition-all animate-fade-in"
                >
                  <div
                    className={`p-1.5 rounded-lg mt-0.5
                      ${
                        log.action === "check-in"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-rose-50 text-rose-600 border border-rose-100"
                      }
                    `}
                  >
                    {log.action === "check-in" ? <Check size={12} /> : <X size={12} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-800 truncate max-w-[120px]">{log.graduateName}</span>
                      <span className="text-[9px] font-mono text-slate-400 font-bold shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>Kursi {log.seatCode}</span>
                      <span className={log.action === "check-in" ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                        {log.action === "check-in" ? "Masuk" : "Batal"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
