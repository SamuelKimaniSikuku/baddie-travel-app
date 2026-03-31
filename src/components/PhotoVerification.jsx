import { useState, useRef, useCallback } from "react";
import { supabase } from "./lib/supabase";

// ═══════════════════════════════════════════════════════════════
// BADDIE — Photo Upload + Identity Verification Components
// Drop these into your App.jsx or import them as needed
// ═══════════════════════════════════════════════════════════════

const T = {
  flame:"#FF4136",coral:"#FF6B5A",sunset:"#FF8C42",gold:"#FFB830",
  midnight:"#0A0A14",ink:"#14142B",charcoal:"#1E1E32",slate:"#2D2D48",
  ash:"#6E6E8A",mist:"#A0A0BE",white:"#FFFFFF",mint:"#00D4AA",
  electric:"#5B5BFF",rose:"#FF3B6F",sky:"#38BDF8",violet:"#A78BFA",
  lime:"#84CC16",glass:"rgba(255,255,255,0.06)",glassBorder:"rgba(255,255,255,0.1)",
};

// ─── Helpers ──────────────────────────────────────────────────
function compressImage(file, maxW = 1200, quality = 0.82) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width  = img.width  * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, "image/jpeg", quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadToSupabase(bucket, path, file) {
  const compressed = await compressImage(file);
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, compressed, { upsert: true, contentType: "image/jpeg" });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}

// ─── Photo Upload Drop Zone ───────────────────────────────────
function PhotoDropZone({ onFile, preview, label, icon, accept = "image/*" }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        borderRadius: 16, border: `2px dashed ${dragging ? T.flame : T.glassBorder}`,
        background: dragging ? T.flame + "10" : T.glass,
        cursor: "pointer", transition: "all .2s", overflow: "hidden",
        position: "relative", aspectRatio: "1",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}
    >
      {preview ? (
        <>
          <img src={preview} alt="preview" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 20 }}>✏️</span>
          </div>
        </>
      ) : (
        <>
          <span style={{ fontSize: 28, marginBottom: 6 }}>{icon || "📷"}</span>
          <span style={{ fontSize: 10, color: T.mist, textAlign: "center", padding: "0 8px" }}>{label || "Tap to upload"}</span>
        </>
      )}
      <input ref={inputRef} type="file" accept={accept} style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files[0]; if (f) onFile(f); }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PROFILE PHOTO UPLOADER
