import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabase";

export default function AvatarUploader() {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (file) => {
    if (!file) return;
    setUploading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User not found");
        return;
      }

      const ext = file.name.split(".").pop();
      const filePath = `${user.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = data?.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      console.log("Avatar updated");
      window.location.reload();
    } catch (err) {
      console.error("Upload failed:", err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) uploadAvatar(file);
  };

  return (
    <div className="flex flex-col items-center">
      <label
        htmlFor="avatar-upload"
        className="cursor-pointer px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
      >
        {uploading ? t("Uploading...") : t("Change Photo")}
      </label>
      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
