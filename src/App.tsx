import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  CheckSquare, 
  Tv, 
  FileSpreadsheet, 
  Award, 
  Sparkles, 
  CloudLightning,
  RefreshCw,
  Settings,
  Upload,
  X,
  Trash2
} from "lucide-react";
import { Graduate, ActivityLog, AttendanceStats } from "./types";
import StatsDashboard from "./components/StatsDashboard";
import SeatingChart from "./components/SeatingChart";
import ReceptionistPanel from "./components/ReceptionistPanel";
import AVPanel from "./components/AVPanel";
import GoogleSheetsSync from "./components/GoogleSheetsSync";

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage access denied:", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage write denied:", e);
    }
  }
};

export default function App() {
  const [graduates, setGraduates] = useState<Graduate[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<"tamu" | "av" | "sync">(() => {
    return (safeStorage.getItem("active_tab") as "tamu" | "av" | "sync") || "tamu";
  });
  const [syncMethod, setSyncMethod] = useState<"sse" | "polling" | "none">("sse");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync activeTab to localStorage
  useEffect(() => {
    safeStorage.setItem("active_tab", activeTab);
  }, [activeTab]);

  // Customized branding states
  const [universityName, setUniversityName] = useState(() => {
    return safeStorage.getItem("university_name") || "Institut Teknologi Gamalama";
  });
  const [campusLogo, setCampusLogo] = useState(() => {
    return safeStorage.getItem("campus_logo") || "";
  });

  // Modal temporary states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempUniName, setTempUniName] = useState(universityName);
  const [tempLogo, setTempLogo] = useState(campusLogo);
  const [dragActive, setDragActive] = useState(false);

  const handleOpenSettings = () => {
    setTempUniName(universityName);
    setTempLogo(campusLogo);
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    setUniversityName(tempUniName);
    setCampusLogo(tempLogo);
    safeStorage.setItem("university_name", tempUniName);
    safeStorage.setItem("campus_logo", tempLogo);
    setIsSettingsOpen(false);
  };

  const handleLogoFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Harap pilih berkas gambar (PNG atau JPG).");
      return;
    }
    // Limit to ~2MB for localStorage safety
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran gambar terlalu besar. Maksimal adalah 2MB agar dapat disimpan dengan aman.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setTempLogo(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoFile(e.dataTransfer.files[0]);
    }
  };

  // Calculate statistics from current state
  const stats = useMemo<AttendanceStats>(() => {
    const total = graduates.length;
    const present = graduates.filter((g) => g.isPresent).length;
    const absent = total - present;
    const percentage = total > 0 ? (present / total) * 100 : 0;
    return { total, present, absent, percentage };
  }, [graduates]);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [graduatesRes, logsRes] = await Promise.all([
        fetch("/api/graduates"),
        fetch("/api/logs")
      ]);

      if (graduatesRes.ok) {
        const gradsData = await graduatesRes.json();
        setGraduates(gradsData);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }
    } catch (err) {
      console.error("Gagal mengambil data dari server:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Sync state in real-time
  useEffect(() => {
    fetchData();

    // 1. Establish SSE Connection (Server-Sent Events) for instant real-time synchronization
    let eventSource: EventSource | null = null;
    
    try {
      eventSource = new EventSource("/api/live");
      setSyncMethod("sse");

      eventSource.addEventListener("init", (event: any) => {
        const data = JSON.parse(event.data);
        setGraduates(data.graduates);
        setLogs(data.logs);
      });

      eventSource.addEventListener("presence_update", (event: any) => {
        const data = JSON.parse(event.data);
        const updatedGrad: Graduate = data.graduate;
        const newLog: ActivityLog = data.log;

        setGraduates((prev) =>
          prev.map((g) => (g.id === updatedGrad.id ? updatedGrad : g))
        );
        setLogs((prev) => [newLog, ...prev].slice(0, 50));
      });

      eventSource.addEventListener("bulk_update", (event: any) => {
        const data = JSON.parse(event.data);
        setGraduates(data.graduates);
        if (data.log) {
          setLogs((prev) => [data.log, ...prev].slice(0, 50));
        }
      });

      eventSource.onerror = (err) => {
        console.warn("SSE error, beralih ke fallback polling:", err);
        setSyncMethod("polling");
        if (eventSource) {
          eventSource.close();
        }
      };
    } catch (e) {
      console.warn("Gagal inisialisasi SSE, beralih ke polling:", e);
      setSyncMethod("polling");
    }

    // 2. Fallback Polling: Fetch changes every 3 seconds to ensure real-time sync works
    // even if SSE is blocked in certain browser/iframe environments
    const pollingInterval = setInterval(() => {
      // Only poll if we are in polling mode
      if (syncMethod === "polling" || !eventSource || eventSource.readyState === EventSource.CLOSED) {
        fetchData();
      }
    }, 3000);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(pollingInterval);
    };
  }, [fetchData, syncMethod]);

  // Toggle graduate presence state (Check-in / Check-out)
  const handleTogglePresence = async (id: string, isPresent: boolean) => {
    // Optimistic UI updates
    setGraduates((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          return {
            ...g,
            isPresent,
            checkedInAt: isPresent ? new Date().toISOString() : undefined,
          };
        }
        return g;
      })
    );

    try {
      const response = await fetch(`/api/graduates/${id}/presence`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPresent }),
      });

      if (!response.ok) {
        throw new Error("Gagal memperbarui kehadiran di server.");
      }
    } catch (err) {
      console.error(err);
      // Revert on error
      fetchData();
    }
  };

  // Bulk import graduates (CSV or Google Sheets)
  const handleBulkImport = async (importedList: Graduate[]) => {
    try {
      const response = await fetch("/api/graduates/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ list: importedList }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengimpor data ke server.");
      }

      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengimpor data wisudawan.");
    }
  };

  // Reset database back to default template
  const handleResetData = async () => {
    try {
      const response = await fetch("/api/reset", {
        method: "POST",
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Gagal mereset data:", err);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 flex flex-col font-sans" id="app-root">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo Brand */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white border border-slate-200/80 rounded-2xl text-blue-600 shadow-md w-11 h-11 flex items-center justify-center overflow-hidden shrink-0">
                {campusLogo ? (
                  <img src={campusLogo} alt="Logo Kampus" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Award size={22} className="stroke-[2.5]" />
                )}
              </div>
              <div>
                <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 block leading-tight">
                  Sistem Kehadiran Wisuda
                </span>
                <span className="text-[10px] font-mono font-bold text-blue-600 block uppercase tracking-wider flex items-center gap-1">
                  <span className="truncate max-w-[150px] sm:max-w-[280px]">{universityName}</span>
                  <button 
                    onClick={handleOpenSettings}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors inline-flex items-center cursor-pointer"
                    title="Atur Logo & Kampus"
                  >
                    <Settings size={12} />
                  </button>
                </span>
              </div>
            </div>

            {/* Menu Tabs */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 p-1.5 rounded-2xl">
              {/* Tab Meja Tamu */}
              <button
                id="tab-btn-tamu"
                onClick={() => setActiveTab("tamu")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer
                  ${
                    activeTab === "tamu"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }
                `}
              >
                <CheckSquare size={14} />
                <span className="hidden sm:inline">Meja Penerimaan</span> Tamu
              </button>

              {/* Tab Layar AV */}
              <button
                id="tab-btn-av"
                onClick={() => setActiveTab("av")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer
                  ${
                    activeTab === "av"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }
                `}
              >
                <Tv size={14} />
                <span className="hidden sm:inline">Layar Proyeksi</span> AV
              </button>

              {/* Tab Google Sheets Sync */}
              <button
                id="tab-btn-sync"
                onClick={() => setActiveTab("sync")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer
                  ${
                    activeTab === "sync"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }
                `}
              >
                <FileSpreadsheet size={14} />
                <span className="hidden sm:inline">Google Sheets</span> / CSV
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Render normal pages (Tamu or Sync) with shared dashboard */}
        {activeTab !== "av" && (
          <>
            {/* Header Title with Sync indicators */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  {activeTab === "tamu" ? "Panel Registrasi Tamu" : "Manajemen Data Wisudawan"}
                  <Sparkles className="text-blue-600 shrink-0" size={18} />
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {activeTab === "tamu" 
                    ? "Cari nama wisudawan dan tandai kehadiran secara instan untuk memperbarui layar panggung utama."
                    : "Gunakan Google Sheets publik atau file CSV lokal untuk mengunggah atau mengunduh basis data wisudawan."
                  }
                </p>
              </div>

              {/* Server Sync status indicator */}
              <div className="flex items-center gap-3 self-start sm:self-center">
                {/* Manual Force Sync Button */}
                <button
                  onClick={fetchData}
                  disabled={isRefreshing}
                  className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl transition-all duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs font-bold shadow-sm"
                  title="Segarkan data dari server"
                >
                  <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
                  <span>Segarkan</span>
                </button>

                <div className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-mono font-bold text-slate-600 flex items-center gap-1.5 shadow-sm">
                  <CloudLightning size={12} className={syncMethod === "sse" ? "text-emerald-500" : "text-amber-500"} />
                  <span>REAL-TIME:</span>
                  <span className={syncMethod === "sse" ? "text-emerald-600" : "text-amber-600"}>
                    {syncMethod === "sse" ? "SSE AKTIF" : "POLLING (3d)"}
                  </span>
                </div>
              </div>
            </div>

            {/* General Central Statistics Dashboard */}
            <StatsDashboard stats={stats} />

            {/* Tab Views */}
            {activeTab === "tamu" && (
              <div className="space-y-6">
                {/* Seating Chart visual board */}
                <SeatingChart graduates={graduates} onTogglePresence={handleTogglePresence} interactive={true} />

                {/* Receptionist register & logs */}
                <ReceptionistPanel 
                  graduates={graduates} 
                  onTogglePresence={handleTogglePresence}
                  logs={logs}
                  onResetData={handleResetData}
                />
              </div>
            )}

            {activeTab === "sync" && (
              <GoogleSheetsSync onImport={handleBulkImport} graduates={graduates} />
            )}
          </>
        )}

        {/* Immersive Projections Screen Panel for AV Team */}
        {activeTab === "av" && (
          <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-4 sm:-my-6 lg:-my-8">
            <AVPanel 
              graduates={graduates} 
              logs={logs} 
              universityName={universityName}
              campusLogo={campusLogo}
            />
          </div>
        )}
      </main>

      {/* Footer Info bar */}
      {activeTab !== "av" && (
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400 font-medium">
          © 2026 Panitia Wisuda • Protokol & IT Support • {universityName} • Real-time Sync Active
        </footer>
      )}

      {/* Brand & Logo Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-slate-800">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-950 font-sans flex items-center gap-2">
                <Settings className="text-blue-600" size={20} />
                Identitas & Logo Kampus
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kustomisasi nama universitas dan logo yang tampil di seluruh panel aplikasi dan layar proyeksi AV.
              </p>
            </div>

            <div className="space-y-4">
              {/* University Name Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Nama Universitas / Institusi
                </label>
                <input
                  type="text"
                  value={tempUniName}
                  onChange={(e) => setTempUniName(e.target.value)}
                  placeholder="Masukkan nama universitas"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                />
              </div>

              {/* Logo File Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Logo Kampus
                </label>
                
                {/* Drag and drop area */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-3 relative
                    ${
                      dragActive
                        ? "border-blue-500 bg-blue-50/50"
                        : "border-slate-200 hover:border-blue-400 bg-slate-50/50"
                    }
                  `}
                >
                  {tempLogo ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-20 h-20 bg-white rounded-2xl border border-slate-200 p-2 overflow-hidden flex items-center justify-center shadow-sm">
                        <img src={tempLogo} alt="Pratinjau Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setTempLogo("")}
                        className="text-xs text-rose-500 font-bold hover:text-rose-600 flex items-center gap-1 cursor-pointer bg-rose-50 px-2.5 py-1 rounded-lg"
                      >
                        <Trash2 size={12} />
                        Hapus Logo
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600">
                        <Upload size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Seret & taruh berkas gambar di sini</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Atau klik untuk memilih (PNG, JPG maks 2MB)</p>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleLogoFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    style={{ display: tempLogo ? "none" : "block" }}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setTempUniName("Institut Teknologi Gamalama");
                  setTempLogo("");
                }}
                className="px-4 py-2.5 text-xs text-slate-500 hover:text-slate-700 font-bold hover:bg-slate-50 rounded-xl transition-colors cursor-pointer mr-auto"
              >
                Reset Default
              </button>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2.5 text-xs text-white bg-blue-600 hover:bg-blue-500 font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
