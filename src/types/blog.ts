// TypeScript types for blog system
export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  filename: string;
  size: number;
  createdAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Rating {
  id: string;
  postId: string;
  authorId: string;
  rating: number; // 1-5 stars
  createdAt: Date;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  media: MediaItem[];
  authorId: string;
  authorName: string;
  authorEmail: string;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  avgRating: number;
  totalRatings: number;
}

export interface BlogPostInput {
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
}

export interface SearchFilters {
  query: string;
  tags: string[];
  sortBy: 'newest' | 'oldest' | 'rating' | 'views';
  limit: number;
} 