export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      channels: {
        Row: {
          active: boolean;
          category: string;
          created_at: string;
          id: string;
          logo: string | null;
          name: string;
          slug: string;
          sort_order: number;
          stream_url: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          category?: string;
          created_at?: string;
          id?: string;
          logo?: string | null;
          name: string;
          slug: string;
          sort_order?: number;
          stream_url: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          category?: string;
          created_at?: string;
          id?: string;
          logo?: string | null;
          name?: string;
          slug?: string;
          sort_order?: number;
          stream_url?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          approved: boolean;
          author_name: string;
          body: string;
          created_at: string;
          id: string;
          post_id: string;
          user_id: string | null;
        };
        Insert: {
          approved?: boolean;
          author_name: string;
          body: string;
          created_at?: string;
          id?: string;
          post_id: string;
          user_id?: string | null;
        };
        Update: {
          approved?: boolean;
          author_name?: string;
          body?: string;
          created_at?: string;
          id?: string;
          post_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      pages: {
        Row: {
          created_at: string;
          html: string;
          id: string;
          published: boolean;
          slug: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          html?: string;
          id?: string;
          published?: boolean;
          slug: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          html?: string;
          id?: string;
          published?: boolean;
          slug?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          author_id: string | null;
          category_id: string | null;
          cover_image: string | null;
          created_at: string;
          excerpt: string | null;
          html: string | null;
          id: string;
          published: boolean;
          published_at: string | null;
          slug: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          author_id?: string | null;
          category_id?: string | null;
          cover_image?: string | null;
          created_at?: string;
          excerpt?: string | null;
          html?: string | null;
          id?: string;
          published?: boolean;
          published_at?: string | null;
          slug: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          category_id?: string | null;
          cover_image?: string | null;
          created_at?: string;
          excerpt?: string | null;
          html?: string | null;
          id?: string;
          published?: boolean;
          published_at?: string | null;
          slug?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      episodes: {
        Row: {
          created_at: string;
          download_url: string | null;
          episode_number: number;
          id: string;
          post_id: string;
          season_number: number;
          title: string | null;
          watch_url: string | null;
        };
        Insert: {
          created_at?: string;
          download_url?: string | null;
          episode_number: number;
          id?: string;
          post_id: string;
          season_number?: number;
          title?: string | null;
          watch_url?: string | null;
        };
        Update: {
          created_at?: string;
          download_url?: string | null;
          episode_number?: number;
          id?: string;
          post_id?: string;
          season_number?: number;
          title?: string | null;
          watch_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "episodes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      post_tags: {
        Row: {
          post_id: string;
          tag_id: string;
        };
        Insert: {
          post_id: string;
          tag_id: string;
        };
        Update: {
          post_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: "admin" | "editor" | "user";
    };
    CompositeTypes: Record<string, never>;
  };
};
