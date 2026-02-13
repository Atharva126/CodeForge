export interface Discussion {
    id: string;
    title: string;
    content: string;
    author_id: string;
    category: string;
    tags: string[];
    upvotes: number;
    downvotes: number;
    views: number;
    created_at: string;
    profiles?: {
        username: string;
        avatar_url: string | null;
        is_official?: boolean;
        is_pro?: boolean;
    };
}

export interface Comment {
    id: string;
    discussion_id: string;
    author_id: string;
    content: string;
    parent_id: string | null;
    upvotes: number;
    downvotes: number;
    created_at: string;
    profiles?: {
        username: string;
        avatar_url: string | null;
        is_official?: boolean;
        is_pro?: boolean;
    };
    replies?: Comment[];
}
