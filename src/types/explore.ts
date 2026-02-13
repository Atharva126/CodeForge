export interface Roadmap {
    id: string;
    title: string;
    description: string;
    slug: string;
    category: 'Language' | 'DSA' | 'Interview';
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    estimated_hours: number;
    created_at: string;
    thumbnail_url?: string;
}

export interface RoadmapNode {
    id: string;
    roadmap_id: string;
    title: string;
    description: string;
    order_index: number;
    content: string;
    problem_ids: string[];
    parent_node_id: string | null;
    status?: 'completed' | 'in_progress' | 'not_started';
}

export interface UserProgress {
    id: string;
    user_id: string;
    roadmap_id: string;
    node_id: string;
    status: 'completed' | 'in_progress';
    completed_at: string;
}
