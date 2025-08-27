"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    const formData = new FormData(event.target);
    const email = formData.get("email");
    const password = formData.get("password");
    const role = formData.get("role") || "user";
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form className="bg-white p-8 rounded shadow-md w-full max-w-md" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-6">Register</h2>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {success && <div className="text-green-600 mb-4">Registration successful! Redirecting...</div>}
        <input name="email" type="email" placeholder="Email" required className="w-full mb-4 p-2 border rounded" />
        <input name="password" type="password" placeholder="Password" required className="w-full mb-4 p-2 border rounded" />
        <select name="role" className="w-full mb-4 p-2 border rounded">
          <option value="user">User</option>
          <option value="staff">Staff</option>
        </select>
        <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white py-2 rounded font-bold">
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
