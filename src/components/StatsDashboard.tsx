import React from "react";
import { Users, UserCheck, UserX, Percent } from "lucide-react";
import { AttendanceStats } from "../types";

interface StatsDashboardProps {
  stats: AttendanceStats;
}

export default function StatsDashboard({ stats }: StatsDashboardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full" id="stats-dashboard-container">
      {/* Total Wisudawan Card - Bento Premium Blue Accent */}
      <div 
        id="stat-card-total"
        className="bg-blue-600 rounded-3xl p-6 flex items-center justify-between shadow-sm transition-transform hover:scale-[1.01] duration-200 text-white"
      >
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-200 font-mono">Total Wisudawan</span>
          <span className="text-4xl font-black mt-1 font-sans">{stats.total}</span>
        </div>
        <div className="p-3.5 bg-blue-500/30 rounded-2xl text-white">
          <Users size={24} />
        </div>
      </div>

      {/* Sudah Hadir Card */}
      <div 
        id="stat-card-present"
        className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm transition-transform hover:scale-[1.01] duration-200"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Sudah Hadir</span>
            <span className="text-4xl font-black text-emerald-500 mt-1 font-sans">{stats.present}</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-500 border border-emerald-100">
            <UserCheck size={24} />
          </div>
        </div>
        {/* Simple Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
          <div 
            className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
            style={{ width: `${stats.percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Belum Hadir Card */}
      <div 
        id="stat-card-absent"
        className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm transition-transform hover:scale-[1.01] duration-200"
      >
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Belum Hadir</span>
          <span className="text-4xl font-black text-rose-500 mt-1 font-sans">{stats.absent}</span>
        </div>
        <div className="p-3 bg-rose-50 rounded-2xl text-rose-500 border border-rose-100">
          <UserX size={24} />
        </div>
      </div>

      {/* Persentase Kehadiran Card */}
      <div 
        id="stat-card-percentage"
        className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm transition-transform hover:scale-[1.01] duration-200"
      >
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Rasio Kehadiran</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl font-black text-blue-600 font-sans">{stats.percentage.toFixed(1)}</span>
            <span className="text-base font-bold text-blue-400">%</span>
          </div>
        </div>
        <div className="p-3 bg-blue-50 rounded-2xl text-blue-500 border border-blue-100">
          <Percent size={24} />
        </div>
      </div>
    </div>
  );
}
