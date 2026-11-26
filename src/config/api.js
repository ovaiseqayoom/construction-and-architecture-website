const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/health`,
  PROJECTS: `${API_BASE_URL}/api/projects?view=card`,
  PROJECT_DETAIL: `${API_BASE_URL}/api/projects`,
  BLOGS: `${API_BASE_URL}/api/blogs`,
  BLOG_DETAIL: `${API_BASE_URL}/api/blogs`,
  SEND_INQUIRY: `${API_BASE_URL}/api/send-inquiry`,
  SUBSCRIBE: `${API_BASE_URL}/api/subscribe`,
  CAREER: `${API_BASE_URL}/api/send-career-application`,
};
