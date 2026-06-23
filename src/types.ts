export interface Graduate {
  id: string; // Normally NIM or custom unique key
  nim: string;
  name: string;
  prodi: string; // Program Studi / Major
  faculty?: string; // Fakultas
  seatCode: string; // e.g., A-01, B-12
  isPresent: boolean;
  checkedInAt?: string; // ISO timestamp
  
  // Optional extra fields from custom Indonesian table header
  gelar?: string;
  ipk?: string;
  sks?: string;
  ayah?: string;
  ibu?: string;
  judul?: string;
  pembimbing?: string;
  noWa?: string;
  foto?: string;
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

export interface ActivityLog {
  id: string;
  graduateId: string;
  graduateName: string;
  seatCode: string;
  timestamp: string;
  action: 'check-in' | 'check-out';
}

export interface SeatingLayout {
  rows: number;
  cols: number;
  seatMapping: Record<string, string>; // seatCode -> graduateId
}
