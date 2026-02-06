export interface Prompt {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface PromptsListResponse {
  prompts: Prompt[];
  total: number;
  limit: number;
  offset: number;
}
