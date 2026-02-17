import { useEffect, useRef } from 'react';

interface AIVoiceVisualizerProps {
    isListening: boolean;
}

export default function AIVoiceVisualizer({ isListening }: AIVoiceVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const animationFrameRef = useRef<number>();

    useEffect(() => {
        if (isListening) {
            startAudio();
        } else {
            stopAudio();
        }

        return () => stopAudio();
    }, [isListening]);

    const startAudio = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;

            source.connect(analyserRef.current);

            const bufferLength = analyserRef.current.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);

            draw();
        } catch (err) {
            console.error('Error accessing microphone:', err);
        }
    };

    const stopAudio = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
        }
        // Explicitly stop all tracks to release hardware
        if (analyserRef.current && analyserRef.current.context.state !== 'closed') {
            const stream = (analyserRef.current.context as any)._stream;
            if (stream) {
                stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            }
        }
    };

    const draw = () => {
        if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

        animationFrameRef.current = requestAnimationFrame(draw);
        analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const barWidth = (width / dataArrayRef.current.length) * 2.5;
        let x = 0;

        for (let i = 0; i < dataArrayRef.current.length; i++) {
            const barHeight = (dataArrayRef.current[i] / 255) * height;

            const gradient = ctx.createLinearGradient(0, height, 0, 0);
            gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
            gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.6)');
            gradient.addColorStop(1, 'rgba(168, 85, 247, 0.8)');

            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);

            x += barWidth + 2;
        }
    };

    return (
        <div className="w-full h-12 flex items-center justify-center overflow-hidden">
            <canvas
                ref={canvasRef}
                width={300}
                height={48}
                className="opacity-60"
            />
        </div>
    );
}
