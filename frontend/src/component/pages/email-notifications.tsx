"use client"

import { useState, useMemo, useRef } from "react"
import {
    CheckCircle2, Users, Clock, X, ChevronRight, Mail,
    Plus, RotateCcw, Send, Smartphone, CalendarDays,
    History, Loader2, Tag
} from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

// --- DATA STRUCTURE ---
const semesterData = [
    {
        id: "SEM5",
        name: "Semester 5",
        count: 910,
        history: [
            { id: "B101", slot: "Slot B", total: 420, success: 400, failed: 15, pending: 5, timestamp: new Date(Date.now() - 4 * 60000).toISOString() },
            { id: "B098", slot: "Slot A", total: 490, success: 490, failed: 0, pending: 0, timestamp: new Date(Date.now() - 3600000).toISOString() },
        ]
    },
    {
        id: "SEM3",
        name: "Semester 3",
        count: 512,
        history: [
            { id: "B092", slot: "All Slots", total: 512, success: 500, failed: 12, pending: 0, timestamp: new Date(Date.now() - 86400000).toISOString() },
        ]
    },
    { 
        id: "SEM1", 
        name: "Semester 1", 
        count: 480, 
        history: [
            { id: "B080", slot: "Slot C", total: 480, success: 475, failed: 5, pending: 0, timestamp: new Date(Date.now() - 172800000).toISOString() },
        ] 
    },
    { 
        id: "SEM7", 
        name: "Semester 7", 
        count: 445, 
        history: [
            { id: "B110", slot: "Slot E", total: 445, success: 440, failed: 5, pending: 0, timestamp: new Date(Date.now() - 259200000).toISOString() },
        ] 
    },
];

