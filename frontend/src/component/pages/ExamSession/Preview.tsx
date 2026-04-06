"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";

interface PreviewProps {
  payload: any;
  onBack: () => void;
  onCancel: () => void;
  onGenerate: (files: File[], tags?: any) => Promise<void> | void;
}

const PAGE_SIZE = 10;

export default function Preview({
  payload,
  onBack,
  onCancel,
  onGenerate,
}: PreviewProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [allRows, setAllRows] = useState<string[][]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatingSeating, setGeneratingSeating] = useState(false);

  const totalPages = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
  const pagedRows = allRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    const processAllFiles = async () => {
      const type = payload?.type;
      const items =
        payload?.data || payload?.files?.map((f: File) => ({ file: f })) || [];

      if (!items.length) return;

      setLoading(true);
      let combinedHeaders: string[] = [];
      let combinedRows: string[][] = [];

      try {
        for (const item of items) {
          const file = item.file;
          const rawRows = await readFile(file);

          if (type === "internal") {
            const result = parseInternal(rawRows, item);
            combinedHeaders = ["Batch", "Semester", "Student Name", "Course"];
            combinedRows.push(...result);
          } else if (type === "autonomous") {
            const result = parseAutonomous(rawRows, item);
            combinedHeaders = [
              "Register No",
              "Student Name",
              "Branch",
              "Semester",
              "Course",
            ];
            combinedRows.push(...result);
          } else {
            // KTU University / Default
            const { headers: h, rows: r } = parseKTU(rawRows);
            combinedHeaders = h;
            combinedRows.push(...r);
          }
        }

        setHeaders(combinedHeaders);
        setAllRows(combinedRows);
        setPage(1);
      } finally {
        setLoading(false);
      }
    };

    processAllFiles();
  }, [payload]);

  const readFile = (file: File): Promise<any[][]> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = e.target.result;
        let rows: any[][] = [];
        if (file.name.toLowerCase().endsWith(".csv")) {
          rows = (data as string)
            .split("\n")
            .filter(Boolean)
            .map((l) => l.split(","));
        } else {
          const workbook = XLSX.read(data, { type: "binary" });
          rows = XLSX.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[0]],
            { header: 1 },
          );
        }
        resolve(rows);
      };
      file.name.toLowerCase().endsWith(".csv")
        ? reader.readAsText(file)
        : reader.readAsBinaryString(file);
    });
  };

  const parseKTU = (rawRows: any[][]) => {
    const map = [
      { label: "Student", keys: ["student", "name"] },
      { label: "Branch Name", keys: ["branch"] },
      { label: "Course", keys: ["course"] },
      { label: "Slot", keys: ["slot"] },
      { label: "Event", keys: ["event"] },
    ];
    let headerIdx = 0;
    let indices = map.map(() => -1);

    for (let r = 0; r < Math.min(10, rawRows.length); r++) {
      const row = rawRows[r].map((c) => String(c ?? "").toLowerCase());
      const found = map.map((m) =>
        row.findIndex((h) => m.keys.some((k) => h.includes(k))),
      );
      if (found.filter((i) => i !== -1).length >= 3) {
        headerIdx = r;
        indices = found;
        break;
      }
    }

    const data = rawRows
      .slice(headerIdx + 1)
      .map((row) =>
        indices.map((i) => (i !== -1 ? String(row[i] ?? "").trim() : "N/A")),
      )
      .filter((r) => r[0] !== "" && r[0] !== "N/A");

    return { headers: map.map((m) => m.label), rows: data };
  };

  const parseInternal = (rawRows: any[][], item: any) => {
    let nameIdx = -1;
    for (let r = 0; r < Math.min(10, rawRows.length); r++) {
      const row = rawRows[r].map((c) => String(c ?? "").toLowerCase());
      nameIdx = row.findIndex((h) =>
        ["name", "student"].some((k) => h.includes(k)),
      );
      if (nameIdx !== -1) break;
    }

    let currentBatch = item.dept || "N/A";
    let currentSem = item.semester || "N/A";
    const results: string[][] = [];

    rawRows.forEach((row) => {
      const rowStr = row.join(" ").trim();
      const headingMatch = rowStr.match(
        /Batch\s*:\s*([A-Z\s&]+).*\(S([1-8])\)/i,
      );
      if (headingMatch) {
        currentBatch = headingMatch[1].trim();
        currentSem = "S" + headingMatch[2];
        return;
      }
      const name = String(row[nameIdx] ?? "").trim();
      if (name && isNaN(Number(name)) && !name.toLowerCase().includes("name")) {
        results.push([
          currentBatch,
          currentSem,
          name,
          item.subjectName || "Internal Exam",
        ]);
      }
    });
    return results;
  };

  const parseAutonomous = (rawRows: any[][], item: any) => {
    let regIdx = -1,
      nameIdx = -1;
    for (let r = 0; r < Math.min(10, rawRows.length); r++) {
      const row = rawRows[r].map((c) => String(c ?? "").toLowerCase());
      regIdx = row.findIndex((h) =>
        ["register", "reg", "roll"].some((k) => h.includes(k)),
      );
      nameIdx = row.findIndex((h) =>
        ["name", "student"].some((k) => h.includes(k)),
      );
      if (regIdx !== -1 && nameIdx !== -1) break;
    }

    return rawRows
      .slice(1)
      .map((row) => [
        String(row[regIdx] ?? "").trim(),
        String(row[nameIdx] ?? "").trim(),
        item.dept || "N/A",
        item.semester || "N/A",
        item.subjectCode || "N/A",
      ])
      .filter((r) => r[1] !== "");
  };

  const handleGenerateSeating = async () => {
    setGeneratingSeating(true);
    try {
      const files =
        payload?.files || payload?.data?.map((item: any) => item.file) || [];
      await onGenerate(files, payload?.tags);
      // On success, parent will navigate away, so we don't reset here
    } catch {
      // On error, reset the button so user can try again
      setGeneratingSeating(false);
    }

    // Safety timeout: if no navigation happened after 3 seconds, reset the button
    // This handles cases where errors are caught by parent but not re-thrown
    setTimeout(() => {
      setGeneratingSeating((prev) => {
        // Only reset if still generating (meaning no navigation happened)
        return prev ? false : prev;
      });
    }, 3000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Preview Data</CardTitle>
        <p className="text-sm text-muted-foreground">
          Verify uploaded file and tags before generating seating
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <p className="font-medium mb-1">Uploaded Files:</p>
          {payload?.files?.map((file: File, i: number) => (
            <p key={i} className="text-sm text-muted-foreground">
              {file.name}
            </p>
          )) ||
            payload?.data?.map((item: any, i: number) => (
              <p key={i} className="text-sm text-muted-foreground">
                {item.file.name}
              </p>
            ))}
        </div>

        <div>
          <p className="font-medium">
            Total Entries:{" "}
            <span className="text-blue-600">
              {allRows.length.toLocaleString()}
            </span>
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Loading preview…
          </div>
        ) : headers.length === 0 ? (
          <div className="border rounded p-4 text-sm text-red-500">
            Could not parse data correctly. Check file headers.
          </div>
        ) : (
          <div className="overflow-auto border rounded max-h-72">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="border-b">
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      className="px-3 py-2 text-left font-semibold whitespace-nowrap border-r last:border-r-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b last:border-b-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className="px-3 py-1.5 border-r last:border-r-0 whitespace-nowrap max-w-xs truncate"
                        title={cell}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              Showing {((page - 1) * PAGE_SIZE + 1).toLocaleString()}–
              {Math.min(page * PAGE_SIZE, allRows.length).toLocaleString()} of{" "}
              {allRows.length.toLocaleString()} entries
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 border rounded text-xs font-medium min-w-[60px] text-center">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {payload?.tags && (
          <div>
            <p className="font-medium mb-2">Tags:</p>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-28">
              {JSON.stringify(payload.tags, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateSeating}
              disabled={allRows.length === 0 || generatingSeating}
            >
              {generatingSeating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  Generate Seating <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
