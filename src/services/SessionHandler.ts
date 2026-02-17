export class SessionHandler {
    private transcript: { role: 'ai' | 'user'; text: string; timestamp: number }[] = [];

    addEntry(role: 'ai' | 'user', text: string) {
        this.transcript.push({
            role,
            text,
            timestamp: Date.now()
        });
    }

    getFullTranscript(): string {
        return this.transcript
            .map(entry => `${entry.role.toUpperCase()}: ${entry.text}`)
            .join('\n');
    }

    getTranscriptArray() {
        return this.transcript;
    }

    clear() {
        this.transcript = [];
    }
}

export const sessionHandler = new SessionHandler();
