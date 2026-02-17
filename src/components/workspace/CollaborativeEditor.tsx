import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { SocketIOProvider } from 'y-socket.io';
import { MonacoBinding } from 'y-monaco';
import { Settings, RefreshCw, Hash, Wifi, WifiOff, X, Minus, Plus } from 'lucide-react';
import { ENV_CONFIG } from '../../env_config';

interface CollaborativeEditorProps {
    language: string;
    roomId: string; // The specific problem/session ID
    userName: string;
    userColor: string;
    onLanguageChange: (lang: string) => void;
    onChange?: (value: string) => void; // Sync back to parent
    theme?: 'vs-dark' | 'light';
}

interface EditorSettings {
    fontSize: number;
    minimap: boolean;
    lineNumbers: 'on' | 'off';
    wordWrap: 'on' | 'off';
}

export default function CollaborativeEditor({
    language,
    roomId,
    userName,
    userColor,
    onLanguageChange,
    onChange,
    theme = 'vs-dark'
}: CollaborativeEditorProps) {
    const providerRef = useRef<any>(null);
    const bindingRef = useRef<any>(null);
    const typeRef = useRef<Y.Text | null>(null);
    const docRef = useRef<Y.Doc | null>(null);
    const onChangeRef = useRef(onChange);
    const decorationsRef = useRef<any[]>([]);

    const [localClientId, setLocalClientId] = useState<number | null>(null);
    const [editor, setEditor] = useState<any>(null);
    const [monaco, setMonaco] = useState<any>(null);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [showSettings, setShowSettings] = useState(false);

    const [editorSettings, setEditorSettings] = useState<EditorSettings>({
        fontSize: 14,
        minimap: false,
        lineNumbers: 'on',
        wordWrap: 'on'
    });

    // Keep onChangeRef up to date without triggering useEffect re-runs
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if (!editor || !roomId) return;

        const getSocketURL = () => {
            if (ENV_CONFIG.VITE_COLLAB_SERVER_URL) return ENV_CONFIG.VITE_COLLAB_SERVER_URL;
            if (typeof window === 'undefined') return 'http://localhost:1234';
            return `http://${window.location.hostname}:1234`;
        };
        const serverUrl = getSocketURL();
        const doc = new Y.Doc();
        docRef.current = doc;

        const provider = new SocketIOProvider(serverUrl, roomId, doc, { autoConnect: true });
        providerRef.current = provider;

        const currentClientId = provider.awareness.clientID;
        setLocalClientId(currentClientId);

        const type = doc.getText('monaco');
        typeRef.current = type;

        const setupBinding = () => {
            if (editor && !bindingRef.current) {
                const model = editor.getModel();
                if (!model) return;

                bindingRef.current = new MonacoBinding(
                    type,
                    model,
                    new Set([editor]),
                    provider.awareness
                );

                if (onChangeRef.current) onChangeRef.current(type.toString());
            }
        };

        const updateMinimapDecorations = () => {
            if (!editor || !monaco) return;

            const states = provider.awareness.getStates();
            const newDecorations: any[] = [];

            states.forEach((state: any, clientId: number) => {
                if (clientId === currentClientId) return;

                // y-monaco usually stores selection or cursor info
                // It's often in state.selection or state.cursor
                const selection = state.selection || state.cursor;
                if (!selection || !state.user) return;

                try {
                    // Selection usually has anchor and head (RelativePositions)
                    const head = selection.head || selection.anchor;
                    if (!head) return;

                    const absPos = Y.createAbsolutePositionFromRelativePosition(head, doc);
                    if (absPos) {
                        const model = editor.getModel();
                        if (model) {
                            const pos = model.getPositionAt(absPos.index);

                            newDecorations.push({
                                range: new monaco.Range(pos.lineNumber, 1, pos.lineNumber, 1),
                                options: {
                                    isWholeLine: true,
                                    minimap: {
                                        color: state.user.color,
                                        position: 1 // monaco.editor.MinimapPosition.Inline
                                    }
                                }
                            });
                        }
                    }
                } catch (e) {
                    console.error('Error calculating minimap decoration:', e);
                }
            });

            // Update decorations collection
            decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
        };

        const onStatus = ({ status: s }: any) => setStatus(s);
        const onSync = (isSynced: boolean) => { if (isSynced) setupBinding(); };
        const onTypeChange = () => { if (onChangeRef.current) onChangeRef.current(type.toString()); };

        const handleAwarenessChange = () => {
            updateMinimapDecorations();
        };

        provider.on('status', onStatus);
        provider.on('sync', onSync);
        type.observe(onTypeChange);
        provider.awareness.on('change', handleAwarenessChange);

        provider.awareness.setLocalStateField('user', {
            name: userName,
            color: userColor,
        });

        if (provider.synced) setupBinding();

        return () => {
            provider.off('status', onStatus);
            provider.off('sync', onSync);
            type.unobserve(onTypeChange);
            provider.awareness.off('change', handleAwarenessChange);

            if (bindingRef.current) {
                bindingRef.current.destroy();
                bindingRef.current = null;
            }

            provider.disconnect();
            doc.destroy();
            docRef.current = null;
        };
    }, [roomId, userName, userColor, editor, monaco]);

    const handleEditorDidMount = (editorInstance: any, monacoInstance: any) => {
        setEditor(editorInstance);
        setMonaco(monacoInstance);
    };

    const handleReset = useCallback(() => {
        if (window.confirm('Are you sure you want to reset the code? This will clear the editor for all collaborators.')) {
            if (typeRef.current) {
                typeRef.current.delete(0, typeRef.current.length);
            }
        }
    }, []);

    const toggleSetting = (key: keyof EditorSettings) => {
        setEditorSettings(prev => ({
            ...prev,
            [key]: typeof prev[key] === 'boolean' ? !prev[key] : (prev[key] === 'on' ? 'off' : 'on')
        }));
    };

    const updateFontSize = (delta: number) => {
        setEditorSettings(prev => ({
            ...prev,
            fontSize: Math.max(8, Math.min(32, prev.fontSize + delta))
        }));
    };

    // Explicitly update editor options when settings change
    useEffect(() => {
        if (editor) {
            editor.updateOptions({
                minimap: {
                    enabled: editorSettings.minimap,
                    scale: 3 // Zoomed in: large and very readable characters
                },
                fontSize: editorSettings.fontSize,
                lineNumbers: editorSettings.lineNumbers,
                wordWrap: editorSettings.wordWrap
            });
        }
    }, [editor, editorSettings]);

    const dynamicStyles = useMemo(() => {
        const states = providerRef.current?.awareness?.getStates() || new Map();
        const output: string[] = [];

        states.forEach((state: any, clientId: number) => {
            if (clientId === localClientId || !state.user) return;
            output.push(`
                .yRemoteSelection-${clientId} {
                    background-color: ${state.user.color}33 !important;
                }
                .yRemoteSelectionHead-${clientId} {
                    position: absolute;
                    border-left: 2px solid ${state.user.color} !important;
                    height: 100% !important;
                    box-sizing: border-box;
                    pointer-events: none;
                    z-index: 100;
                }
                .yRemoteSelectionHead-${clientId}::after {
                    content: '${state.user.name.replace(/'/g, "\\'")}';
                    position: absolute;
                    top: -16px;
                    left: -2px;
                    padding: 0px 4px;
                    background-color: ${state.user.color} !important;
                    color: white;
                    font-size: 10px;
                    font-weight: 600;
                    border-radius: 2px 2px 2px 0;
                    white-space: nowrap;
                    z-index: 101;
                    pointer-events: none;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.3);
                }
            `);
        });
        return output.join('\n');
    }, [localClientId, status]);

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] relative overflow-hidden">
            <style>{`
                ${dynamicStyles}
                .monaco-editor .view-overlays .yRemoteSelectionHead {
                    overflow: visible !important;
                }
            `}</style>

            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#1e1e1e] z-10">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <select
                            value={language}
                            onChange={(e) => onLanguageChange(e.target.value)}
                            className="appearance-none bg-[#3c3c3c] text-gray-300 text-xs px-3 py-1.5 rounded hover:bg-[#4c4c4c] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer min-w-[120px]"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="cpp">C++</option>
                            <option value="java">Java</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 border-l border-gray-700 pl-4">
                        <Hash className="w-3 h-3" />
                        <span className="font-mono">{roomId}</span>
                    </div>

                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${status === 'connected' ? 'text-green-500 bg-green-500/10' :
                        status === 'connecting' ? 'text-yellow-500 bg-yellow-500/10 animate-pulse' :
                            'text-red-500 bg-red-500/10'
                        }`}>
                        {status === 'connected' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {status}
                    </div>
                </div>

                <div className="flex items-center gap-4">

                    <div className="flex items-center gap-3 border-l border-gray-700 pl-4">
                        <button
                            className="text-gray-400 hover:text-white transition-colors p-1"
                            title="Reset Code"
                            onClick={handleReset}
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <div className="relative">
                            <button
                                className={`text-gray-400 hover:text-white transition-colors p-1 ${showSettings ? 'text-white' : ''}`}
                                title="Editor Settings"
                                onClick={() => setShowSettings(!showSettings)}
                            >
                                <Settings className="w-4 h-4" />
                            </button>

                            {showSettings && (
                                <div className="absolute right-0 mt-2 w-64 bg-[#2d2d2d] border border-[#3c3c3c] rounded-lg shadow-xl p-4 z-50">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold text-white">Editor Settings</h3>
                                        <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-300">Minimap</span>
                                            <button
                                                onClick={() => toggleSetting('minimap')}
                                                className={`w-8 h-4 rounded-full transition-colors relative ${editorSettings.minimap ? 'bg-blue-600' : 'bg-[#3c3c3c]'}`}
                                            >
                                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${editorSettings.minimap ? 'translate-x-4' : ''}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-300">Line Numbers</span>
                                            <button
                                                onClick={() => toggleSetting('lineNumbers')}
                                                className={`w-8 h-4 rounded-full transition-colors relative ${editorSettings.lineNumbers === 'on' ? 'bg-blue-600' : 'bg-[#3c3c3c]'}`}
                                            >
                                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${editorSettings.lineNumbers === 'on' ? 'translate-x-4' : ''}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-300">Word Wrap</span>
                                            <button
                                                onClick={() => toggleSetting('wordWrap')}
                                                className={`w-8 h-4 rounded-full transition-colors relative ${editorSettings.wordWrap === 'on' ? 'bg-blue-600' : 'bg-[#3c3c3c]'}`}
                                            >
                                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${editorSettings.wordWrap === 'on' ? 'translate-x-4' : ''}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-300">Font Size</span>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => updateFontSize(-1)} className="p-1 hover:bg-[#3c3c3c] rounded"><Minus className="w-3 h-3" /></button>
                                                <span className="text-xs text-white min-w-[20px] text-center">{editorSettings.fontSize}</span>
                                                <button onClick={() => updateFontSize(1)} className="p-1 hover:bg-[#3c3c3c] rounded"><Plus className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Editor Instance */}
            <div className="flex-1 relative">
                <Editor
                    height="100%"
                    language={language === 'cpp' ? 'cpp' : language}
                    theme={theme}
                    onMount={handleEditorDidMount}
                    options={{
                        minimap: {
                            enabled: editorSettings.minimap,
                            scale: 3
                        },
                        fontSize: editorSettings.fontSize,
                        lineNumbers: editorSettings.lineNumbers,
                        wordWrap: editorSettings.wordWrap,
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        readOnly: false,
                        automaticLayout: true,
                        padding: { top: 16 },
                        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                        formatOnPaste: true,
                        formatOnType: true,
                    }}
                />
            </div>
        </div>
    );
}
