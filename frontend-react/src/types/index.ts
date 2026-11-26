export type Role = 'ROLE_ATTENDEE' | 'ROLE_HOST' | 'ROLE_ADMIN';

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  role: Role;
  kycStatus?: string;
  razorpayAccountId?: string;
}

export interface TicketTier {
  id: number;
  name: string;
  price: number;
  totalCapacity: number;
  reservedCount: number;
  soldCount: number;
  availableSeats: number;
}

export interface EventDetail {
  id: number;
  hostId: number;
  hostName: string;
  hostBusinessName?: string;
  title: string;
  descriptionMarkdown: string;
  venueName: string;
  venueAddress: string;
  venueLatitude: number;
  venueLongitude: number;
  startTime: string;
  endTime: string;
  escrowReleaseTime: string;
  status: 'DRAFT' | 'PENDING_VERIFICATION' | 'VERIFIED_LIVE' | 'COMPLETED' | 'CANCELED' | 'FROZEN_DISPUTE' | 'RELEASED_SETTLED';
  venueBookingProofUrl: string;
  ticketTiers: TicketTier[];
  totalTicketsSold: number;
  checkedInCount: number;
  disputeCount: number;
}

export type TicketStatus = 'PAID_HELD_IN_ESCROW' | 'CHECKED_IN' | 'DISPUTE_FROZEN' | 'AUTO_REFUNDED' | 'SETTLED_RELEASED';

export interface Ticket {
  id: number;
  ticketNumber: string;
  eventId: number;
  eventTitle: string;
  venueName: string;
  venueAddress: string;
  venueLatitude: number;
  venueLongitude: number;
  startTime: string;
  endTime: string;
  tierName: string;
  purchasePrice: number;
  status: TicketStatus;
  qrCodeSignature: string;
  checkedInAt?: string;
  escrowReleaseTime: string;
  idempotencyKey: string;
}

export interface EscrowBreakdown {
  eventId: number;
  eventTitle: string;
  hostAccountId: string;
  grossTicketSales: number;
  gatewayFeeAmount: number;
  platformFeePercent: number;
  platformFeeAmount: number;
  netHeldPayout: number;
  escrowStatus: 'ON_HOLD' | 'FROZEN_DISPUTE' | 'RELEASED' | 'REFUNDED';
  onHoldUntil: string;
  secondsRemainingToRelease: number;
  canSelfCancel: boolean;
  hostExternalAccountNote: string;
}

export interface HostProfile {
  id: number;
  panNumber: string;
  bankAccountNumber: string;
  bankIfsc: string;
  businessName: string;
  businessEntityType: string;
  razorpayAccountId?: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  kycDocumentUrl?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface VenueDispute {
  id: number;
  eventId: number;
  reporterUserId: number;
  ticketId?: number;
  reporterLatitude: number;
  reporterLongitude: number;
  gpsAccuracyMeters: number;
  distanceFromVenueMeters: number;
  photoUrl: string;
  exifCaptureTime?: string;
  exifCameraMake?: string;
  exifCameraModel?: string;
  exifValidationStatus: 'VERIFIED_VALID' | 'SUSPECT_METADATA_MISSING' | 'TAMPERED_TIMESTAMPS';
  reportText: string;
  status: 'PENDING_REVIEW' | 'RESOLVED_SCAM_CONFIRMED' | 'DISMISSED_FALSE_REPORT';
  adminNotes?: string;
  createdAt: string;
}

export interface LedgerEntry {
  id: number;
  entryId: string;
  transactionId: string;
  idempotencyKey: string;
  accountFrom: string;
  accountTo: string;
  amount: number;
  currency: string;
  entryType: string;
  metadataJson?: string;
  createdAt: string;
}

export interface SystemSetting {
  settingKey: string;
  settingValue: string;
  description?: string;
  updatedAt: string;
  updatedBy: string;
}
