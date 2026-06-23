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

  // Group graduates by Row and Seat Number
  const { rowKeys, colKeys, seatingGrid } = useMemo(() => {
    const grid: Record<string, Record<string, Graduate>> = {};
    const rows = new Set<string>();
    const cols = new Set<number>();

    graduates.forEach((grad) => {
      const cleanCode = grad.seatCode.trim();
      let row = "Misc";
      let colNum = 1;

      if (/^\d+$/.test(cleanCode)) {
        // Purely numeric, e.g. "001" or "12"
        const num = parseInt(cleanCode, 10);
        if (!isNaN(num) && num > 0) {
          row = `Baris ${Math.floor((num - 1) / 10) + 1}`;
          colNum = ((num - 1) % 10) + 1;
        }
      } else {
        // Alphanumeric, e.g. "A-01", "A01", "VIP-12"
        const parts = cleanCode.split("-");
        if (parts.length === 2) {
          row = parts[0];
          colNum = parseInt(parts[1], 10) || 1;
        } else {
          const match = cleanCode.match(/^([A-Za-z]+)(\d+)$/);
          if (match) {
            row = match[1].toUpperCase();
            colNum = parseInt(match[2], 10) || 1;
          } else {
            // Fallback
            row = "Misc";
            colNum = 1;
          }
        }
      }

      rows.add(row);
      cols.add(colNum);

      if (!grid[row]) grid[row] = {};
      grid[row][colNum] = grad;
    });

    const getRowScore = (rowName: string): number => {
      if (rowName.startsWith("Baris ")) {
        const numPart = parseInt(rowName.replace("Baris ", ""), 10);
        if (!isNaN(numPart)) return numPart;
      }
      return rowName.charCodeAt(0) + 1000;
    };

    const sortedRows = Array.from(rows).sort((a, b) => getRowScore(a) - getRowScore(b));
    const sortedCols = Array.from(cols).sort((a, b) => a - b);

    return {
      rowKeys: sortedRows,
      colKeys: sortedCols,
      seatingGrid: grid,
    };
  }, [graduates]);

  const handleSeatClick = (grad: Graduate) => {
    setSelectedSeat(grad);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm w-full" id="seating-chart-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-sans flex items-center gap-2">
            Denah Kursi Wisudawan
            <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 font-bold font-mono rounded-full border border-blue-100">
              Panggung Depan ↓
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Representasi denah kursi di dalam gedung wisuda secara real-time.</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-bold uppercase text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 shadow-sm"></span>
            <span>Hadir</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200"></span>
            <span>Belum Hadir</span>
          </div>
        </div>
      </div>

      {/* Seating Stage Visual Guide */}
      <div className="w-full bg-slate-900 text-white text-xs font-bold rounded-2xl py-3 text-center mb-8 font-mono tracking-[0.2em] uppercase shadow-md">
        === AREA PANGGUNG UTAMA / DEPAN ===
      </div>

      {/* Responsive Grid container with horizontal scrolling on small screens */}
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-[650px] flex flex-col gap-3">
          {rowKeys.map((row) => (
            <div key={row} className="flex items-center gap-2">
              {/* Row Label (Left) */}
              <div className="px-3 h-10 flex items-center justify-center bg-slate-100 text-slate-800 font-bold font-mono border border-slate-200 rounded-xl text-xs shadow-sm shrink-0 min-w-[70px]">
                {row}
              </div>

              {/* Seats in Row */}
              <div className="flex-1 grid grid-cols-10 gap-2 p-2 bg-slate-50/50 rounded-2xl border border-slate-100">
                {colKeys.map((col) => {
                  const grad = seatingGrid[row]?.[col];
                  const rowNum = row.startsWith("Baris ") ? parseInt(row.replace("Baris ", ""), 10) : NaN;
                  const calculatedSeatCode = !isNaN(rowNum) 
                    ? ((rowNum - 1) * 10 + col).toString().padStart(3, "0")
                    : `${row}-${col.toString().padStart(2, "0")}`;

                  if (!grad) {
                    // Empty seat
                    return (
                      <div
                        key={col}
                        className="h-10 border border-dashed border-slate-200 bg-slate-100/50 rounded-xl flex items-center justify-center text-[10px] text-slate-400 font-mono font-semibold"
                        title={`Kursi ${calculatedSeatCode} Kosong`}
                      >
                        {calculatedSeatCode}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={col}
                      onClick={() => handleSeatClick(grad)}
                      onMouseEnter={(e) => handleMouseEnter(grad, e)}
                      onMouseLeave={handleMouseLeave}
                      className={`h-10 rounded-xl transition-all duration-200 relative flex flex-col items-center justify-center font-mono text-xs cursor-pointer shadow-sm
                        ${
                          grad.isPresent
                            ? "bg-emerald-500 text-white font-bold ring-2 ring-emerald-500/20 hover:bg-emerald-400 scale-[1.02]"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        }
                      `}
                      id={`seat-btn-${grad.id}`}
                    >
                      {/* Seat Code */}
                      <span className={`text-[10px] block font-semibold ${grad.isPresent ? "text-white/80" : "text-slate-400"}`}>
                        {grad.seatCode}
                      </span>
                      {/* Initials of Graduate if present */}
                      <span className="text-[10px] font-sans truncate w-full px-1 text-center font-bold">
                        {grad.isPresent
                          ? grad.name.split(" ").slice(0, 2).map((n) => n[0]).join("")
                          : ""}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Row Label (Right) */}
              <div className="px-3 h-10 flex items-center justify-center bg-slate-100 text-slate-800 font-bold font-mono border border-slate-200 rounded-xl text-xs shadow-sm shrink-0 min-w-[70px]">
                {row}
              </div>
            </div>
          ))}
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
