export interface CommentResponse {
    commentId: number;
    userName: string;
    content: string;
    createdAt: string;
}

export interface AdStats {
    likes: number;
    isLiked: boolean;
}