// Usage: <ProfilePhotoUploader userId={userId} currentPhotos={photos} onUpdate={setPhotos} />
// ══════════════════════════════════════════════════════════════
export function ProfilePhotoUploader({ userId, currentPhotos = [], onUpdate }) {
  const [photos, setPhotos] = useState(currentPhotos);
  const [uploading, setUploading] = useState(null); // index being uploaded
  const [error, setError] = useState("");
  const MAX_PHOTOS = 6;

  async function handleFile(file, index) {
    setError("");
    setUploading(index);
    try {
      const path = `${userId}/photo_${index}_${Date.now()}.jpg`;
      const url = await uploadToSupabase("profile-photos", path, file);
      const updated = [...photos];
      updated[index] = url;
      setPhotos(updated);

      // Save to profiles table
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({
          photos: updated.filter(Boolean),
          avatar_url: updated[0] || null,
        })
        .eq("id", userId);
      if (dbErr) throw dbErr;

      onUpdate?.(updated);
    } catch (e) {
      setError("Upload failed: " + (e.message || "please try again"));
    } finally {
      setUploading(null);
    }
  }

  async function removePhoto(index) {
    const updated = [...photos];
    updated[index] = null;
    setPhotos(updated);
    await supabase.from("profiles").update({
      photos: updated.filter(Boolean),
      avatar_url: updated.find(Boolean) || null,
    }).eq("id", userId);
    onUpdate?.(updated);
  }

  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => photos[i] || null);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700 }}>Profile Photos</p>
          <p style={{ fontSize: 10, color: T.ash, marginTop: 2 }}>{photos.filter(Boolean).length}/{MAX_PHOTOS} photos · First photo is your main photo</p>
        </div>
        {photos.filter(Boolean).length > 0 && (
          <div style={{ padding: "3px 10px", borderRadius: 8, background: T.mint + "18", border: `1px solid ${T.mint}33` }}>
            <span style={{ fontSize: 9, color: T.mint, fontWeight: 700 }}>✓ {photos.filter(Boolean).length} uploaded</span>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {slots.map((photo, i) => (
          <div key={i} style={{ position: "relative" }}>
            {uploading === i ? (
              <div style={{ aspectRatio: "1", borderRadius: 16, background: T.charcoal, border: "2px dashed " + T.glassBorder, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", border: `3px solid ${T.flame}`, borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 9, color: T.ash }}>Uploading...</span>
              </div>
            ) : (
              <PhotoDropZone
                preview={photo}
                onFile={(f) => handleFile(f, i)}
                label={i === 0 ? "Main photo" : `Photo ${i + 1}`}
                icon={i === 0 ? "🌟" : "📷"}
              />
            )}
            {photo && uploading !== i && (
              <button onClick={() => removePhoto(i)} style={{
                position: "absolute", top: 6, right: 6, width: 22, height: 22,
                borderRadius: "50%", border: "none", background: "rgba(0,0,0,.7)",
                color: T.white, fontSize: 12, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", lineHeight: 1,
              }}>×</button>
            )}
            {i === 0 && photo && (
              <div style={{ position: "absolute", bottom: 6, left: 6, background: T.flame, borderRadius: 6, padding: "2px 6px" }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: T.white }}>MAIN</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: T.rose + "18", border: `1px solid ${T.rose}33` }}>
          <p style={{ fontSize: 11, color: T.rose }}>⚠️ {error}</p>
        </div>
      )}

      <p style={{ fontSize: 10, color: T.ash, marginTop: 10, lineHeight: 1.5 }}>
        💡 Profiles with photos get <strong style={{ color: T.gold }}>3× more matches</strong>. Add at least 3 photos showing your face clearly.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// IDENTITY VERIFICATION FLOW
// Usage: <IdentityVerification userId={userId} currentStatus={verifyStatus} onComplete={handleComplete} />
// ══════════════════════════════════════════════════════════════
const DOC_TYPES = [
  { id: "passport",         label: "Passport",         icon: "🛂", desc: "International passport" },
  { id: "id_card",          label: "National ID",       icon: "🪪", desc: "Government-issued ID card" },
  { id: "drivers_license",  label: "Driver's License",  icon: "🚗", desc: "Valid driver's license" },
];

export function IdentityVerification({ userId, currentStatus = "unverified", onComplete }) {
  const [step, setStep] = useState("intro");     // intro → doctype → upload → selfie → review → done
  const [docType, setDocType] = useState(null);
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function setFileWithPreview(file, setFile, setPreview) {
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  }

  async function submit() {
    if (!frontFile || !selfieFile) return;
    setSubmitting(true);
    setError("");
    try {
      // Upload front
      const frontPath = `${userId}/front_${Date.now()}.jpg`;
      const frontUrl = await uploadToSupabase("id-documents", frontPath, frontFile);

      // Upload back if provided
      let backUrl = null;
      if (backFile) {
        const backPath = `${userId}/back_${Date.now()}.jpg`;
        backUrl = await uploadToSupabase("id-documents", backPath, backFile);
      }

      // Upload selfie
      const selfiePath = `${userId}/selfie_${Date.now()}.jpg`;
      const selfieUrl = await uploadToSupabase("id-documents", selfiePath, selfieFile);

      // Save verification record
      const { error: dbErr } = await supabase
        .from("verifications")
        .upsert({
          user_id:     userId,
          doc_type:    docType,
          front_path:  frontUrl,
          back_path:   backUrl,
          selfie_path: selfieUrl,
          status:      "pending",
          submitted_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (dbErr) throw dbErr;

      // Update profile status
      await supabase.from("profiles").update({
        verify_status: "pending",
        verify_submitted_at: new Date().toISOString(),
      }).eq("id", userId);

      setStep("done");
      onComplete?.("pending");
    } catch (e) {
      setError("Submission failed: " + (e.message || "please try again"));
    } finally {
      setSubmitting(false);
    }
  }

  const inp = { width: "100%", padding: "13px 16px", borderRadius: 14, border: "1px solid " + T.glassBorder, background: T.glass, color: T.white, fontSize: 14, outline: "none" };

  // Already verified
  if (currentStatus === "verified") return (
    <div style={{ padding: "20px 16px", borderRadius: 18, background: T.mint + "12", border: `1px solid ${T.mint}33`, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 10 }}>✅</div>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: T.mint }}>Identity Verified</h3>
      <p style={{ color: T.ash, fontSize: 12, marginTop: 6, lineHeight: 1.6 }}>Your identity has been verified. You have a verified badge on your profile!</p>
    </div>
  );

  // Pending review
  if (currentStatus === "pending" && step !== "done") return (
    <div style={{ padding: "20px 16px", borderRadius: 18, background: T.gold + "10", border: `1px solid ${T.gold}33`, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 10 }}>⏳</div>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: T.gold }}>Under Review</h3>
      <p style={{ color: T.ash, fontSize: 12, marginTop: 6, lineHeight: 1.6 }}>Your documents are being reviewed. This usually takes 24–48 hours. We'll notify you by email once complete.</p>
    </div>
  );

  // Step: Intro
  if (step === "intro") return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🛡️</div>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700 }}>Verify Your Identity</h3>
        <p style={{ color: T.mist, fontSize: 12, marginTop: 6, lineHeight: 1.6 }}>Build trust with other travelers. Verified users get a ✅ badge and up to 5× more matches.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {[
          { icon: "🔒", title: "Secure & Private", desc: "Your documents are encrypted and never shared with other users" },
          { icon: "⚡", title: "Fast Review", desc: "Most verifications are approved within 24 hours" },
          { icon: "✅", title: "Verified Badge", desc: "Get a visible badge that shows you're a real traveler" },
        ].map(item => (
          <div key={item.title} style={{ display: "flex", gap: 12, padding: "12px 14px", borderRadius: 14, background: T.glass, border: "1px solid " + T.glassBorder }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</p>
              <p style={{ fontSize: 11, color: T.ash, marginTop: 2 }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setStep("doctype")} style={{ width: "100%", padding: "13px", borderRadius: 14, border: "none", background: `linear-gradient(135deg,${T.flame},${T.sunset})`, color: T.white, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
        Start Verification 🛂
      </button>
    </div>
  );

  // Step: Choose document type
  if (step === "doctype") return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setStep("intro")} style={{ background: "none", border: "none", color: T.mist, fontSize: 20, cursor: "pointer" }}>←</button>
        <div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700 }}>Choose Document</h3>
          <p style={{ fontSize: 10, color: T.ash }}>Step 1 of 3</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {DOC_TYPES.map(doc => (
          <div key={doc.id} onClick={() => setDocType(doc.id)}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px", borderRadius: 16, background: docType === doc.id ? T.flame + "18" : T.glass, border: `1.5px solid ${docType === doc.id ? T.flame : T.glassBorder}`, cursor: "pointer", transition: "all .2s" }}>
            <span style={{ fontSize: 28 }}>{doc.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: docType === doc.id ? T.coral : T.white }}>{doc.label}</p>
              <p style={{ fontSize: 11, color: T.ash, marginTop: 2 }}>{doc.desc}</p>
            </div>
            {docType === doc.id && <span style={{ fontSize: 18, color: T.flame }}>✓</span>}
          </div>
        ))}
      </div>

      <button onClick={() => setStep("upload")} disabled={!docType}
        style={{ width: "100%", padding: "13px", borderRadius: 14, border: "none", background: docType ? `linear-gradient(135deg,${T.flame},${T.sunset})` : T.slate, color: T.white, fontSize: 14, fontWeight: 700, cursor: docType ? "pointer" : "default", opacity: docType ? 1 : 0.5 }}>
        Continue →
      </button>
    </div>
  );

  // Step: Upload document photos
  if (step === "upload") return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setStep("doctype")} style={{ background: "none", border: "none", color: T.mist, fontSize: 20, cursor: "pointer" }}>←</button>
        <div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700 }}>Upload Document</h3>
          <p style={{ fontSize: 10, color: T.ash }}>Step 2 of 3 · {DOC_TYPES.find(d => d.id === docType)?.label}</p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Front of document *</p>
        <PhotoDropZone
          preview={frontPreview}
          onFile={(f) => setFileWithPreview(f, setFrontFile, setFrontPreview)}
          label="Take photo or upload front"
          icon="📄"
        />
      </div>

      {docType !== "passport" && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Back of document <span style={{ color: T.ash, fontWeight: 400 }}>(optional)</span></p>
          <PhotoDropZone
            preview={backPreview}
            onFile={(f) => setFileWithPreview(f, setBackFile, setBackPreview)}
            label="Take photo or upload back"
            icon="📄"
          />
        </div>
      )}

      <div style={{ padding: "10px 12px", borderRadius: 10, background: T.sky + "10", border: `1px solid ${T.sky}22`, marginBottom: 16 }}>
        <p style={{ fontSize: 10, color: T.sky, lineHeight: 1.5 }}>📸 Make sure all text is clearly visible, the document is not expired, and there's no glare or blur.</p>
      </div>

      <button onClick={() => setStep("selfie")} disabled={!frontFile}
        style={{ width: "100%", padding: "13px", borderRadius: 14, border: "none", background: frontFile ? `linear-gradient(135deg,${T.flame},${T.sunset})` : T.slate, color: T.white, fontSize: 14, fontWeight: 700, cursor: frontFile ? "pointer" : "default", opacity: frontFile ? 1 : 0.5 }}>
        Continue →
      </button>
    </div>
  );

  // Step: Selfie
  if (step === "selfie") return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setStep("upload")} style={{ background: "none", border: "none", color: T.mist, fontSize: 20, cursor: "pointer" }}>←</button>
        <div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700 }}>Take a Selfie</h3>
          <p style={{ fontSize: 10, color: T.ash }}>Step 3 of 3</p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <PhotoDropZone
          preview={selfiePreview}
          onFile={(f) => setFileWithPreview(f, setSelfieFile, setSelfiePreview)}
          label="Take a clear selfie holding your document"
          icon="🤳"
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {[
          "Hold your document next to your face",
          "Make sure both your face and document are clearly visible",
          "Good lighting, no sunglasses or hats",
        ].map((tip, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ color: T.mint, fontSize: 12, marginTop: 1 }}>✓</span>
            <span style={{ fontSize: 11, color: T.mist }}>{tip}</span>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ padding: "10px 12px", borderRadius: 10, background: T.rose + "18", border: `1px solid ${T.rose}33`, marginBottom: 12 }}>
          <p style={{ fontSize: 11, color: T.rose }}>⚠️ {error}</p>
        </div>
      )}

      <button onClick={submit} disabled={!selfieFile || submitting}
        style={{ width: "100%", padding: "13px", borderRadius: 14, border: "none", background: selfieFile && !submitting ? `linear-gradient(135deg,${T.flame},${T.sunset})` : T.slate, color: T.white, fontSize: 14, fontWeight: 700, cursor: selfieFile && !submitting ? "pointer" : "default", opacity: selfieFile && !submitting ? 1 : 0.6 }}>
        {submitting ? "Submitting... ⏳" : "Submit for Review 🛂"}
      </button>

      <p style={{ fontSize: 10, color: T.ash, textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
        🔒 Your documents are encrypted and only seen by our verification team. We never share them with other users.
      </p>
    </div>
  );

  // Step: Done
  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ fontSize: 64, marginBottom: 16, animation: "popIn .6s cubic-bezier(.34,1.56,.64,1)" }}>🎉</div>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Submitted!</h3>
      <p style={{ color: T.mist, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
        Your verification is under review. We'll email you within 24–48 hours once it's approved.
      </p>
      <div style={{ padding: "14px 16px", borderRadius: 14, background: T.gold + "12", border: `1px solid ${T.gold}33` }}>
        <p style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>⏳ Pending Review</p>
        <p style={{ fontSize: 10, color: T.ash, marginTop: 4 }}>Your verified badge will appear automatically once approved</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// COMBINED PROFILE EDITOR (drop into ProfileScreen)
// ══════════════════════════════════════════════════════════════
export function ProfileMediaSection({ userId, photos, verifyStatus, onPhotosUpdate, onVerifyComplete }) {
  const [tab, setTab] = useState("photos");

  return (
    <div>
      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[
          { id: "photos", label: "📸 Photos" },
          { id: "verify", label: "🛡️ Verify ID" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "9px", borderRadius: 12,
            border: `1.5px solid ${tab === t.id ? T.flame : T.glassBorder}`,
            background: tab === t.id ? T.flame + "18" : T.glass,
            color: tab === t.id ? T.coral : T.mist,
            fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .2s",
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "photos" && (
        <ProfilePhotoUploader
          userId={userId}
          currentPhotos={photos}
          onUpdate={onPhotosUpdate}
        />
      )}
      {tab === "verify" && (
        <IdentityVerification
          userId={userId}
          currentStatus={verifyStatus}
          onComplete={onVerifyComplete}
        />
      )}
    </div>
  );
}

export default ProfileMediaSection;
