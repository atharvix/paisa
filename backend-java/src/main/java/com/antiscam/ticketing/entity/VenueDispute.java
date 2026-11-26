package com.antiscam.ticketing.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "venue_disputes")
public class VenueDispute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_user_id", nullable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;

    @Column(name = "reporter_latitude", nullable = false, precision = 10, scale = 7)
    private BigDecimal reporterLatitude;

    @Column(name = "reporter_longitude", nullable = false, precision = 10, scale = 7)
    private BigDecimal reporterLongitude;

    @Column(name = "gps_accuracy_meters", nullable = false, precision = 8, scale = 2)
    private BigDecimal gpsAccuracyMeters;

    @Column(name = "distance_from_venue_meters", nullable = false, precision = 8, scale = 2)
    private BigDecimal distanceFromVenueMeters;

    @Column(name = "photo_url", nullable = false, columnDefinition = "TEXT")
    private String photoUrl;

    @Column(name = "exif_capture_time")
    private OffsetDateTime exifCaptureTime;

    @Column(name = "exif_camera_make", length = 100)
    private String exifCameraMake;

    @Column(name = "exif_camera_model", length = 100)
    private String exifCameraModel;

    @Enumerated(EnumType.STRING)
    @Column(name = "exif_validation_status", nullable = false, length = 50)
    private ExifStatus exifValidationStatus = ExifStatus.VERIFIED_VALID;

    @Column(name = "report_text", nullable = false, columnDefinition = "TEXT")
    private String reportText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private DisputeStatus status = DisputeStatus.PENDING_REVIEW;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public VenueDispute() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
    public User getReporter() { return reporter; }
    public void setReporter(User reporter) { this.reporter = reporter; }
    public Ticket getTicket() { return ticket; }
    public void setTicket(Ticket ticket) { this.ticket = ticket; }
    public BigDecimal getReporterLatitude() { return reporterLatitude; }
    public void setReporterLatitude(BigDecimal reporterLatitude) { this.reporterLatitude = reporterLatitude; }
    public BigDecimal getReporterLongitude() { return reporterLongitude; }
    public void setReporterLongitude(BigDecimal reporterLongitude) { this.reporterLongitude = reporterLongitude; }
    public BigDecimal getGpsAccuracyMeters() { return gpsAccuracyMeters; }
    public void setGpsAccuracyMeters(BigDecimal gpsAccuracyMeters) { this.gpsAccuracyMeters = gpsAccuracyMeters; }
    public BigDecimal getDistanceFromVenueMeters() { return distanceFromVenueMeters; }
    public void setDistanceFromVenueMeters(BigDecimal distanceFromVenueMeters) { this.distanceFromVenueMeters = distanceFromVenueMeters; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public OffsetDateTime getExifCaptureTime() { return exifCaptureTime; }
    public void setExifCaptureTime(OffsetDateTime exifCaptureTime) { this.exifCaptureTime = exifCaptureTime; }
    public String getExifCameraMake() { return exifCameraMake; }
    public void setExifCameraMake(String exifCameraMake) { this.exifCameraMake = exifCameraMake; }
    public String getExifCameraModel() { return exifCameraModel; }
    public void setExifCameraModel(String exifCameraModel) { this.exifCameraModel = exifCameraModel; }
    public ExifStatus getExifValidationStatus() { return exifValidationStatus; }
    public void setExifValidationStatus(ExifStatus exifValidationStatus) { this.exifValidationStatus = exifValidationStatus; }
    public String getReportText() { return reportText; }
    public void setReportText(String reportText) { this.reportText = reportText; }
    public DisputeStatus getStatus() { return status; }
    public void setStatus(DisputeStatus status) { this.status = status; }
    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
