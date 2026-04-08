
import React, { useEffect, useRef, useState } from "react";
import "./student-food-photos.css";

const MEAL_LABELS = {
  BREAKFAST: "🍳 Breakfast",
  LUNCH: "🍛 Lunch",
  SNACKS: "☕ Snacks",
  DINNER: "🍽 Dinner",
  OTHER: "Other"
};

function groupPhotosByMealType(photos) {
  const groups = { BREAKFAST: [], LUNCH: [], SNACKS: [], DINNER: [], OTHER: [] };
  photos.forEach((p) => {
    (groups[p.mealType] || groups.OTHER).push(p);
  });
  return groups;
}

function StudentFoodPhotosPage() {
  const [photos, setPhotos] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    fetch("/api/student-photos/today")
      .then((r) => r.json())
      .then((data) => setPhotos(data.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))));
  }, []);

  const handleUploadClick = () => fileInputRef.current.click();

  const handleFileChange = (e) => {
    setImageFiles(Array.from(e.target.files));
    setShowDialog(true);
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setImageFiles([]);
    setDescription("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFiles.length) return;
    setUploading(true);
    const formData = new FormData();
    imageFiles.forEach((file) => formData.append("images", file));
    if (description) formData.append("description", description);
    const res = await fetch("/api/student-photos/upload", {
      method: "POST",
      body: formData
    });
    if (res.ok) {
      const newPhoto = await res.json();
      setPhotos((prev) => [newPhoto, ...prev]);
      handleDialogClose();
    } else {
      alert("Upload failed");
    }
    setUploading(false);
  };

  const grouped = groupPhotosByMealType(photos);

  return (
    <div className="student-photos-page">
      <h1 className="student-photos-title">Student Food Photos</h1>
      <button className="floating-upload-btn" onClick={handleUploadClick} title="Upload Photo">
        <span role="img" aria-label="camera">📷</span>
      </button>
      <input
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      {showDialog && (
        <div className="upload-dialog-backdrop">
          <form className="upload-dialog" onSubmit={handleSubmit}>
            <h2>Upload Food Photos</h2>
            <div style={{ display: "flex", gap: 8, width: "100%", overflowX: "auto" }}>
              {imageFiles.map((file, idx) => (
                <img
                  key={idx}
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="upload-preview-img"
                  style={{ maxWidth: 100, maxHeight: 100 }}
                />
              ))}
            </div>
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="upload-description"
            />
            <div className="upload-actions">
              <button type="button" onClick={handleDialogClose} disabled={uploading}>Cancel</button>
              <button type="submit" disabled={uploading || !imageFiles.length}>{uploading ? "Uploading..." : "Submit"}</button>
            </div>
          </form>
        </div>
      )}
      <div className="photos-group-list">
        {Object.entries(MEAL_LABELS).map(([mealType, label]) =>
          grouped[mealType] && grouped[mealType].length > 0 ? (
            <section key={mealType} className="photos-group-section">
              <h2 className="photos-group-label">{label}</h2>
              <div className="photos-list">
                {grouped[mealType].map((photo) => (
                  <div className="photo-card" key={photo.id}>
                    <PhotoCarousel imageUrls={photo.imageUrls || []} />
                    {photo.description && <div className="photo-desc">{photo.description}</div>}
                  </div>
                ))}
              </div>
            </section>
          ) : null
        )}
      </div>
    </div>
  );
}

export default StudentFoodPhotosPage;

// Simple carousel/swipe for images
function PhotoCarousel({ imageUrls }) {
  const [idx, setIdx] = React.useState(0);
  if (!imageUrls.length) return null;
  const prev = () => setIdx((i) => (i === 0 ? imageUrls.length - 1 : i - 1));
  const next = () => setIdx((i) => (i === imageUrls.length - 1 ? 0 : i + 1));
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <img src={imageUrls[idx]} alt="food" className="photo-img" />
      {imageUrls.length > 1 && (
        <>
          <button style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.3)", color: "#fff", border: 0, borderRadius: "50%", width: 32, height: 32, cursor: "pointer" }} onClick={prev}>{"<"}</button>
          <button style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.3)", color: "#fff", border: 0, borderRadius: "50%", width: 32, height: 32, cursor: "pointer" }} onClick={next}>{">"}</button>
        </>
      )}
      <div style={{ textAlign: "center", marginTop: 4 }}>
        {imageUrls.map((_, i) => (
          <span key={i} style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: i === idx ? "#2563eb" : "#d1d5db", margin: "0 2px" }} />
        ))}
      </div>
    </div>
  );
}
