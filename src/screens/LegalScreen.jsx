import { T } from "../theme";

// ══════════════════════════════════════════════════════════════
// LegalScreen — Privacy Policy and Terms of Service.
// Reached at /privacy and /terms (public, no login needed).
// NOTE: sensible, KYC-aware starting text — have a lawyer review
// before launch, and set the real company/entity name.
// ══════════════════════════════════════════════════════════════

var UPDATED = "13 August 2026";
var CONTACT = "support@baddie.app";

function Shell({ title, children }) {
  return <div className="doc-page" style={{ background:T.midnight, color:T.white }}>
    <div className="doc-inner">
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <span onClick={function(){ window.location.href = "/"; }} style={{ fontSize:22, cursor:"pointer", color:T.coral }}>✈️</span>
        <span onClick={function(){ window.location.href = "/"; }} style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900, cursor:"pointer",
          background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>baddie</span>
      </div>
      <h1>{title}</h1>
      <p style={{ color:T.ash, fontSize:12, marginBottom:20 }}>Last updated: {UPDATED}</p>
      {children}
      <div style={{ marginTop:40, paddingTop:20, borderTop:"1px solid "+T.glassBorder, display:"flex", gap:16, flexWrap:"wrap" }}>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
        <a href="/">← Back to Baddie</a>
      </div>
    </div>
  </div>;
}

function PrivacyPolicy() {
  return <Shell title="Privacy Policy">
    <p>Baddie ("we", "us") helps travelers find trustworthy companions. This policy explains what we collect, why, and the choices you have. By using Baddie you agree to this policy.</p>

    <h2>Information we collect</h2>
    <ul>
      <li><strong>Profile details</strong> you provide: name or nickname, avatar/photos, city, bio, travel destinations and dates, travel vibe, budget, interests and languages.</li>
      <li><strong>Account data</strong>: your email address and authentication details.</li>
      <li><strong>Activity</strong>: matches, messages, trips, saved flights and checklist items you create.</li>
      <li><strong>Identity verification</strong>: if you choose to verify, our verification partner (Didit) captures and checks your government ID and a selfie/liveness scan. See below.</li>
      <li><strong>Technical data</strong>: basic device and log information needed to run and secure the service.</li>
    </ul>

    <h2>Identity verification &amp; biometric data</h2>
    <p>Verification is optional but recommended for trust. When you verify, your ID document and facial scan are collected and processed by <strong>Didit</strong>, our third-party identity provider, on their systems — <strong>these images never touch Baddie's servers</strong>. We receive only the outcome (approved, in review, or declined) and store a verification record and a verified/not-verified status on your profile. Didit's handling of your documents is governed by their own privacy policy. We use this solely to confirm you are a real person and to prevent duplicate or fraudulent accounts.</p>

    <h2>How we use your information</h2>
    <ul>
      <li>To create your profile and show you to compatible travelers.</li>
      <li>To power matching, messaging, trip planning and notifications.</li>
      <li>To display a verified badge once your identity is confirmed.</li>
      <li>To keep the community safe — detecting abuse, fraud and duplicate accounts.</li>
      <li>To operate, maintain and improve the service.</li>
    </ul>

    <h2>What other users can see</h2>
    <p>Your profile (name, avatar/photos, city, bio, destination, interests and verified badge) is visible to other travelers in discovery and matches. Your email and verification documents are never shown to other users. You control what appears via Privacy settings.</p>

    <h2>Sharing</h2>
    <p>We do not sell your personal data. We share it only with: our identity provider (Didit) for verification; our infrastructure providers (e.g. Supabase) that host the service on our behalf; and authorities where required by law or to protect users' safety.</p>

    <h2>Data retention</h2>
    <p>We keep your data while your account is active. When you delete your account we delete or anonymize your personal data within a reasonable period, except where we must retain limited records for legal, security or fraud-prevention purposes.</p>

    <h2>Your rights</h2>
    <p>You can access and update your profile at any time in the app, and request deletion of your account and data by contacting us. Depending on where you live, you may also have rights to portability, restriction, or to object to certain processing.</p>

    <h2>Security</h2>
    <p>We use row-level security, encryption in transit, private storage for sensitive files, and access controls. No system is perfectly secure, but we work to protect your information and to limit who can access it.</p>

    <h2>Age</h2>
    <p>Baddie is only for people aged 18 and over. We do not knowingly collect data from anyone under 18.</p>

    <h2>Changes</h2>
    <p>We may update this policy. Material changes will be notified in the app or by email. Continued use after an update means you accept the revised policy.</p>

    <h2>Contact</h2>
    <p>Questions or requests: <a href={"mailto:"+CONTACT}>{CONTACT}</a>.</p>
  </Shell>;
}

function Terms() {
  return <Shell title="Terms of Service">
    <p>These terms govern your use of Baddie. By creating an account or using the service, you agree to them. If you do not agree, please do not use Baddie.</p>

    <h2>Eligibility</h2>
    <p>You must be at least 18 years old and legally able to enter this agreement. You are responsible for the accuracy of the information you provide.</p>

    <h2>Your account</h2>
    <p>Keep your login credentials secure and don't share your account. You are responsible for activity under your account. One person may hold one account; duplicate accounts (including a second identity verification of the same face) may be declined or removed.</p>

    <h2>Identity verification</h2>
    <p>Verification is optional and performed by our partner Didit. A verified badge indicates identity was confirmed at a point in time; it is not a guarantee of a person's conduct, intentions or safety. Verification decisions (including automated declines for duplicate identities) are made using the provider's checks; if you believe a decision is wrong, contact support.</p>

    <h2>Acceptable use</h2>
    <p>You agree not to:</p>
    <ul>
      <li>Harass, threaten, defraud, impersonate or endanger other users.</li>
      <li>Post unlawful, hateful, sexually exploitative, or misleading content.</li>
      <li>Solicit money, run scams, or use the service for commercial spam.</li>
      <li>Attempt to access other users' data, bypass security, or scrape the service.</li>
      <li>Use Baddie if you are a registered sex offender or barred by law from such services.</li>
    </ul>

    <h2>Safety &amp; meeting travelers</h2>
    <p><strong>Baddie does not conduct criminal background checks and is not responsible for the conduct of any user, online or offline.</strong> Traveling and meeting people you meet online carries risk. Always take precautions: meet in public first, tell someone your plans, and trust your instincts. You interact with and travel alongside other users entirely at your own risk.</p>

    <h2>Content</h2>
    <p>You retain ownership of the content you post, and you grant us a license to host and display it to operate the service. You must have the right to share anything you upload. We may remove content or accounts that violate these terms.</p>

    <h2>Trips, flights and third-party info</h2>
    <p>Trip plans, flight results and other travel information are provided for convenience and may be inaccurate or incomplete. Confirm details with airlines and official sources before relying on them. We are not a travel agent and do not sell flights.</p>

    <h2>Termination</h2>
    <p>You may delete your account at any time. We may suspend or terminate accounts that violate these terms or harm the community.</p>

    <h2>Disclaimers &amp; liability</h2>
    <p>The service is provided "as is" without warranties of any kind. To the fullest extent permitted by law, Baddie is not liable for indirect, incidental or consequential damages, or for the acts of other users.</p>

    <h2>Changes</h2>
    <p>We may update these terms. Continued use after changes means you accept them.</p>

    <h2>Contact</h2>
    <p>Questions: <a href={"mailto:"+CONTACT}>{CONTACT}</a>.</p>
  </Shell>;
}

export default function LegalScreen({ page }) {
  return page === "terms" ? <Terms /> : <PrivacyPolicy />;
}
