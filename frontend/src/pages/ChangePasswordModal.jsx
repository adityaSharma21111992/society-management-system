import React, { useState } from "react";

const ChangePasswordModal = ({ onClose }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage("");

  if (!oldPassword || !newPassword || !confirmPassword) {
    return setMessage("All fields are required");
  }

  if (newPassword !== confirmPassword) {
    return setMessage("New passwords do not match");
  }

  try {
    setLoading(true);
    const token = localStorage.getItem("token");
    const user_id = localStorage.getItem("user_id");

    console.log("🔹 Token used:", token);


    const res = await fetch("http://localhost:5000/api/users/change-password", {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ fixed
      },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || data.message);

    setMessage(data.message || "Password updated successfully");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setTimeout(() => onClose(), 2000);
  } catch (err) {
    setMessage(err.message || "Failed to update password. Try again.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-center">
          Change Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full border rounded-lg p-2 outline-none"
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border rounded-lg p-2 outline-none"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border rounded-lg p-2 outline-none"
          />

          {message && (
            <p
              className={`text-center text-sm ${
                message.includes("✅") ? "text-green-600" : "text-red-500"
              }`}
            >
              {message}
            </p>
          )}

          <div className="flex justify-between items-center mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-gray-300 hover:bg-gray-400"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