export default function EmailManager() {
    const [isNewBroadcastOpen, setIsNewBroadcastOpen] = useState(false);
    const [selectedSem, setSelectedSem] = useState<typeof semesterData[0] | null>(null);
    const [isRetrying, setIsRetrying] = useState<string | null>(null);
    const [body, setBody] = useState(`Dear {Student_Name},\n\nYour seating for {Subject} ({Subject_Code}) is confirmed.\n\nLocation: {Classroom_Details}`);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertVariable = (variable: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText = body.substring(0, start) + variable + body.substring(end);
        
        setBody(newText);
        
        // Reset focus and cursor position after state update
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
    };

    const getMinutesAgo = (timestamp: string) => {
        const mins = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
        return mins === 0 ? "Just now" : `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
    };

    const isWithin15Mins = (timestamp: string) => {
        const diff = (Date.now() - new Date(timestamp).getTime()) / 60000;
        return diff >= 0 && diff <= 15;
    };

    const activeLogs = useMemo(() => {
        return semesterData.flatMap(sem =>
            sem.history
                .filter(log => isWithin15Mins(log.timestamp))
                .map(log => ({ ...log, semName: sem.name }))
        );
    }, []);

    const handleRetry = (id: string) => {
        setIsRetrying(id);
        setTimeout(() => {
            setIsRetrying(null);
            alert(`Retry command sent for batch ${id}`);
        }, 1500);
    };

    return (
        <div className="max-w-5xl mx-auto py-8 px-6">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Broadcast Management</h1>
                    <p className="text-base text-slate-500 mt-1">Configure and monitor automated examination notifications</p>
                </div>
                <Button onClick={() => setIsNewBroadcastOpen(true)} size="lg" className="h-12 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md px-6">
                    <Plus className="w-5 h-5" /> New Broadcast
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Column: System Archive List */}
                <div className="lg:col-span-3 space-y-6">
                    <section className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Batch Archive
                        </h2>

                        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
                            <div className="divide-y divide-slate-100">
                                {semesterData.map((s) => (
                                    <div
                                        key={s.id}
                                        onClick={() => setSelectedSem(s)}
                                        className="flex items-center justify-between p-6 hover:bg-slate-50 cursor-pointer transition-all group"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-base text-slate-900">{s.name}</h3>
                                                <p className="text-sm text-slate-500 font-medium">{s.count} Candidates Registered</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <Badge variant="secondary" className="font-bold text-[10px] bg-slate-100 text-slate-500 border-none px-3 py-1">
                                                {s.history.length} Logs
                                            </Badge>
                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </section>
                </div>

                {/* Right Column: Live Status Monitor */}
                <div className="lg:col-span-2 space-y-5">
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-700">
                                Live Status
                            </h2>
                            {activeLogs.length > 0 && (
                                <span className="text-xs font-medium text-slate-500">
                                    {activeLogs.length} active
                                </span>
                            )}
                        </div>

                        {activeLogs.length > 0 ? (
                            activeLogs.map((log) => (
                                <Card key={log.id} className="border border-slate-200 bg-white shadow-sm rounded-xl">
                                    <CardContent className="p-5 space-y-4">
                                        {/* Header */}
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{log.semName} · {log.slot}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {new Date(log.timestamp).toLocaleDateString()} · {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {getMinutesAgo(log.timestamp)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                                                    Live
                                                </span>
                                                <p className="text-xs text-slate-500 mt-1.5">{log.total} recipients</p>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-emerald-50 p-3 rounded-lg text-center">
                                                <p className="text-[10px] font-medium text-emerald-700 uppercase mb-1">Success</p>
                                                <p className="text-xl font-bold text-emerald-600">{log.success}</p>
                                            </div>
                                            <div className="bg-red-50 p-3 rounded-lg text-center">
                                                <p className="text-[10px] font-medium text-red-700 uppercase mb-1">Failed</p>
                                                <p className="text-xl font-bold text-red-600">{log.failed}</p>
                                            </div>
                                            <div className="bg-amber-50 p-3 rounded-lg text-center">
                                                <p className="text-[10px] font-medium text-amber-700 uppercase mb-1">Queue</p>
                                                <p className="text-xl font-bold text-amber-600">{log.pending}</p>
                                            </div>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>Progress</span>
                                                <span className="font-medium">{Math.round((log.success / log.total) * 100)}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                                    style={{ width: `${(log.success / log.total) * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Retry button */}
                                        {log.failed > 0 && (
                                            <Button
                                                disabled={isRetrying === log.id}
                                                onClick={() => handleRetry(log.id)}
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs font-medium gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
                                            >
                                                {isRetrying === log.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                )}
                                                {isRetrying === log.id ? 'Retrying...' : `Retry ${log.failed} failed`}
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Card className="border border-dashed border-slate-200 bg-slate-50/50 rounded-xl">
                                <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                                    <Mail className="w-8 h-8 text-slate-300 mb-3" />
                                    <p className="text-sm font-medium text-slate-500">No active transmissions</p>
                                    <p className="text-xs text-slate-400 mt-1">Recent broadcasts will appear here</p>
                                </CardContent>
                            </Card>
                        )}
                    </section>
                </div>
            </div>

            {/* --- NEW BROADCAST MODAL --- */}
            {isNewBroadcastOpen && (
                <div className="fixed top-16 left-64 right-0 bottom-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 transition-opacity">
                    <Card className="w-full max-w-5xl shadow-2xl border-none overflow-hidden bg-white animate-in zoom-in-95 duration-200">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-white py-6 px-8">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-xl font-bold text-slate-900">Configure Broadcast Email</CardTitle>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsNewBroadcastOpen(false)}
                                className="rounded-full hover:bg-slate-100 h-10 w-10"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </Button>
                        </CardHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <div className="p-8 space-y-6 bg-white overflow-y-auto max-h-[80vh]">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2.5">
                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Target Semester</Label>
                                        <Select>
                                            <SelectTrigger className="h-11 border-slate-200 rounded-xl focus:ring-2 ring-indigo-500/20 bg-white">
                                                <SelectValue placeholder="Semester" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-slate-200 shadow-xl">
                                                {semesterData.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2.5">
                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Exam Slot</Label>
                                        <Select>
                                            <SelectTrigger className="h-11 border-slate-200 rounded-xl bg-white">
                                                <SelectValue placeholder="Slot" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-slate-200 shadow-xl">
                                                {['A', 'B', 'C', 'D', 'E'].map(slot => (
                                                    <SelectItem key={slot} value={slot}>Slot {slot}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2.5">
                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <CalendarDays className="w-3 h-3" /> Dispatch Date
                                        </Label>
                                        <Input type="date" className="h-11 border-slate-200 rounded-xl px-4 bg-white" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> Dispatch Time
                                        </Label>
                                        <Input type="time" className="h-11 border-slate-200 rounded-xl px-4 bg-white" />
                                    </div>
                                </div>

                                {/* Variable Picker Section */}
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Tag className="w-3 h-3" /> Insert Dynamic Variables
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { label: "Student Name", value: "{Student_Name}" },
                                            { label: "Subject", value: "{Subject}" },
                                            { label: "Subject Code", value: "{Subject_Code}" },
                                            { label: "Classroom", value: "{Classroom_Details}" }
                                        ].map((variable) => (
                                            <Badge 
                                                key={variable.value}
                                                onClick={() => insertVariable(variable.value)}
                                                variant="outline" 
                                                className="cursor-pointer bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 py-1.5 px-3 transition-all font-medium text-[11px] border-slate-200"
                                            >
                                                {variable.label}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Notification Template</Label>
                                    <Textarea
                                        ref={textareaRef}
                                        value={body}
                                        onChange={e => setBody(e.target.value)}
                                        className="min-h-[160px] text-sm resize-none border-slate-200 rounded-xl p-4 focus:ring-2 ring-indigo-500/20 leading-relaxed bg-white"
                                        placeholder="Type message..."
                                    />
                                </div>
                            </div>

                            {/* Right Panel: Preview */}
                            <div className="p-8 bg-slate-50 flex flex-col justify-between border-l border-slate-100">
                                <div className="space-y-5">
                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Smartphone className="w-4 h-4 text-slate-400" /> Live Preview
                                    </Label>
                                    <Card className="shadow-sm border-slate-200 bg-white rounded-2xl overflow-hidden">
                                        <div className="p-6 min-h-[240px] text-[14px] leading-relaxed relative italic text-slate-600 whitespace-pre-wrap">
                                            <div className="mb-4 pb-3 border-b border-slate-100 text-[12px] not-italic font-bold text-slate-900 flex justify-between items-center">
                                                <span>SJCET Exam Cell</span>
                                                <Badge variant="outline" className="text-[9px] h-4 uppercase font-bold text-slate-400 bg-white">Draft</Badge>
                                            </div>
                                            {body
                                                .replace(/{Student_Name}/g, "Albin")
                                                .replace(/{Subject}/g, "Operating Systems")
                                                .replace(/{Subject_Code}/g, "CST204")
                                                .replace(/{Classroom_Details}/g, "Main Block - Hall 204")}
                                            <div className="absolute bottom-4 right-4 opacity-5 text-slate-900">
                                                <Mail size={50} />
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                <div className="space-y-4 pt-8 border-t border-slate-200">
                                    <Button className="w-full font-bold h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100 gap-3 active:scale-[0.99] transition-all">
                                        <Send className="w-5 h-5" /> Dispatch Now
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* --- ANALYTICS MODAL --- */}
            {selectedSem && (
                <div className="fixed top-16 left-64 right-0 bottom-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-2xl shadow-2xl border-none bg-white animate-in slide-in-from-bottom-4">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-white py-6 px-8">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-xl font-bold text-slate-900">{selectedSem.name} History</CardTitle>
                                <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500 font-bold">{selectedSem.count} Candidates</Badge>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedSem(null)} className="h-10 w-10 text-slate-400 hover:bg-slate-50 rounded-full"><X className="w-5 h-5" /></Button>
                        </CardHeader>
                        <CardContent className="p-0 max-h-[60vh] overflow-y-auto">
                            {selectedSem.history.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {selectedSem.history.map((log) => (
                                        <div key={log.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-5">
                                                <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200"><CheckCircle2 className="w-5 h-5 text-slate-400" /></div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900">{log.slot}</p>
                                                    <p className="text-[11px] font-medium text-slate-400">{new Date(log.timestamp).toLocaleDateString()} • {new Date(log.timestamp).toLocaleTimeString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-6">
                                                <div className="text-right"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Success</p><p className="text-sm font-bold text-slate-900">{log.success}</p></div>
                                                <div className="text-right border-l border-slate-100 pl-6"><p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Bounced</p><p className="text-sm font-bold text-red-600 leading-none">{log.failed}</p></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <History className="w-12 h-12 mx-auto text-slate-100 mb-4" />
                                    <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">No historical logs found</p>
                                </div>
                            )}
                        </CardContent>
                        <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
                            <Button onClick={() => setSelectedSem(null)} className="px-10 font-bold bg-slate-900 text-white rounded-xl h-11 hover:bg-slate-800 shadow-lg shadow-slate-200">Dismiss</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}