import { getDeviceId } from './session';
import type {
  DashboardData,
  MealRecord,
  UserProfile,
  UserSetupPayload,
  WorkoutChatHistoryResponse,
  WorkoutChatResponse,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function headers(): HeadersInit {
  return {
    'X-Device-Id': getDeviceId(),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '요청에 실패했습니다.' }));
    throw new Error(error.detail || '요청에 실패했습니다.');
  }
  return response.json();
}

export async function checkProfileStatus(): Promise<boolean> {
  const response = await fetch(`${API_BASE}/api/users/profile/status`, {
    headers: headers(),
  });
  const data = await handleResponse<{ has_profile: boolean }>(response);
  return data.has_profile;
}

export async function setupProfile(payload: UserSetupPayload): Promise<UserProfile> {
  const response = await fetch(`${API_BASE}/api/users/setup`, {
    method: 'POST',
    headers: {
      ...headers(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<UserProfile>(response);
}

export async function fetchDashboard(mealDate?: string): Promise<DashboardData> {
  const query = mealDate ? `?meal_date=${mealDate}` : '';
  const response = await fetch(`${API_BASE}/api/recommendations/dashboard${query}`, {
    headers: headers(),
  });
  return handleResponse<DashboardData>(response);
}

export async function uploadMeal(formData: FormData): Promise<MealRecord> {
  const response = await fetch(`${API_BASE}/api/meals/upload`, {
    method: 'POST',
    headers: headers(),
    body: formData,
  });
  return handleResponse<MealRecord>(response);
}

export async function fetchWorkoutHistory(): Promise<WorkoutChatHistoryResponse> {
  const response = await fetch(`${API_BASE}/api/workouts/history`, {
    headers: headers(),
  });
  return handleResponse<WorkoutChatHistoryResponse>(response);
}

export async function sendWorkoutMessage(content: string): Promise<WorkoutChatResponse> {
  const response = await fetch(`${API_BASE}/api/workouts/chat`, {
    method: 'POST',
    headers: {
      ...headers(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });
  return handleResponse<WorkoutChatResponse>(response);
}

export async function clearWorkoutHistory(): Promise<WorkoutChatHistoryResponse> {
  const response = await fetch(`${API_BASE}/api/workouts/history`, {
    method: 'DELETE',
    headers: headers(),
  });
  return handleResponse<WorkoutChatHistoryResponse>(response);
}
