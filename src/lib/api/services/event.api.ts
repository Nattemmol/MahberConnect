import { apiClient } from "../client";
import {
  PaginatedResponse,
  Event,
  CreateEventDto,
  QRCodeResponse,
  Attendance,
  AttendanceAnalytics,
  AttendanceTrends,
  EventPhoto,
  UploadResponse,
  EventInvitation,
  EventInvitationStatus,
  SendInvitationsResponse,
} from "@/lib/types";

export const eventApi = {
  getEvents: async (
    mahberId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Event>> => {
    const response = await apiClient.get<PaginatedResponse<Event>>(
      `/mahbers/${mahberId}/events?page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  getEventById: async (mahberId: string, eventId: string): Promise<Event> => {
    const response = await apiClient.get<Event>(
      `/mahbers/${mahberId}/events/${eventId}`,
    );
    return response.data;
  },

  createEvent: async (
    mahberId: string,
    data: CreateEventDto,
  ): Promise<Event> => {
    const response = await apiClient.post<Event>(
      `/mahbers/${mahberId}/events`,
      data,
    );
    return response.data;
  },

  updateEvent: async (
    mahberId: string,
    eventId: string,
    data: Partial<CreateEventDto>,
  ): Promise<Event> => {
    const response = await apiClient.put<Event>(
      `/mahbers/${mahberId}/events/${eventId}`,
      data,
    );
    return response.data;
  },

  cancelEvent: async (mahberId: string, eventId: string): Promise<Event> => {
    const response = await apiClient.delete<Event>(
      `/mahbers/${mahberId}/events/${eventId}`,
    );
    return response.data;
  },

  getQRCode: async (
    mahberId: string,
    eventId: string,
  ): Promise<QRCodeResponse> => {
    const response = await apiClient.get<QRCodeResponse>(
      `/mahbers/${mahberId}/events/${eventId}/qr`,
    );
    return response.data;
  },

  getUserQRCode: async (
    mahberId: string,
    eventId: string,
  ): Promise<QRCodeResponse> => {
    const response = await apiClient.get<QRCodeResponse>(
      `/mahbers/${mahberId}/events/${eventId}/user-qr`,
    );
    return response.data;
  },

  checkIn: async (
    mahberId: string,
    eventId: string,
    qrToken: string,
  ): Promise<Attendance> => {
    const response = await apiClient.post<Attendance>(
      `/mahbers/${mahberId}/events/${eventId}/attendance`,
      { qr_token: qrToken },
    );
    return response.data;
  },

  manualCheckIn: async (
    mahberId: string,
    eventId: string,
    memberId: string,
  ): Promise<Attendance> => {
    const response = await apiClient.post<Attendance>(
      `/mahbers/${mahberId}/events/${eventId}/attendance/manual`,
      { member_id: memberId },
    );
    return response.data;
  },

  processAttendance: async (
    mahberId: string,
    eventId: string,
  ): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      `/mahbers/${mahberId}/events/${eventId}/process-attendance`,
    );
    return response.data;
  },

  getPhotos: async (
    mahberId: string,
    eventId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<EventPhoto>> => {
    const response = await apiClient.get<PaginatedResponse<EventPhoto>>(
      `/mahbers/${mahberId}/events/${eventId}/photos?page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  uploadPhoto: async (
    mahberId: string,
    eventId: string,
    formData: FormData,
  ): Promise<UploadResponse<EventPhoto>> => {
    const response = await apiClient.post<UploadResponse<EventPhoto>>(
      `/mahbers/${mahberId}/events/${eventId}/photos`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  // Invitations
  sendInvitations: async (
    mahberId: string,
    eventId: string,
    memberIds: string[],
  ): Promise<SendInvitationsResponse> => {
    const response = await apiClient.post<SendInvitationsResponse>(
      `/mahbers/${mahberId}/events/${eventId}/invitations`,
      { member_ids: memberIds },
    );
    return response.data;
  },

  getInvitations: async (
    mahberId: string,
    eventId: string,
  ): Promise<EventInvitation[]> => {
    const response = await apiClient.get<EventInvitation[]>(
      `/mahbers/${mahberId}/events/${eventId}/invitations`,
    );
    return response.data;
  },

  respondToInvitation: async (
    mahberId: string,
    eventId: string,
    invitationId: string,
    action: "accept" | "decline",
  ): Promise<EventInvitation> => {
    const response = await apiClient.put<EventInvitation>(
      `/mahbers/${mahberId}/events/${eventId}/invitations/${invitationId}/respond`,
      { action },
    );
    return response.data;
  },

  getMyInvitations: async (
    mahberId: string,
  ): Promise<EventInvitation[]> => {
    const response = await apiClient.get<EventInvitation[]>(
      `/mahbers/${mahberId}/my-invitations`,
    );
    return response.data;
  },

  // Registration / RSVP
  registerForEvent: async (mahberId: string, eventId: string): Promise<EventInvitation> => {
    const response = await apiClient.post<EventInvitation>(
      `/mahbers/${mahberId}/events/${eventId}/register`,
    );
    return response.data;
  },

  cancelRegistration: async (mahberId: string, eventId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/mahbers/${mahberId}/events/${eventId}/register`,
    );
    return response.data;
  },

  getRegistrations: async (mahberId: string, eventId: string): Promise<any> => {
    const response = await apiClient.get<any>(
      `/mahbers/${mahberId}/events/${eventId}/registrations`,
    );
    return response.data;
  },

  // Host management
  assignEventHost: async (
    mahberId: string,
    eventId: string,
    memberId: string,
  ): Promise<Event> => {
    const response = await apiClient.put<Event>(
      `/mahbers/${mahberId}/events/${eventId}/host`,
      { member_id: memberId },
    );
    return response.data;
  },

  removeEventHost: async (
    mahberId: string,
    eventId: string,
  ): Promise<Event> => {
    const response = await apiClient.delete<Event>(
      `/mahbers/${mahberId}/events/${eventId}/host`,
    );
    return response.data;
  },

  deletePhoto: async (
    mahberId: string,
    eventId: string,
    photoId: string,
  ): Promise<void> => {
    await apiClient.delete(
      `/mahbers/${mahberId}/events/${eventId}/photos/${photoId}`,
    );
  },

  getAttendance: async (
    mahberId: string,
    eventId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Attendance>> => {
    const response = await apiClient.get<PaginatedResponse<Attendance>>(
      `/mahbers/${mahberId}/events/${eventId}/attendance?page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  // ── Analytics ──────────────────────────────────────────────────────────────
  getAttendanceAnalytics: async (
    mahberId: string,
    eventId: string,
  ): Promise<AttendanceAnalytics> => {
    const response = await apiClient.get<AttendanceAnalytics>(
      `/mahbers/${mahberId}/events/${eventId}/attendance/analytics`,
    );
    return response.data;
  },

  getAttendanceTrends: async (
    mahberId: string,
    eventId: string,
    months: number = 6,
  ): Promise<AttendanceTrends> => {
    const response = await apiClient.get<AttendanceTrends>(
      `/mahbers/${mahberId}/events/${eventId}/attendance/trends?months=${months}`,
    );
    return response.data;
  },

  exportAttendanceReport: async (
    mahberId: string,
    eventId: string,
    params?: { startDate?: string; endDate?: string },
  ): Promise<Blob> => {
    const response = await apiClient.get(
      `/mahbers/${mahberId}/events/${eventId}/attendance/report`,
      { params, responseType: 'blob' },
    );
    return response.data as Blob;
  },
};
