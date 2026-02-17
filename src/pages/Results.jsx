import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, CheckCircle, TrendingUp, ArrowLeft, Target, Award } from 'lucide-react';
import { sarvamService } from '../services/sarvamService';
import { sessionHandler } from '../services/SessionHandler';

export default function Results() {
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            const transcript = sessionHandler.getFullTranscript();
            if (!transcript) {
                setLoading(false);
                return;
            }
            try {
                const data = await sarvamService.evaluate(transcript);
                setReport(data);
            } catch (err) {
                console.error('Evaluation failed', err);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
                <TrendingUp className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">Generating Your Report...</h2>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-black text-white mb-8">No interview data found</h2>
                <button onClick={() => navigate('/interview')} className="px-8 py-4 bg-indigo-500 rounded-2xl font-black uppercase">Return home</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white py-16 px-4">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/20"
                    >
                        <Trophy className="w-12 h-12 text-white" />
                    </motion.div>
                    <h1 className="text-5xl font-black mb-4 tracking-tighter uppercase">Interview Summary</h1>
                    <p className="text-gray-400 text-lg uppercase tracking-widest font-bold">Deep Neural Analysis Complete</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                        <Target className="w-8 h-8 text-indigo-400 mb-4" />
                        <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Performance Score</div>
                        <div className="text-5xl font-black text-indigo-400">{report.Score || report.score || 0}%</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl md:col-span-2">
                        <Award className="w-8 h-8 text-purple-400 mb-4" />
                        <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Key Highlights</div>
                        <div className="text-xl font-bold text-gray-200">
                            {report.Strengths?.[0] || report.strengths?.[0] || "Great communication skills demonstrated."}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <div className="bg-white/2 border border-white/5 rounded-[32px] p-8">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            CORE STRENGTHS
                        </h3>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            {(report.Strengths || report.strengths || []).map((s, i) => (
                                <li key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <span className="text-green-500 font-black">•</span> {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-white/2 border border-white/5 rounded-[32px] p-8">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                            <TrendingUp className="w-6 h-6 text-orange-400" />
                            AREAS FOR GROWTH
                        </h3>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            {(report.Improvements || report.improvements || []).map((s, i) => (
                                <li key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <span className="text-orange-500 font-black">•</span> {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <footer className="flex justify-center">
                    <button
                        onClick={() => navigate('/interview')}
                        className="flex items-center gap-3 px-10 py-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-black uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Interview Hub
                    </button>
                </footer>
            </div>
        </div>
    );
}
