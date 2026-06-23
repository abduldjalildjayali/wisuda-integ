import React, { useState } from "react";
import { Sheet, Upload, Download, Globe, HelpCircle, CheckCircle2, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { Graduate } from "../types";

interface GoogleSheetsSyncProps {
  onImport: (list: Graduate[]) => void;
  graduates: Graduate[];
}

export default function GoogleSheetsSync({ onImport, graduates }: GoogleSheetsSyncProps) {
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const [showGuide, setShowGuide] = useState(false);

  // Helper to extract spreadsheet ID from URL
  const extractSpreadsheetId = (url: string): string | null => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url.trim(); // Return match or fallback to trimmed input (if user entered ID directly)
  };

  // Import from published Google Sheets Link via /gviz/tq endpoint (gviz/tq?tqx=out:csv)
  const handleGoogleSheetsImport = async () => {
    if (!googleSheetUrl) {
      setStatus({ type: "error", message: "Harap masukkan URL Google Sheet atau Spreadsheet ID." });
      return;
    }

    const spreadsheetId = extractSpreadsheetId(googleSheetUrl);
    if (!spreadsheetId) {
      setStatus({ type: "error", message: "URL Google Sheets tidak valid." });
      return;
    }

    setIsLoading(true);
    setStatus({ type: null, message: "" });

    try {
      // Fetch public/shared Google Sheet as CSV
      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
      const response = await fetch(csvUrl);
      
      if (!response.ok) {
        throw new Error("Gagal mengambil data dari Google Sheets. Pastikan spreadsheet di-share 'Siapa saja yang memiliki link dapat melihat' (Anyone with link can view).");
      }

      const csvText = await response.text();
      parseCSVAndImport(csvText);
    } catch (error: any) {
      console.error(error);
      setStatus({
        type: "error",
        message: error.message || "Gagal mengimpor data. Pastikan pengaturan share sudah benar.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Parse CSV helper
  const parseCSVAndImport = (csvText: string) => {
    const lines = csvText.split(/\r?\n/);
    if (lines.length < 2) {
      throw new Error("File CSV kosong atau tidak memiliki data yang cukup.");
    }

    // Auto-detect delimiter: comma (,) or semicolon (;)
    const firstLine = lines[0] || "";
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const delimiter = semicolonCount > commaCount ? ";" : ",";

    // Parse lines into cells
    const rows = lines.map(line => {
      const cells: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          cells.push(current.trim().replace(/^"|"$/g, ''));
          current = "";
        } else {
          current += char;
        }
      }
      cells.push(current.trim().replace(/^"|"$/g, ''));
      return cells;
    }).filter(row => row.some(cell => cell.length > 0)); // Filter empty rows

    // Find headers and map indices
    const headers = rows[0].map(h => h.toLowerCase().trim());
    
    // Support Indonesian or English headers
    const findExactHeaderIdx = (names: string[]) => {
      return headers.findIndex(h => names.some(name => h === name.toLowerCase()));
    };

    const findHeaderIdx = (possibleNames: string[]) => {
      return headers.findIndex(h => possibleNames.some(name => h.includes(name)));
    };

    // Try exact matches first, then partial matches
    let nimIdx = findExactHeaderIdx(["npm", "nim"]);
    if (nimIdx === -1) nimIdx = findHeaderIdx(["nim", "id", "identitas", "npm"]);

    let namaIdx = findExactHeaderIdx(["nama"]);
    if (namaIdx === -1) namaIdx = findHeaderIdx(["nama", "name", "wisudawan"]);

    let gelarIdx = findExactHeaderIdx(["nama gelar", "gelar"]);
    if (gelarIdx === -1) gelarIdx = findHeaderIdx(["gelar", "degree"]);

    let prodiIdx = findExactHeaderIdx(["prodi"]);
    if (prodiIdx === -1) prodiIdx = findHeaderIdx(["prodi", "program studi", "major", "jurusan"]);

    let facultyIdx = findExactHeaderIdx(["fakultas"]);
    if (facultyIdx === -1) facultyIdx = findHeaderIdx(["fakultas", "faculty", "departemen"]);

    let kursiIdx = findExactHeaderIdx(["no", "kursi"]);
    if (kursiIdx === -1) kursiIdx = findHeaderIdx(["kursi", "seat", "seating", "kode kursi", "nomor kursi", "no"]);

    let hadirIdx = findExactHeaderIdx(["hadir"]);
    if (hadirIdx === -1) hadirIdx = findHeaderIdx(["hadir", "status", "present", "kehadiran"]);

    // Extra custom fields
    const ipkIdx = findExactHeaderIdx(["ipk", "gpa"]);
    const sksIdx = findExactHeaderIdx(["total sks", "sks"]);
    const ayahIdx = findExactHeaderIdx(["ayah", "father", "bapak"]);
    const ibuIdx = findExactHeaderIdx(["ibu", "mother"]);
    const judulIdx = findExactHeaderIdx(["judul", "skripsi", "tesis", "title"]);
    const pembimbingIdx = findExactHeaderIdx(["pembimbing utama", "pembimbing", "advisor"]);
    const fotoIdx = findExactHeaderIdx(["foto", "photo", "gambar", "image"]);
    const noWaIdx = findExactHeaderIdx(["no wa", "whatsapp", "wa", "telepon", "phone"]);

    if (nimIdx === -1 || namaIdx === -1 || kursiIdx === -1) {
      throw new Error(`Format kolom salah! Pastikan sheet memiliki header yang sesuai. Header yang terdeteksi: ${rows[0].join(", ")}. Minimal harus ada kolom: 'NPM/NIM', 'NAMA', dan 'NO/KURSI'.`);
    }

    const importedGraduates: Graduate[] = [];

    // Parse rows from index 1 (skip header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length <= Math.max(nimIdx, namaIdx, kursiIdx)) continue;

      const nim = row[nimIdx]?.trim() || "";
      let rawName = row[namaIdx]?.trim() || "";
      let rawGelar = (gelarIdx !== -1 && gelarIdx !== namaIdx) ? row[gelarIdx]?.trim() : "";
      
      if (!rawGelar && rawName.includes(",")) {
        const parts = rawName.split(",");
        rawName = parts[0]?.trim() || "";
        rawGelar = parts.slice(1).join(",").trim();
      }

      // Concat name and degree for display if needed, or keep separate
      const name = rawGelar && !rawName.includes(rawGelar) ? `${rawName}, ${rawGelar}` : rawName;

      let seatRaw = row[kursiIdx]?.trim() || "";
      let seatCode = "";
      if (/^\d+$/.test(seatRaw)) {
        seatCode = parseInt(seatRaw, 10).toString().padStart(3, "0");
      } else {
        seatCode = seatRaw.toUpperCase();
      }

      const prodi = prodiIdx !== -1 ? row[prodiIdx]?.trim() : "Umum";
      const faculty = (() => {
        const rawFac = facultyIdx !== -1 ? row[facultyIdx]?.trim() : "";
        const facUpper = rawFac.toUpperCase();
        const prodUpper = prodi.toUpperCase();
        if (facUpper.includes("INFORMATIK")) {
          return "Fakultas Informatika";
        }
        if (facUpper.includes("TEKNIK") || facUpper.includes("ITEKNIK")) {
          return "Fakultas Teknik";
        }
        if (prodUpper.includes("MANAJEMEN") || prodUpper.includes("INFORMATIKA")) {
          return "Fakultas Informatika";
        }
        if (prodUpper.includes("KOMPUTER") || prodUpper.includes("TEKNIK")) {
          return "Fakultas Teknik";
        }
        return rawFac || "Fakultas Informatika";
      })();
      
      let isPresent = false;
      if (hadirIdx !== -1 && row[hadirIdx]) {
        const val = row[hadirIdx].toLowerCase().trim();
        isPresent = val === "true" || val === "1" || val === "hadir" || val === "yes" || val === "y";
      }

      const ipk = ipkIdx !== -1 ? row[ipkIdx]?.trim() : undefined;
      const sks = sksIdx !== -1 ? row[sksIdx]?.trim() : undefined;
      const ayah = ayahIdx !== -1 ? row[ayahIdx]?.trim() : undefined;
      const ibu = ibuIdx !== -1 ? row[ibuIdx]?.trim() : undefined;
      const judul = judulIdx !== -1 ? row[judulIdx]?.trim() : undefined;
      const pembimbing = pembimbingIdx !== -1 ? row[pembimbingIdx]?.trim() : undefined;
      const foto = fotoIdx !== -1 ? row[fotoIdx]?.trim() : undefined;
      const noWa = noWaIdx !== -1 ? row[noWaIdx]?.trim() : undefined;

      if (nim && name && seatCode) {
        importedGraduates.push({
          id: nim,
          nim,
          name,
          prodi,
          faculty,
          seatCode,
          isPresent,
          checkedInAt: isPresent ? new Date().toISOString() : undefined,
          gelar: rawGelar || undefined,
          ipk,
          sks,
          ayah,
          ibu,
          judul,
          pembimbing,
          foto,
          noWa,
        });
      }
    }

    if (importedGraduates.length === 0) {
      throw new Error("Tidak ada data wisudawan valid yang ditemukan dalam CSV.");
    }

    onImport(importedGraduates);
    setStatus({
      type: "success",
      message: `Berhasil mengimpor ${importedGraduates.length} data wisudawan!`,
    });
    setGoogleSheetUrl("");
  };

  // Upload local CSV File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setStatus({ type: null, message: "" });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        parseCSVAndImport(csvText);
      } catch (error: any) {
        setStatus({
          type: "error",
          message: error.message || "Gagal mengunggah file CSV. Periksa format file Anda.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setStatus({ type: "error", message: "Gagal membaca file CSV." });
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  // Export current list to CSV
  const handleExportCSV = () => {
    const headers = [
      "NO", "NPM", "NAMA", "NAMA GELAR", "PRODI", "IPK", "TOTAL SKS", 
      "Ayah", "Ibu", "Judul", "Pembimbing Utama", "Foto", "No WA", "Hadir", "Waktu Check-In"
    ];
    const rows = graduates.map(g => [
      g.seatCode,
      g.nim,
      g.name.split(",")[0]?.trim() || g.name,
      g.gelar || "",
      g.prodi,
      g.ipk || "",
      g.sks || "",
      g.ayah || "",
      g.ibu || "",
      g.judul || "",
      g.pembimbing || "",
      g.foto || "", // Foto URL
      g.noWa || "",
      g.isPresent ? "HADIR" : "BELUM HADIR",
      g.checkedInAt ? new Date(g.checkedInAt).toLocaleString("id-ID") : "-"
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `kehadiran_wisuda_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download empty template CSV
  const handleDownloadTemplate = () => {
    const headers = [
      "NO", "NPM", "NAMA", "NAMA GELAR", "PRODI", "IPK", "TOTAL SKS", 
      "Ayah", "Ibu", "Judul", "Pembimbing Utama", "Foto", "No WA", "Hadir"
    ];
    const sampleRows = [
      ["001", "12022001", "Ahmad Saputra", "S.Kom.", "Teknik Informatika", "3.85", "144", "Suryadi", "Aminah", "Rancang Bangun Sistem Kehadiran", "Dr. Eng. Hermawan", "", "08123456789", "FALSE"],
      ["002", "12022002", "Budi Setiawan", "S.Si.", "Sistem Informasi", "3.72", "144", "Mulyono", "Siti", "Analisis Big Data Akademik", "Prof. Dr. Dahlan", "", "08234567890", "FALSE"],
      ["003", "12022003", "Chandra Wijaya", "S.E.", "Manajemen", "3.90", "142", "Wijaya", "Ratna", "Strategi Pemasaran Digital", "Drs. Subagyo M.B.A.", "", "08345678901", "FALSE"],
    ];

    const csvContent = [
      headers.join(";"),
      ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_wisudawan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm w-full" id="sheets-sync-container">
      <h2 className="text-xl font-bold text-slate-800 font-sans flex items-center gap-2 mb-2">
        <FileSpreadsheet className="text-blue-600" size={20} />
        Sinkronisasi Data Wisudawan
      </h2>
      <p className="text-xs text-slate-500 mb-6 font-medium">Integrasikan dengan Google Sheets atau gunakan file lokal CSV untuk mengelola data kehadiran secara real-time.</p>

      {/* Grid Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Sheets Import Panel */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Globe className="text-blue-600" size={16} />
                Impor dari Google Sheets
              </span>
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="text-xs text-blue-600 hover:text-blue-500 font-bold flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle size={14} />
                {showGuide ? "Sembunyikan Panduan" : "Panduan Share"}
              </button>
            </div>

            {/* Google Sheets Guide */}
            {showGuide && (
              <div className="bg-white border border-blue-100 rounded-xl p-4 mb-4 text-xs text-slate-600 space-y-2 shadow-sm">
                <p className="font-bold text-blue-600">Cara Menghubungkan Google Sheet:</p>
                <ol className="list-decimal pl-4 space-y-1 font-medium">
                  <li>Buat Google Sheet dengan format kolom: <code className="text-blue-600 font-bold font-mono text-[10px]">NO; NPM; NAMA; NAMA GELAR; PRODI; IPK; TOTAL SKS; Ayah; Ibu; Judul; Pembimbing Utama; Foto; No WA</code>.</li>
                  <li>Klik tombol <strong className="text-slate-800">Bagikan (Share)</strong> di kanan atas Google Sheet.</li>
                  <li>Ubah akses umum menjadi <strong className="text-slate-800">\"Siapa saja yang memiliki link\" (Anyone with link)</strong> sebagai <strong className="text-slate-800">\"Pelihat\" (Viewer)</strong>.</li>
                  <li>Salin link Google Sheet tersebut, lalu tempel di kolom input di bawah ini.</li>
                </ol>
              </div>
            )}

            <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
              Sinkronkan daftar wisudawan Anda langsung dari Google Sheet publik Anda. Pastikan sheet sudah dibagikan sebagai \"Anyone with link can view\".
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Tempel Link Google Sheet di sini..."
              value={googleSheetUrl}
              onChange={(e) => setGoogleSheetUrl(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
              id="google-sheet-url-input"
            />
            <button
              id="sheet-import-btn"
              onClick={handleGoogleSheetsImport}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sheet size={14} />
              {isLoading ? "Mengambil Data..." : "Sinkronkan & Tarik Data"}
            </button>
          </div>
        </div>

        {/* Local CSV & Export Panel */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <Upload className="text-emerald-600" size={16} />
              File Lokal CSV
            </span>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
              Jika Anda tidak ingin menggunakan Google Sheet, Anda dapat mengunggah file spreadsheet berformat <code className="text-emerald-600 font-bold">.csv</code>, mengunduh template kosong, atau mengekspor kehadiran saat ini.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Upload CSV */}
            <label className="bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-150 shadow-sm">
              <Upload className="text-slate-400 mb-1" size={18} />
              <span className="text-[11px] font-bold">Unggah File CSV</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />
            </label>

            {/* Template CSV */}
            <button
              onClick={handleDownloadTemplate}
              className="bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-150 shadow-sm"
            >
              <Download className="text-slate-400 mb-1" size={18} />
              <span className="text-[11px] font-bold">Unduh Template</span>
            </button>

            {/* Export Current Presence */}
            <button
              id="export-csv-btn"
              onClick={handleExportCSV}
              className="col-span-2 bg-white hover:bg-slate-100 border border-slate-200 text-blue-600 font-bold rounded-xl py-2.5 px-3 flex items-center justify-center gap-2 text-xs cursor-pointer transition-colors duration-150 shadow-sm"
            >
              <Download size={14} />
              Ekspor Hasil Kehadiran Saat Ini (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Status Alert feedback */}
      {status.type && (
        <div
          id="sync-status-alert"
          className={`mt-4 p-4 rounded-2xl flex items-start gap-2.5 text-xs border ${
            status.type === "success"
              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
              : "bg-rose-50 border-rose-100 text-rose-800"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-500" size={16} />
          ) : (
            <AlertTriangle className="shrink-0 mt-0.5 text-rose-500" size={16} />
          )}
          <div className="leading-relaxed font-bold font-sans">{status.message}</div>
        </div>
      )}
    </div>
  );
}
