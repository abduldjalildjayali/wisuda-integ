import React, { useState, useMemo } from "react";
import { Graduate } from "../types";
import { Search, Info, CheckCircle2, XCircle } from "lucide-react";

interface SeatingChartProps {
  graduates: Graduate[];
  onTogglePresence?: (id: string, isPresent: boolean) => void;
  interactive?: boolean; // receptionist vs screen mode
}

export default function SeatingChart({ graduates, onTogglePresence, interactive = true }: SeatingChartProps) {
  const [selectedSeat, setSelectedSeat] = useState<Graduate | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<Graduate | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const handleMouseEnter = (grad: Graduate, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
    setHoveredSeat(grad);
  };

  const handleMouseLeave = () => {
    setHoveredSeat(null);
  };

  // Map graduates by their parsed seat number for easy O(1) lookups
  const seatMap = useMemo(() => {
    const map: Record<number, Graduate> = {};
    graduates.forEach((grad) => {
      const clean = grad.seatCode.trim();
      const num = parseInt(clean, 10);
      if (!isNaN(num)) {
        map[num] = grad;
      }
    });
    return map;
  }, [graduates]);

  // Determine the maximum seat number to dynamically draw extra rows for the left section
  const maxSeatNum = useMemo(() => {
    let max = 65; // default minimum
    graduates.forEach((g) => {
      const num = parseInt(g.seatCode, 10);
      if (!isNaN(num) && num > max) {
        max = num;
      }
    });
    return max;
  }, [graduates]);

  // Generate left section rows (seats >= 28)
  const leftRows = useMemo(() => {
    const rows: (number | null)[][] = [];
    
    // Row 1 (Blue VIP/Cumlaude): [06, null, 05, null, 04] from left to right (Col 5, 4, 3, 2, 1)
    rows.push([6, null, 5, null, 4]);
    
    // Row 2 and onwards are Yellow, starting from 28
    let currentSeat = 28;
    while (currentSeat <= maxSeatNum) {
      const rowSeats: (number | null)[] = [];
      // Col 5, 4, 3, 2, 1 from left to right (decremental offset so currentSeat is far right/Col 1)
      for (let c = 4; c >= 0; c--) {
        const seatNum = currentSeat + c;
        if (seatNum <= maxSeatNum) {
          rowSeats.push(seatNum);
        } else {
          rowSeats.push(null);
        }
      }
      rows.push(rowSeats);
      currentSeat += 5;
    }
    return rows;
  }, [maxSeatNum]);

  // Fixed Right section rows (seats 1-3 VIP Blue, and 7-27 Red)
  const rightRows: (number | null)[][] = [
    [3, null, 2, null, 1], // Row 1 (Blue VIP/Cumlaude)
    [11, 10, 9, 8, 7],     // Row 2 (Red Teknik)
    [16, 15, 14, 13, 12],  // Row 3 (Red Teknik)
    [21, 20, 19, 18, 17],  // Row 4 (Red Teknik)
    [26, 25, 24, 23, 22],  // Row 5 (Red Teknik)
    [null, null, null, null, 27] // Row 6 (Red Teknik, 27 at far right Col 1)
  ];

  // Generate Parent row arrays (5 items per row, 13 rows total)
  const parentRows = useMemo(() => {
    const rows: number[][] = [];
    for (let r = 0; r < 13; r++) {
      const rowSeats: number[] = [];
      for (let c = 1; c <= 5; c++) {
        rowSeats.push(r * 5 + c);
      }
      rows.push(rowSeats);
    }
    return rows;
  }, []);

  const handleSeatClick = (grad: Graduate) => {
    setSelectedSeat(grad);
  };

  const renderParentPair = (seatNum: number) => {
    const grad = seatMap[seatNum];
    const isPresent = grad?.isPresent || false;
    const paddedNum = seatNum.toString().padStart(2, "0");
    
    return (
      <div key={`parent-pair-${seatNum}`} className="flex flex-col items-center gap-1 p-1 bg-slate-50 border border-slate-200/60 rounded-xl shadow-xs shrink-0 w-14">
        <span className={`text-[9px] font-mono font-black ${isPresent ? "text-emerald-600 font-extrabold" : "text-slate-400"}`}>
          {paddedNum}
        </span>
        <div className="flex gap-1 justify-center">
          {/* Father seat */}
          <div 
            className={`w-3.5 h-3.5 rounded-md transition-all duration-300 border ${
              isPresent 
                ? "bg-emerald-500 border-emerald-400 ring-2 ring-emerald-400/30 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" 
                : "bg-slate-700 border-slate-600"
            }`}
            title={`Kursi Orang Tua Ayah ${paddedNum} (${isPresent ? "Hadir" : "Belum Hadir"})`}
          />
          {/* Mother seat */}
          <div 
            className={`w-3.5 h-3.5 rounded-md transition-all duration-300 border ${
              isPresent 
                ? "bg-emerald-500 border-emerald-400 ring-2 ring-emerald-400/30 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" 
                : "bg-slate-700 border-slate-600"
            }`}
            title={`Kursi Orang Tua Ibu ${paddedNum} (${isPresent ? "Hadir" : "Belum Hadir"})`}
          />
        </div>
      </div>
    );
  };

  const renderParentRow = (rowSeats: number[]) => {
    return (
      <div className="flex items-center gap-1.5">
        {/* Col 1 */}
        {renderParentPair(rowSeats[0])}
        
        {/* Vertical Aisle 1 */}
        <div className="w-1 self-stretch bg-slate-200/50 rounded-full" />
        
        {/* Cols 2 & 3 */}
        <div className="flex gap-1.5">
          {renderParentPair(rowSeats[1])}
          {renderParentPair(rowSeats[2])}
        </div>
        
        {/* Vertical Aisle 2 */}
        <div className="w-1 self-stretch bg-slate-200/50 rounded-full" />
        
        {/* Cols 4 & 5 */}
        <div className="flex gap-1.5">
          {renderParentPair(rowSeats[3])}
          {renderParentPair(rowSeats[4])}
        </div>
      </div>
    );
  };

  const renderSeat = (seatNum: number | null, section: "left" | "right") => {
    if (seatNum === null) {
      return <div key={Math.random()} className="h-11 w-11 shrink-0" />;
    }

    const grad = seatMap[seatNum];
    const paddedSeatCode = seatNum.toString().padStart(3, "0");

    // Determine seat theme color
    let type: "blue" | "red" | "yellow" = "yellow";
    if (seatNum >= 1 && seatNum <= 6) {
      type = "blue";
    } else if (seatNum >= 7 && seatNum <= 27) {
      type = "red";
    }

    if (!grad) {
      // Empty physical seat with matching outline color
      let emptyStyle = "";
      if (type === "blue") {
        emptyStyle = "border-indigo-200 bg-indigo-50/10 text-indigo-400";
      } else if (type === "red") {
        emptyStyle = "border-rose-200 bg-rose-50/10 text-rose-400";
      } else {
        emptyStyle = "border-amber-200 bg-amber-50/10 text-amber-400";
      }

      return (
        <div
          key={seatNum}
          className={`h-11 w-11 border border-dashed rounded-xl flex items-center justify-center text-[9px] font-mono font-semibold shrink-0 select-none ${emptyStyle}`}
          title={`Kursi ${paddedSeatCode} Kosong / Belum Terdaftar`}
        >
          {paddedSeatCode}
        </div>
      );
    }

    // Active button styles
    let seatStyle = "";
    if (grad.isPresent) {
      if (type === "blue") {
        seatStyle = "bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-500/30 hover:bg-indigo-500 scale-[1.05]";
      } else if (type === "red") {
        seatStyle = "bg-rose-600 border-rose-600 text-white ring-4 ring-rose-500/30 hover:bg-rose-500 scale-[1.05]";
      } else {
        seatStyle = "bg-amber-500 border-amber-500 text-white ring-4 ring-amber-500/30 hover:bg-amber-400 scale-[1.05]";
      }
    } else {
      if (type === "blue") {
        seatStyle = "bg-indigo-50/50 border border-indigo-400 text-indigo-800 hover:bg-indigo-100/50";
      } else if (type === "red") {
        seatStyle = "bg-rose-50/50 border border-rose-400 text-rose-800 hover:bg-rose-100/50";
      } else {
        seatStyle = "bg-amber-50/50 border border-amber-400 text-amber-800 hover:bg-amber-100/50";
      }
    }

    return (
      <button
        key={seatNum}
        onClick={() => handleSeatClick(grad)}
        onMouseEnter={(e) => handleMouseEnter(grad, e)}
        onMouseLeave={handleMouseLeave}
        className={`h-11 w-11 rounded-xl transition-all duration-200 relative flex flex-col items-center justify-center font-mono text-[9px] cursor-pointer shadow-sm shrink-0 border ${seatStyle}`}
        id={`seat-btn-${grad.id}`}
      >
        <span className="block font-bold leading-none">{paddedSeatCode}</span>
        {grad.isPresent && (
          <span className="text-[8px] font-sans font-bold truncate w-full px-0.5 text-center leading-none mt-0.5 text-white/95">
            {grad.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm w-full" id="seating-chart-container">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-sans flex flex-wrap items-center gap-2">
            Denah Kursi Wisudawan
            <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 font-bold font-mono rounded-full border border-blue-100">
              Panggung Depan ↑
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tata letak kursi sesuai nomor urut dimulai dari depan (Cumlaude) ke belakang.
          </p>
        </div>

        {/* Custom High-Fidelity Legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold uppercase text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-indigo-50 border border-indigo-400"></span>
            <span>VIP / Baris 1</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-rose-50 border border-rose-400"></span>
            <span>Kanan (Teknik)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-amber-50 border border-amber-400"></span>
            <span>Kiri (Informatika)</span>
          </div>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <span className="w-3.5 h-3.5 rounded bg-slate-700 ring-2 ring-slate-400/50"></span>
            <span>Hadir (Glow)</span>
          </div>
        </div>
      </div>

      {/* Seating Stage Visual Guide */}
      <div className="w-full bg-slate-900 text-white text-xs font-bold rounded-2xl py-3 text-center mb-8 font-mono tracking-[0.2em] uppercase shadow-md">
        === AREA PANGGUNG UTAMA / DEPAN ===
      </div>

      {/* Responsive Grid container with horizontal scrolling */}
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-[1050px] flex justify-center items-start gap-4 p-4 bg-slate-50/30 rounded-3xl border border-slate-100">
          
          {/* SISI ORANG TUA (Left Section) */}
          <div className="flex flex-col items-center">
            <div className="text-center mb-3">
              <span className="text-xs font-bold text-slate-800 font-sans tracking-wide uppercase px-3 py-1 bg-slate-100 border border-slate-200 rounded-full block">
                Orang Tua Wisudawan
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Pasangan Kursi (Sesuai No. Wisudawan)</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {parentRows.map((row, rIdx) => (
                <React.Fragment key={`parent-row-fragment-${rIdx}`}>
                  {renderParentRow(row)}
                  
                  {/* Gang Mendatar (Horizontal Aisle for Parents) */}
                  {rIdx === 4 && (
                    <div className="w-full flex items-center justify-center py-2 bg-slate-200/50 border border-slate-300/30 rounded-xl my-1 select-none">
                      <span className="text-[8px] font-bold text-slate-500 font-mono tracking-[0.2em] uppercase">
                        LORONG
                      </span>
                    </div>
                  )}
                  {rIdx === 9 && (
                    <div className="w-full flex items-center justify-center py-2 bg-slate-200/50 border border-slate-300/30 rounded-xl my-1 select-none">
                      <span className="text-[8px] font-bold text-slate-500 font-mono tracking-[0.2em] uppercase">
                        LORONG
                      </span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* LORONG UTAMA (Divider between Parents & Students) */}
          <div className="w-10 bg-slate-200/60 border-x border-slate-300/40 rounded-2xl py-8 shrink-0 flex flex-col items-center justify-stretch self-stretch relative min-h-[420px] shadow-inner select-none">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black text-slate-500 font-mono tracking-[0.4em] uppercase rotate-90 whitespace-nowrap">
                LORONG UTAMA
              </span>
            </div>
          </div>

          {/* SISI KIRI (Informatika - Yellow Block) */}
          <div className="flex flex-col items-center">
            <div className="text-center mb-3">
              <span className="text-xs font-bold text-amber-800 font-sans tracking-wide uppercase px-3 py-1 bg-amber-50 border border-amber-200/50 rounded-full block">
                Sisi Kiri (Informatika)
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Baris 2+ (NPM 028 seterusnya)</span>
            </div>
            
            <div className="flex flex-col gap-2.5">
              {leftRows.map((row, rIdx) => (
                <React.Fragment key={`left-row-fragment-${rIdx}`}>
                  <div className="grid grid-cols-5 gap-2.5 p-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
                    {row.map((seatNum) => renderSeat(seatNum, "left"))}
                  </div>
                  
                  {/* Gang Mendatar (Horizontal Aisle) after Yellow Row 4 (leftRows index 4) */}
                  {rIdx === 4 && (
                    <div className="w-full flex items-center justify-center py-2 bg-slate-200/60 border border-slate-300/40 rounded-xl my-1 shadow-inner select-none">
                      <span className="text-[9px] font-bold text-slate-500 font-mono tracking-[0.25em] uppercase">
                        GANG MENDATAR
                      </span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* JALAN TENGAH (Central Aisle Divider) */}
          <div className="w-12 bg-slate-200/80 border-x border-slate-300/50 rounded-2xl py-8 shrink-0 flex flex-col items-center justify-stretch self-stretch relative min-h-[420px] shadow-inner select-none">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black text-slate-500 font-mono tracking-[0.4em] uppercase rotate-90 whitespace-nowrap">
                JALAN TENGAH
              </span>
            </div>
          </div>

          {/* SISI KANAN (Teknik - Red Block) */}
          <div className="flex flex-col items-center">
            <div className="text-center mb-3">
              <span className="text-xs font-bold text-rose-800 font-sans tracking-wide uppercase px-3 py-1 bg-rose-50 border border-rose-200/50 rounded-full block">
                Sisi Kanan (Teknik)
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Baris 2+ (NPM 007 - 027)</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {rightRows.map((row, rIdx) => (
                <div key={`right-row-${rIdx}`} className="grid grid-cols-5 gap-2.5 p-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
                  {row.map((seatNum) => renderSeat(seatNum, "right"))}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Seat Detail Modal / Panel (when a seat is clicked) */}
      {selectedSeat && (
        <div 
          id="seat-detail-modal"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-slate-800">
            <button
              onClick={() => setSelectedSeat(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center mt-2">
              {/* Avatar Indicator */}
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-4 border-2 shadow-sm
                  ${
                    selectedSeat.isPresent
                      ? "bg-emerald-500 border-emerald-500 text-white ring-4 ring-emerald-500/20"
                      : "bg-slate-100 border-slate-200 text-slate-600"
                  }
                `}
              >
                {selectedSeat.seatCode}
              </div>

              <h3 className="text-lg font-bold text-slate-950 font-sans text-center">{selectedSeat.name}</h3>
              <p className="text-xs font-mono text-blue-600 mt-1">NPM / NIM: {selectedSeat.nim}</p>

              <div className="w-full bg-slate-50 rounded-2xl p-4 mt-5 space-y-2.5 text-left text-xs border border-slate-200 max-h-[350px] overflow-y-auto">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-slate-500 font-medium shrink-0">Program Studi</span>
                  <span className="text-slate-800 font-bold text-right break-words">{selectedSeat.prodi}</span>
                </div>
                {selectedSeat.ipk && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">IPK / SKS</span>
                    <span className="text-slate-800 font-bold font-mono">{selectedSeat.ipk} ({selectedSeat.sks || "-"} SKS)</span>
                  </div>
                )}
                {(selectedSeat.ayah || selectedSeat.ibu) && (
                  <div className="flex justify-between items-start gap-4 pt-1.5 border-t border-slate-100">
                    <span className="text-slate-500 font-medium shrink-0">Orang Tua</span>
                    <span className="text-slate-800 font-bold text-right">
                      {selectedSeat.ayah && `Ayah: ${selectedSeat.ayah}`}
                      {selectedSeat.ayah && selectedSeat.ibu && <br />}
                      {selectedSeat.ibu && `Ibu: ${selectedSeat.ibu}`}
                    </span>
                  </div>
                )}
                {selectedSeat.judul && (
                  <div className="space-y-1 pt-1.5 border-t border-slate-100">
                    <span className="text-slate-500 font-medium block">Judul Tugas Akhir / Skripsi</span>
                    <p className="text-slate-800 font-semibold italic leading-relaxed text-[11px] bg-white p-2.5 rounded-xl border border-slate-200 break-words">{selectedSeat.judul}</p>
                  </div>
                )}
                {selectedSeat.pembimbing && (
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-slate-500 font-medium shrink-0">Pembimbing</span>
                    <span className="text-slate-800 font-bold text-right break-words">{selectedSeat.pembimbing}</span>
                  </div>
                )}
                {selectedSeat.noWa && (
                  <div className="flex justify-between pt-1.5 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">No. WhatsApp</span>
                    <span className="text-blue-600 font-bold font-mono">{selectedSeat.noWa}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Status Kehadiran</span>
                  <div className="flex items-center gap-1.5">
                    {selectedSeat.isPresent ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span className="text-emerald-500 font-bold font-mono">Hadir</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={14} className="text-rose-500" />
                        <span className="text-rose-500 font-bold font-mono">Belum Hadir</span>
                      </>
                    )}
                  </div>
                </div>
                {selectedSeat.isPresent && selectedSeat.checkedInAt && (
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>Waktu Hadir</span>
                    <span className="font-mono">{new Date(selectedSeat.checkedInAt).toLocaleTimeString("id-ID")}</span>
                  </div>
                )}
              </div>

              {/* If interactive (receptionist mode) we can toggle attendance */}
              {interactive && onTogglePresence && (
                <button
                  id="modal-toggle-attendance-btn"
                  onClick={() => {
                    onTogglePresence(selectedSeat.id, !selectedSeat.isPresent);
                    setSelectedSeat(prev => prev ? { ...prev, isPresent: !prev.isPresent, checkedInAt: !prev.isPresent ? new Date().toISOString() : undefined } : null);
                  }}
                  className={`w-full py-3 mt-6 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer shadow-sm
                    ${
                      selectedSeat.isPresent
                        ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200"
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    }
                  `}
                >
                  {selectedSeat.isPresent ? "Batalkan Kehadiran" : "Tandai Hadir (Check-In)"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Tooltip */}
      {hoveredSeat && (
        <div 
          style={{ 
            position: "fixed", 
            top: `${tooltipPos.top}px`, 
            left: `${tooltipPos.left}px`,
            transform: "translate(-50%, -100%)"
          }}
          className="bg-slate-900 text-white text-[11px] rounded-2xl p-4 shadow-2xl z-50 w-64 text-left leading-relaxed border border-slate-800 pointer-events-none animate-fade-in space-y-1"
        >
          <div className="font-bold font-sans text-blue-400 mb-0.5 truncate">{hoveredSeat.name}</div>
          <div className="text-slate-300 font-mono">NPM: {hoveredSeat.nim}</div>
          <div className="text-slate-300 truncate">Prodi: {hoveredSeat.prodi}</div>
          {hoveredSeat.ipk && (
            <div className="text-amber-400 font-mono">IPK: {hoveredSeat.ipk} ({hoveredSeat.sks || "-"} SKS)</div>
          )}
          <div className="text-blue-300 font-mono font-bold">Kursi: {hoveredSeat.seatCode}</div>
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-1.5">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                hoveredSeat.isPresent ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
              }`}
            ></span>
            <span className={hoveredSeat.isPresent ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
              {hoveredSeat.isPresent ? "Hadir" : "Belum Hadir"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
