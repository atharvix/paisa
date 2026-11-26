import { User, EventDetail, Ticket, EscrowBreakdown, HostProfile, VenueDispute, LedgerEntry, SystemSetting } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const PYTHON_BASE = import.meta.env.VITE_PYTHON_SERVICE_URL || 'http://localhost:8000';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // Auth
  async register(data: any) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async login(data: any) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getMe(): Promise<{ success: boolean; data: User }> {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Events
  async getLiveEvents(): Promise<{ success: boolean; data: EventDetail[] }> {
    const res = await fetch(`${API_BASE}/api/events`);
    return res.json();
  },

  async getEventById(id: string | number): Promise<{ success: boolean; data: EventDetail }> {
    const res = await fetch(`${API_BASE}/api/events/${id}`);
    return res.json();
  },

  async createEvent(data: any) {
    const res = await fetch(`${API_BASE}/api/events`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getMyHostEvents(): Promise<{ success: boolean; data: EventDetail[] }> {
    const res = await fetch(`${API_BASE}/api/events/host/my-events`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Bookings / Checkout
  async initiateCheckout(eventId: number, ticketTierId: number, idempotencyKey: string) {
    const res = await fetch(`${API_BASE}/api/bookings/initiate`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ eventId, ticketTierId, idempotencyKey })
    });
    return res.json();
  },

  async verifyPayment(orderId: string, paymentId: string, signature: string, idempotencyKey: string) {
    const res = await fetch(`${API_BASE}/api/bookings/verify`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        idempotencyKey
      })
    });
    return res.json();
  },

  async getMyTickets(): Promise<{ success: boolean; data: Ticket[] }> {
    const res = await fetch(`${API_BASE}/api/bookings/my-tickets`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getTicketById(id: number): Promise<{ success: boolean; data: Ticket }> {
    const res = await fetch(`${API_BASE}/api/bookings/ticket/${id}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Host Escrow & KYC
  async submitKyc(data: any) {
    const res = await fetch(`${API_BASE}/api/host/kyc`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getMyKyc(): Promise<{ success: boolean; data: HostProfile }> {
    const res = await fetch(`${API_BASE}/api/host/kyc`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getEscrowBreakdown(eventId: number): Promise<{ success: boolean; data: EscrowBreakdown }> {
    const res = await fetch(`${API_BASE}/api/host/escrow-breakdown/${eventId}`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async cancelEvent(eventId: number) {
    const res = await fetch(`${API_BASE}/api/host/cancel-event/${eventId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Admin
  async getKycQueue(): Promise<{ success: boolean; data: HostProfile[] }> {
    const res = await fetch(`${API_BASE}/api/admin/kyc-queue`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async verifyKyc(profileId: number, approve: boolean, reason?: string) {
    const query = new URLSearchParams({ approve: String(approve), ...(reason ? { reason } : {}) });
    const res = await fetch(`${API_BASE}/api/admin/verify-kyc/${profileId}?${query}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getAdminEvents(): Promise<{ success: boolean; data: EventDetail[] }> {
    const res = await fetch(`${API_BASE}/api/admin/events-queue`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async verifyEvent(eventId: number, approve: boolean) {
    const res = await fetch(`${API_BASE}/api/admin/verify-event/${eventId}?approve=${approve}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getDisputes(): Promise<{ success: boolean; data: VenueDispute[] }> {
    const res = await fetch(`${API_BASE}/api/admin/disputes`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async disputeAction(eventId: number, action: string, adminNotes?: string) {
    const res = await fetch(`${API_BASE}/api/admin/dispute-action`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ eventId, action, adminNotes })
    });
    return res.json();
  },

  async getSettings(): Promise<{ success: boolean; data: SystemSetting[] }> {
    const res = await fetch(`${API_BASE}/api/admin/settings`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async updateSetting(key: string, value: string, description?: string) {
    const res = await fetch(`${API_BASE}/api/admin/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ key, value, description })
    });
    return res.json();
  },

  async getLedger(): Promise<{ success: boolean; data: LedgerEntry[] }> {
    const res = await fetch(`${API_BASE}/api/admin/ledger`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Python Geo-Verification & EXIF Fraud Engine
  async geoCheckIn(ticketId: number, latitude: number, longitude: number, accuracy: number) {
    const formData = new FormData();
    formData.append('ticket_id', String(ticketId));
    formData.append('latitude', String(latitude));
    formData.append('longitude', String(longitude));
    formData.append('accuracy', String(accuracy));

    const res = await fetch(`${PYTHON_BASE}/api/geo/check-in`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  async reportVenue(formData: FormData) {
    const res = await fetch(`${PYTHON_BASE}/api/geo/report-venue`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  }
};
