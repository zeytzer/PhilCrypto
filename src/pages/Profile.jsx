// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function Profile() {
  const { user } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name,last_name,avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        toast.error("Profil Yüklenirken Hata Oluştu");
      } else if (data) {
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setAvatarUrl(data.avatar_url || "");
      }

      setLoading(false);
    })();
  }, [user]);

  const updateProfile = async () => {
    setLoading(true);
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
      },
      { onConflict: "id" }
    );
    setLoading(false);
    error
      ? toast.error(error.message)
      : toast.success("Profil Başarıyla Güncellendi");
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop();
    const path = `${user.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) return toast.error("Yükleme Yapılamadı");

    const { data, error: urlError } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    if (urlError) return toast.error("URL error");

    const { error: dbError } = await supabase
      .from("profiles")
      .upsert(
        { id: user.id, avatar_url: data.publicUrl },
        { onConflict: "id" }
      );

    if (dbError) return toast.error("Veritabanı Güncellenirken Sorun Oluştu");

    setAvatarUrl(data.publicUrl);
    window.dispatchEvent(
      new CustomEvent("avatarUpdated", { detail: data.publicUrl })
    );
    toast.success("Profil Fotoğrafı Güncellendi");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <span className="text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 flex items-center justify-center">
      <div className="flex flex-col md:flex-row items-center justify-center gap-12 max-w-4xl w-full">
        {/* Avatar Section */}
        <div className="bg-[#111] p-6 rounded-2xl shadow-lg w-full md:w-1/2 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Profile Photo</h2>
          <img
            src={avatarUrl || "/placeholder.png"}
            alt="Avatar"
            className="w-32 h-32 rounded-full mb-4 border border-gray-700 object-cover mx-auto"
          />
          <label className="inline-block bg-gradient-to-r from-gray-800 to-gray-900 text-white px-5 py-2 rounded-lg cursor-pointer hover:opacity-90 transition">
            Fotoğraf Seç
            <input
              type="file"
              accept="image/*"
              onChange={uploadAvatar}
              className="hidden"
            />
          </label>
        </div>

        {/* Profile Info Section */}
        <div className="bg-[#111] p-6 rounded-2xl shadow-lg w-full md:w-1/2 space-y-4">
          <h2 className="text-2xl font-bold text-white text-center">
            Profil Bilgilerini Düzenle
          </h2>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
            className="w-full bg-black border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
            className="w-full bg-black border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <input
            type="email"
            value={user.email}
            readOnly
            className="w-full bg-black border border-gray-600 rounded-lg px-4 py-3 text-gray-500"
          />
          <button
            onClick={updateProfile}
            disabled={loading}
            className="w-full bg-gradient-to-r from-gray-800 to-gray-900 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition"
          >
            Profili Güncelle
          </button>
        </div>
      </div>
    </div>
  );
}
