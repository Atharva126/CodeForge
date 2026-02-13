interface ProblemDescriptionProps {
    problem: any;
    activeTab: 'description' | 'submissions' | 'editorial';
    setActiveTab: (tab: 'description' | 'submissions' | 'editorial') => void;
}

export default function ProblemDescription({ problem }: ProblemDescriptionProps) {
    if (!problem) return <div className="p-6 text-gray-400">Loading problem...</div>;

    return (
        <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800 p-6 text-white">
            <h1 className="text-2xl font-bold mb-4">{problem.title}</h1>
            <p className="text-gray-300">{problem.description}</p>
        </div>
    );
}
