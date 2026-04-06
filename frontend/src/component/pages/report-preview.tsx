import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";

type Row = {
  subject: string;
  course_name?: string;
  range: string;
  count: number;
  subjectName?: string;
  subject_name?: string;
  subjectCode?: string;
  subject_code?: string;
};

type Room = {
  sl_no?: number;
  room: string;
  rows: Row[];
  total: number;
};

type ReportData = {
  rooms: Room[];
};

interface ReportPreviewProps {
  onNavigate?: (page: string) => void;
}

const API_BASE = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");

const getToken = (): string | null => {
  const directToken = localStorage.getItem("token") || localStorage.getItem("auth_token");
  if (directToken) return directToken;

  const supabaseKey = Object.keys(localStorage).find(
    (key) => key.startsWith("sb-") && key.endsWith("-auth-token"),
  );

  if (!supabaseKey) return null;

  try {
    const parsed = JSON.parse(localStorage.getItem(supabaseKey) || "");
    return parsed?.access_token ?? null;
  } catch {
    return null;
  }
};

const buildEndpoints = (type: string, sem: string, slot: string) => {
  if (type === "seating") {
    return {
      preview: `${API_BASE}/api/v1/download/seating/${sem}/${slot}`,
      pdf: `${API_BASE}/api/v1/download/seating-pdf/${sem}/${slot}`,
    };
  }

  return {
    preview: `${API_BASE}/api/v1/download/attendencesheet/${sem}/${slot}`,
    pdf: `${API_BASE}/api/v1/download/attendencesheet-pdf/${sem}/${slot}`,
  };
};

const getSubjectAndCodeLabel = (row: Row) => {
  const courseName = (row.course_name || "").trim();
  const subjectCode = (row.subject || "").trim();

  if (courseName && subjectCode) {
    return `${courseName} (${subjectCode})`;
  }

  if (courseName) {
    return courseName;
  }

  const subjectName = (row.subjectName || row.subject_name || "").trim();
  const explicitSubjectCode = (row.subjectCode || row.subject_code || "").trim();

  if (subjectName && explicitSubjectCode) {
    return `${subjectName} (${explicitSubjectCode})`;
  }

  if (subjectName) {
    return subjectName;
  }

  return row.subject;
};

export default function ReportPreview({ onNavigate }: ReportPreviewProps) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const type = (localStorage.getItem("report.type") || "").toLowerCase();
  const sem = (localStorage.getItem("report.sem") || "").trim();
  const slot = (localStorage.getItem("report.slot") || "").trim();
  const isAttendance = type === "attendance";

  const canFetch = useMemo(() => {
    return Boolean(API_BASE && (type === "seating" || type === "attendance") && sem && slot);
  }, [type, sem, slot]);

  const fetchData = async () => {
    if (!canFetch) {
      setLoading(false);
      setError("Missing report context or VITE_API_URL configuration.");
      setData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      const endpoints = buildEndpoints(type, sem, slot);

      const res = await fetch(endpoints.preview, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || `Failed to fetch report preview (${res.status}).`);
        setData(null);
        return;
      }

      const json = (await res.json()) as ReportData;
      setData(json);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch report preview.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleDownloadPDF = async () => {
    if (!canFetch) {
      setError("Missing report context or VITE_API_URL configuration.");
      return;
    }

    try {
      const token = getToken();
      const endpoints = buildEndpoints(type, sem, slot);

      const res = await fetch(endpoints.pdf, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || `Failed to download PDF (${res.status}).`);
        return;
      }

      const blob = await res.blob();
      const fileName = `${type}_${sem}_${slot}.pdf`;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Failed to download PDF.");
    }
  };

  return (
    <div className="fixed top-16 left-64 right-0 bottom-0 overflow-hidden bg-[#fafafa] text-slate-900 antialiased">
      <div className="h-full overflow-y-auto px-8 py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate?.("reports")}
              className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-900 hover:text-white transition-all bg-white"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                {type.toUpperCase()} Preview ({sem} - {slot})
              </h2>
              <p className="text-sm text-slate-500">Review data before downloading the final PDF.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 border border-slate-200 bg-white px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-900 hover:text-white transition-all"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 border border-slate-200 bg-white px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-900 hover:text-white transition-all"
            >
              <Download size={14} /> Download PDF
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          {loading && <p className="text-slate-500">Loading report preview...</p>}

          {!loading && error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && !error && data && (
            <div className="overflow-x-auto">
              <table className="w-full border border-slate-300 text-sm bg-white">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-2 text-center font-bold uppercase">Sl No.</th>
                    <th className="border border-slate-300 p-2 text-center font-bold uppercase">Hall / Room</th>
                    {isAttendance ? (
                      <>
                        <th className="border border-slate-300 p-2 text-center font-bold uppercase">Register No.</th>
                        <th className="border border-slate-300 p-2 text-center font-bold uppercase">Total</th>
                        <th className="border border-slate-300 p-2 text-center font-bold uppercase">Subject and Code</th>
                        <th className="border border-slate-300 p-2 text-center font-bold uppercase">Register No. of Absentees</th>
                        <th className="border border-slate-300 p-2 text-center font-bold uppercase">No. of Absentees</th>
                        <th className="border border-slate-300 p-2 text-center font-bold uppercase">Register Numbers of Spare Code Used</th>
                        <th className="border border-slate-300 p-2 text-center font-bold uppercase">Name and Signature of Invigilator</th>
                      </>
                    ) : (
                      <>
                        <th className="border border-slate-300 p-2 text-center font-bold uppercase">Register Numbers</th>
                        <th className="border border-slate-300 p-2 text-center font-bold uppercase">Count</th>
                        <th className="border border-slate-300 p-2 text-center font-bold uppercase">Total</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.rooms.map((room, index) => (
                    room.rows.map((row, rowIndex) => (
                      <tr key={`${room.room}-${rowIndex}`}>
                        {rowIndex === 0 && (
                          <>
                            <td rowSpan={room.rows.length} className="border border-slate-300 p-2 align-middle">
                              {room.sl_no ?? index + 1}
                            </td>
                            <td rowSpan={room.rows.length} className="border border-slate-300 p-2 align-middle font-semibold text-center">
                              {room.room}
                            </td>
                          </>
                        )}
                        {isAttendance ? (
                          <>
                            <td className="border border-slate-300 p-2">{row.range}</td>
                            {rowIndex === 0 && (
                              <td rowSpan={room.rows.length} className="border border-slate-300 p-2 align-middle font-semibold text-center">
                                {room.total}
                              </td>
                            )}
                            <td className="border border-slate-300 p-2">{getSubjectAndCodeLabel(row)}</td>
                            <td className="border border-slate-300 p-2">-</td>
                            <td className="border border-slate-300 p-2 text-center">-</td>
                            <td className="border border-slate-300 p-2">-</td>
                            <td className="border border-slate-300 p-2">-</td>
                          </>
                        ) : (
                          <>
                            <td className="border border-slate-300 p-2">{row.subject} : {row.range}</td>
                            <td className="border border-slate-300 p-2">{row.count}</td>
                            {rowIndex === 0 && (
                              <td rowSpan={room.rows.length} className="border border-slate-300 p-2 align-middle font-semibold">
                                {room.total}
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && !data && <p className="text-slate-500">No preview data available.</p>}
        </div>
      </div>
    </div>
  );
}
