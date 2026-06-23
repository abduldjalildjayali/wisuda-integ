import React, { useState, useEffect } from "react";
import { Award, Sparkles, Tv, Volume2, ShieldCheck, Heart, X } from "lucide-react";
import { Graduate, ActivityLog } from "../types";
import SeatingChart from "./SeatingChart";

interface AVPanelProps {
  graduates: Graduate[];
  logs: ActivityLog[];
  universityName?: string;
  campusLogo?: string;
}

export default function AVPanel({ graduates, logs, universityName = "Institut Teknologi Gamalama", campusLogo }: AVPanelProps) {
  const [lastAnnouncedLog, setLastAnnouncedLog] = useState<ActivityLog | null>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [tickerLogs, setTickerLogs] = useState<ActivityLog[]>([]);

  // Count stats
  const stats = React.useMemo(() => {
    const total = graduates.length;
    const present = graduates.filter((g) => g.isPresent).length;
    const absent = total - present;
    const percentage = total > 0 ? (present / total) * 100 : 0;
    return { total, present, absent, percentage };
  }, [graduates]);

  // Handle live announcement of newly arrived graduates
  useEffect(() => {
    if (logs.length > 0) {
      const latestLog = logs[0];
      // Only announce "check-in" actions that are brand new (less than 10 seconds old)
      const logTime = new Date(latestLog.timestamp).getTime();
      const now = new Date().getTime();
      
      if (
        latestLog.action === "check-in" && 
        (!lastAnnouncedLog || lastAnnouncedLog.id !== latestLog.id) &&
        (now - logTime < 10000) // within 10 seconds
      ) {
        setLastAnnouncedLog(latestLog);
        setShowAnnouncement(true);
      }
    }
  }, [logs, lastAnnouncedLog]);

  // Handle auto-dismiss of announcement after 2 seconds
  useEffect(() => {
    if (showAnnouncement) {
      const timer = setTimeout(() => {
        setShowAnnouncement(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showAnnouncement]);

  // Keep track of the last 10 check-ins for the bottom scrolling ticker
  useEffect(() => {
    const checkInsOnly = logs.filter(log => log.action === "check-in").slice(0, 10);
    setTickerLogs(checkInsOnly);
  }, [logs]);

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 p-6 relative flex flex-col gap-6" id="av-panel-container">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white border border-slate-200/80 rounded-2xl text-blue-600 w-14 h-14 flex items-center justify-center overflow-hidden shrink-0">
            {campusLogo ? (
              <img src={campusLogo} alt="Logo Kampus" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Tv size={26} className="animate-pulse" />
            )}
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 font-sans leading-snug">
              LAYAR UTAMA MONITOR KEHADIRAN WISUDA
            </h1>
            <p className="text-xs text-blue-600 font-mono font-bold tracking-wider uppercase">
              {universityName} • LIVE SYNC AKTIF
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-xs font-mono font-bold">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          LIVE SYNC AKTIF
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 items-start">
        {/* Left Side: Stats (Big readable numbers) */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-blue-600 rounded-3xl p-6 shadow-md flex flex-col items-center justify-center text-center text-white relative overflow-hidden transition-transform hover:scale-[1.01] duration-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
            
            <Award className="text-blue-200 mb-2 animate-bounce" size={40} />
            <h3 className="text-xs font-mono font-bold text-blue-100 uppercase tracking-widest">TOTAL WISUDAWAN</h3>
            <span className="text-6xl font-black mt-2 font-sans tracking-tight">{stats.total}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col items-center justify-center text-center">
              <h3 className="text-[10px] font-mono text-emerald-600 uppercase tracking-wider font-bold">SUDAH HADIR</h3>
              <span className="text-4xl font-black text-emerald-500 mt-1 font-sans">{stats.present}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col items-center justify-center text-center">
              <h3 className="text-[10px] font-mono text-rose-600 uppercase tracking-wider font-bold">BELUM HADIR</h3>
              <span className="text-4xl font-black text-rose-500 mt-1 font-sans">{stats.absent}</span>
            </div>
          </div>

          {/* Progress bar bento card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-slate-500 font-bold">Rasio Pengisian Kursi</span>
              <span className="text-blue-600 font-black">{stats.percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden border border-slate-200 p-0.5">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000 shadow-sm"
                style={{ width: `${stats.percentage}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 leading-relaxed text-center font-sans font-medium">
              Harap wisudawan segera menempati nomor kursi yang telah disediakan demi kelancaran prosesi wisuda.
            </p>
          </div>

          {/* Tips for AV projector */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 text-xs text-slate-500 space-y-2 leading-relaxed shadow-sm">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 font-mono mb-1">
              <Sparkles size={14} className="text-blue-600" />
              TIPS PROYEKSI AV:
            </div>
            <p>• Tekan tombol <kbd className="bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold">F11</kbd> pada keyboard Anda untuk beralih ke layar penuh.</p>
            <p>• Layar ini akan secara dinamis menyala hijau di kursi bersangkutan setiap kali panitia penerima tamu melakukan check-in kehadiran.</p>
            <p>• Tampilan interaktif ini dioptimalkan untuk visibilitas penonton dari jarak jauh.</p>
          </div>
        </div>

        {/* Right Side: Seating Grid Chart (Visual Seat map) */}
        <div className="xl:col-span-3">
          <SeatingChart graduates={graduates} interactive={false} />
        </div>
      </div>

      {/* Bottom Scrolling Live Ticker */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-white to-transparent w-20 z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-white to-transparent w-20 z-10"></div>
        
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white text-[10px] font-mono font-bold px-3 py-1.5 rounded-xl shrink-0 flex items-center gap-1.5 z-20 shadow-sm">
            <Volume2 size={12} />
            CHECK-IN TERBARU
          </div>

          {/* Marquee effect wrapper */}
          <div className="flex-1 overflow-hidden relative w-full">
            {tickerLogs.length === 0 ? (
              <span className="text-xs text-slate-400 font-mono font-bold">Menunggu check-in wisudawan di meja registrasi...</span>
            ) : (
              <div className="flex gap-8 items-center animate-marquee whitespace-nowrap">
                {tickerLogs.map((log) => (
                  <span 
                    key={log.id} 
                    className="text-xs font-mono text-emerald-600 inline-flex items-center gap-1.5 shrink-0 font-bold"
                  >
                    <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                    <strong>{log.graduateName}</strong> (Kursi {log.seatCode})
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CELEBRATORY FULLSCREEN OVERLAY ALERT (Stunning dynamic check-in notification!) */}
      {showAnnouncement && lastAnnouncedLog && (
        <div 
          id="celebration-overlay"
          onClick={() => setShowAnnouncement(false)}
          className="fixed inset-0 bg-slate-950/95 flex items-center justify-center p-6 z-50 animate-fade-in backdrop-blur-md cursor-pointer"
        >
          {/* Sparkly decorative floating lights */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>

          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-amber-500/40 rounded-3xl p-10 max-w-2xl w-full shadow-2xl text-center relative border-double ring-8 ring-amber-500/10 animate-scale-up"
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowAnnouncement(false)}
              className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer border border-slate-700/50"
              title="Tutup"
            >
              <X size={18} />
            </button>
            
            {/* Top Badge Icons */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500 rounded-full blur-xl opacity-30 animate-ping"></div>
                <div className="p-5 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full text-slate-950 relative shadow-2xl w-24 h-24 flex items-center justify-center overflow-hidden">
                  {campusLogo ? (
                    <img src={campusLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <Award size={48} className="stroke-[2]" />
                  )}
                </div>
              </div>
            </div>

            <span className="text-xs font-mono text-amber-400 uppercase tracking-[0.25em] font-bold block mb-2">
              ✨ SELAMAT DATANG WISUDAWAN ✨
            </span>
            
            <h2 className="text-4xl font-extrabold text-white leading-tight font-sans tracking-tight mb-2">
              {lastAnnouncedLog.graduateName}
            </h2>

            {/* Sub details */}
            <p className="text-base text-slate-400 font-mono mb-6">
              NIM: {lastAnnouncedLog.graduateId}
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 text-left mb-6 font-sans">
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">NO. KURSI</span>
                <span className="text-2xl font-black text-amber-400 font-mono">{lastAnnouncedLog.seatCode}</span>
              </div>
              <div className="border-l border-slate-850 pl-4">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">STATUS</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                  <ShieldCheck size={14} />
                  Hadir & Check-In
                </span>
              </div>
            </div>

            <div className="flex justify-center items-center gap-1.5 text-xs text-slate-500 font-mono">
              <Heart size={12} className="text-rose-500 animate-pulse" />
              Dipersembahkan oleh Panitia AV & Meja Tamu
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
