"use client";

import { useState } from "react";
import { fetchSession, logoutSession } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function UserProfileEdit() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    whatsappNotifications: true,
    language: "az",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    const user = await fetchSession();
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        emailNotifications: true,
        whatsappNotifications: true,
        language: "az",
      });
      setIsOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Password validation
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage("Şifrələr uyğun gəlmir.");
      setLoading(false);
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 8) {
      setMessage("Yeni şifrə ən az 8 simvol olmalıdır.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          emailNotifications: formData.emailNotifications,
          whatsappNotifications: formData.whatsappNotifications,
          language: formData.language,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setMessage("Profil uğurla yeniləndi!");
        setTimeout(() => {
          setIsOpen(false);
          setMessage("");
          // Refresh the page to update sidebar
          router.refresh();
        }, 1500);
      } else {
        setMessage(data.error || "Xəta baş verdi.");
      }
    } catch (error) {
      setMessage("Xəta baş verdi. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" className="dash-edit-btn" onClick={handleOpen}>
        Edit profile
      </button>

      {isOpen && (
        <div className="dash-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <h2 className="dash-modal-title">Edit Profile</h2>
              <button type="button" className="dash-modal-close" onClick={() => setIsOpen(false)}>
                ✕
              </button>
            </div>

            <form className="dash-profile-form" onSubmit={handleSubmit}>
              <div className="dash-profile-form-section">
                <h3 className="dash-profile-section-title">Personal Information</h3>
                <div className="dash-profile-form-row">
                  <div className="dash-profile-form-field">
                    <label className="dash-profile-form-label">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="dash-profile-form-input"
                    />
                  </div>
                  <div className="dash-profile-form-field">
                    <label className="dash-profile-form-label">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="dash-profile-form-input"
                    />
                  </div>
                </div>
                <div className="dash-profile-form-field">
                  <label className="dash-profile-form-label">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="dash-profile-form-input"
                  />
                </div>
              </div>

              <div className="dash-profile-form-section">
                <h3 className="dash-profile-section-title">Change Password</h3>
                <p className="dash-profile-section-desc">Leave blank to keep current password</p>
                <div className="dash-profile-form-field">
                  <label className="dash-profile-form-label">Current Password</label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="dash-profile-form-input"
                  />
                </div>
                <div className="dash-profile-form-row">
                  <div className="dash-profile-form-field">
                    <label className="dash-profile-form-label">New Password</label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="dash-profile-form-input"
                    />
                  </div>
                  <div className="dash-profile-form-field">
                    <label className="dash-profile-form-label">Confirm New Password</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="dash-profile-form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="dash-profile-form-section">
                <h3 className="dash-profile-section-title">Preferences</h3>
                <div className="dash-profile-form-field">
                  <label className="dash-profile-form-label">Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="dash-profile-form-select"
                  >
                    <option value="az">Azərbaycan</option>
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                  </select>
                </div>
                <div className="dash-profile-form-row">
                  <label className="dash-profile-form-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifications}
                      onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                    />
                    <span>Email notifications</span>
                  </label>
                  <label className="dash-profile-form-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.whatsappNotifications}
                      onChange={(e) => setFormData({ ...formData, whatsappNotifications: e.target.checked })}
                    />
                    <span>WhatsApp notifications</span>
                  </label>
                </div>
              </div>

              {message && (
                <div className={`dash-profile-message ${message.includes("Xəta") ? "dash-profile-message--error" : "dash-profile-message--success"}`}>
                  {message}
                </div>
              )}

              <div className="dash-profile-form-actions">
                <button type="button" className="dash-profile-btn-secondary" onClick={() => setIsOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="dash-profile-btn-primary" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
