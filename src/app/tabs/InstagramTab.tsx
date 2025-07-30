import React, { useEffect, useState } from "react";

// Hilfsfunktionen für Level/EXP
const levelThresholds = [39, 119, 239, 399, 599, 839, 1119, 1439, 1799, 2199, 2639, 3119, 3639, 4199, 4799, 5439, 6119, 6839, 7599, 8399, 9239, 10119, 11039, 11999, 12999, 14039, 15119, 16239, 17399, 18599, 19839, 21119, 22439, 23799, 25199, 26639, 28119, 29639, 31199, 32799, 34439, 36119, 37839, 39599, 41399, 43239, 45119, 47039, 48999, 99999999];
const levelMins = [0, 40, 120, 240, 400, 600, 840, 1120, 1440, 1800, 2200, 2640, 3120, 3640, 4200, 4800, 5440, 6120, 6840, 7600, 8400, 9240, 10120, 11040, 12000, 13000, 14040, 15120, 16240, 17400, 18600, 19840, 21120, 22440, 23800, 25200, 26640, 28120, 29640, 31200, 32800, 34440, 36120, 37840, 39600, 41400, 43240, 45120, 47040, 49000];

function getLevelAndExpRange(exp: number) {
  let level = 1;
  let minExp = 0;
  let maxExp = 39;
  for (let i = 0; i < levelThresholds.length; i++) {
    if (exp <= levelThresholds[i]) {
      level = i + 1;
      maxExp = levelThresholds[i];
      minExp = levelMins[i];
      break;
    }
  }
  return { level, minExp, maxExp };
}

function getQueryParam(param: string) {
  if (typeof window === "undefined") return null;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Modale als Komponenten
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed z-[1000] left-0 top-0 w-full h-full bg-black/60 flex justify-center items-center">
      <div className="bg-white text-black font-bold p-6 rounded-2xl max-w-sm w-full text-center text-base relative">
        {children}
        <button className="modal-btn mt-4" onClick={onClose} style={{ color: "black" }}>❌ Schließen</button>
      </div>
    </div>
  );
}

export default function InstagramTab() {
  // State für Userdaten
  const [username, setUsername] = useState("@User");
  const [profileImage, setProfileImage] = useState("");
  const [exp, setExp] = useState(0);
  const [miningPower, setMiningPower] = useState(0);
  const [expTiktok, setExpTiktok] = useState(0);
  const [expInstagram, setExpInstagram] = useState(0);
  const [expStream, setExpStream] = useState(0);
  const [expFacebook, setExpFacebook] = useState(0);
  const [liveExp, setLiveExp] = useState(0);
  const [checkLike, setCheckLike] = useState(false);
  const [checkComment, setCheckComment] = useState(false);
  const [checkStory, setCheckStory] = useState(false);
  const [checkSave, setCheckSave] = useState(false);
  const [wallet, setWallet] = useState("");
  const [claimStatus, setClaimStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showExpSources, setShowExpSources] = useState(false);

  // Modale
  const [modal, setModal] = useState<null | "upgrade" | "claim" | "storyHelp" | "likeSave" | "confirmCheckInitial" | "confirmCheckAfter" | "info" | "walletInfo">(null);
  // Like/Save Check Werte
  const [likeStart, setLikeStart] = useState<number | null>(null);
  const [saveStart, setSaveStart] = useState<number | null>(null);
  const [likeAfter, setLikeAfter] = useState<number | null>(null);
  const [saveAfter, setSaveAfter] = useState<number | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState("");

  // Level/Progress
  const { level, minExp, maxExp } = getLevelAndExpRange(exp);
  const currentLevelExp = exp - minExp;
  const levelRange = maxExp - minExp;
  const progressPercent = Math.round((currentLevelExp / (levelRange || 1)) * 100);

  // uuid aus URL oder Defaultwert
  const uuid = typeof window !== "undefined" && getQueryParam("uuid") ? getQueryParam("uuid") : "dfaith3789953";

  // Userdaten laden
  useEffect(() => {
    if (!uuid) return;
    setLoading(true);
    fetch("https://uuid-check-insta.vercel.app/api/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuid })
    })
      .then((res) => res.json())
      .then((data) => {
        setUsername("@" + (data.username || "User"));
        setProfileImage(data.image || "https://via.placeholder.com/100");
        setExp(parseInt(data.expTotal) || 0);
        setMiningPower(Number(data.miningpower) || 0);
        setExpTiktok(Number(data.expTiktok) || 0);
        setExpInstagram(Number(data.expInstagram) || 0);
        setExpStream(Number(data.expStream) || 0);
        setExpFacebook(Number(data.expFacebook) || 0);
        setLiveExp(Number(data.liveNFTBonus) || 0);
        setCheckLike(data.liked === "true");
        setCheckComment(data.commented === "true");
        setCheckStory(data.story === "true");
        setCheckSave(data.saved === "true");
        if (data.wallet && data.wallet.startsWith("0x")) setWallet(data.wallet);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uuid]);

  // Like/Save Startwerte aus localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const likeStored = localStorage.getItem("dfaith_likeStart");
    const saveStored = localStorage.getItem("dfaith_saveStart");
    if (likeStored && saveStored) {
      setLikeStart(Number(likeStored));
      setSaveStart(Number(saveStored));
    }
  }, []);

  // Like/Save Check API
  const checkInitial = () => {
    if (!uuid) return;
    setLoading(true);
    fetch(`https://hook.eu2.make.com/bli0jo4nik0m9r4x9aj76ptktghdzckd?uuid=${encodeURIComponent(uuid)}`)
      .then((res) => res.json())
      .then((data) => {
        setLikeStart(Number(data.likes));
        setSaveStart(Number(data.saves));
        if (typeof window !== "undefined") {
          localStorage.setItem("dfaith_likeStart", String(data.likes));
          localStorage.setItem("dfaith_saveStart", String(data.saves));
        }
      })
      .finally(() => setLoading(false));
  };
  const checkAfter = () => {
    if (!uuid) return;
    setLoading(true);
    fetch(`https://hook.eu2.make.com/bli0jo4nik0m9r4x9aj76ptktghdzckd?uuid=${encodeURIComponent(uuid)}`)
      .then((res) => res.json())
      .then((data) => {
        setLikeAfter(Number(data.likes));
        setSaveAfter(Number(data.saves));
        if (likeStart !== null && saveStart !== null && Number(data.likes) > likeStart && Number(data.saves) > saveStart) {
          setConfirmationMessage("✅ Erfolgreich! Bitte lade die Seite neu.");
        }
      })
      .finally(() => setLoading(false));
  };

  // Claim absenden
  const submitClaim = () => {
    setClaimStatus("");
    if (!wallet.startsWith("0x") || wallet.length < 42) {
      setClaimStatus("❌ Ungültige Wallet-Adresse.");
      return;
    }
    setLoading(true);
    fetch("https://hook.eu2.make.com/1c62icx2yngv8v4g6y7k7songq01rblk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuid, wallet, username: username.replace("@", "").trim(), miningpower: miningPower })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" || data.success === true || data.claimed === true) {
          setClaimStatus(data.message || "✅ Claim erfolgreich ausgelöst!");
          if (typeof window !== "undefined") localStorage.clear();
        } else {
          setClaimStatus("❌ Fehler: " + (data.message || "Unbekannter Fehler."));
        }
      })
      .catch(() => setClaimStatus("❌ Netzwerkfehler oder ungültige Antwort."))
      .finally(() => setLoading(false));
  };

  // UI
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#f8fafc] to-[#e5e7eb] p-0 font-[SF Pro Display,Poppins,sans-serif]">
      {/* Lade-Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex flex-col items-center justify-center">
          <div className="border-4 border-white/20 border-t-white rounded-full w-12 h-12 animate-spin mb-4"></div>
          <p className="text-white font-bold text-lg drop-shadow">Wird verarbeitet...</p>
        </div>
      )}

      {/* Modale */}
      <Modal open={modal === "info"} onClose={() => setModal(null)}>
        <p className="text-lg font-bold mb-4">📊 Deine EXP-Quellen</p>
        <div className="text-left text-base space-y-2">
          <div className="flex items-center gap-2 border-l-4 border-pink-500 pl-2"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" className="w-5 h-5 rounded-full" /><b>Instagram:</b> <span>{expInstagram} EXP</span></div>
          <div className="flex items-center gap-2 border-l-4 border-black pl-2"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" className="w-5 h-5 rounded-full" /><b>TikTok:</b> <span>{expTiktok} EXP</span></div>
          <div className="flex items-center gap-2 border-l-4 border-blue-600 pl-2"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" className="w-5 h-5" /><b>Facebook:</b> <span>{expFacebook} EXP</span></div>
          <div className="flex items-center gap-2 border-l-4 border-purple-700 pl-2"><img src="https://cdn-icons-png.flaticon.com/512/727/727245.png" alt="Stream" className="w-5 h-5 rounded-full" /><b>Stream:</b> <span>{expStream} EXP</span></div>
          <div className="flex items-center gap-2 border-l-4 border-yellow-400 pl-2"><img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="Live" className="w-5 h-5 rounded-full" /><b>Live EXP:</b> <span>{liveExp}</span></div>
        </div>
      </Modal>
      <Modal open={modal === "upgrade"} onClose={() => setModal(null)}>
        <p className="text-xl font-bold mb-4">✨ Upgrade deinen Account!</p>
        <div className="flex flex-col gap-3 w-full">
          <button className="modal-btn w-full py-3 rounded-2xl font-semibold bg-zinc-900/90 text-white shadow hover:bg-zinc-900/95 active:bg-zinc-800 transition text-base tracking-tight flex items-center justify-center gap-2 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-300" onClick={() => setModal("likeSave")}>👤 <span>Account Upgrade</span></button>
          <button className="modal-btn w-full py-3 rounded-2xl font-semibold bg-white text-zinc-900 shadow hover:bg-zinc-100 active:bg-zinc-200 transition text-base tracking-tight flex items-center justify-center gap-2 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-300" onClick={() => setModal("storyHelp")}>📣 <span>Story teilen</span></button>
        </div>
      </Modal>
      <Modal open={modal === "claim"} onClose={() => setModal(null)}>
        <div className="flex justify-center mb-2">
          <div onClick={() => setModal("walletInfo")}
            className="bg-white text-pink-600 font-bold rounded-full w-7 h-7 flex items-center justify-center shadow cursor-pointer">i</div>
        </div>
        <p>Gib deine Wallet-Adresse ein, um deinen Claim auszulösen:</p>
        <input
          className="w-full p-2 my-2 rounded-lg border border-gray-300 text-black text-base"
          type="text"
          placeholder="0x..."
          value={wallet}
          onChange={e => setWallet(e.target.value)}
          readOnly={!!wallet && wallet.startsWith("0x")}
        />
        {!wallet &&
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-yellow-700 text-sm mt-2 mb-2">
            Du hast noch keine Wallet-Adresse hinterlegt.<br />
            <b>Bitte gehe in den <span className="underline cursor-pointer text-pink-600" onClick={() => { window.location.href = '/tabs/wallet'; }}>Wallet-Tab</span> und trage dort deine Adresse ein.</b>
          </div>
        }
        <button
          className="modal-btn w-full py-3 rounded-2xl font-semibold bg-zinc-900/90 text-white shadow hover:bg-zinc-900/95 active:bg-zinc-800 transition text-base tracking-tight flex items-center justify-center gap-2 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-300"
          onClick={submitClaim}
        >
          ✅ Claim absenden
        </button>
        <p className="mt-2" style={{ color: claimStatus.startsWith("✅") ? "green" : claimStatus.startsWith("❌") ? "red" : undefined }}>{claimStatus}</p>
      </Modal>
      <Modal open={modal === "storyHelp"} onClose={() => setModal(null)}>
        <p>📣 Bitte teile meinen Beitrag in deiner Instagram-Story<br/><b>@dawidfaith</b>, damit du dein Upgrade erhältst.</p>
      </Modal>
      <Modal open={modal === "likeSave"} onClose={() => setModal(null)}>
        <div className="flex flex-col items-center gap-2 mb-2">
          {/* User-Icon statt Spitzhacke */}
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" fill="url(#user-gradient-modal)" />
            <ellipse cx="12" cy="18" rx="7" ry="4" fill="url(#user-gradient-modal)" />
            <defs>
              <linearGradient id="user-gradient-modal" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFD700"/>
                <stop offset="1" stopColor="#FFA500"/>
              </linearGradient>
            </defs>
          </svg>
          <p className="text-lg font-bold text-zinc-900">Account Upgrade</p>
        </div>
        <p className="text-left text-base mb-4">Verbinde deinen Account mit einem unserer Partner, um exklusive Vorteile zu erhalten:</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <a href="https://www.instagram.com/dawidfaith/" target="_blank" rel="noreferrer" className="flex flex-col items-center p-4 rounded-2xl bg-gradient-to-br from-[#f9a8d4] to-[#fbcfe8] text-zinc-900 font-semibold shadow-md hover:shadow-lg transition-all">
            <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" className="w-8 h-8 mb-2" />
            <span>Instagram folgen</span>
          </a>
          <a href="https://www.tiktok.com/@dawidfaith" target="_blank" rel="noreferrer" className="flex flex-col items-center p-4 rounded-2xl bg-gradient-to-br from-[#90cdf4] to-[#bcdafe] text-zinc-900 font-semibold shadow-md hover:shadow-lg transition-all">
            <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" className="w-8 h-8 mb-2" />
            <span>TikTok folgen</span>
          </a>
          <a href="https://www.facebook.com/dawidfaith" target="_blank" rel="noreferrer" className="flex flex-col items-center p-4 rounded-2xl bg-gradient-to-br from-[#a5f3fc] to-[#b9fbc0] text-zinc-900 font-semibold shadow-md hover:shadow-lg transition-all">
            <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" className="w-8 h-8 mb-2" />
            <span>Facebook Seite liken</span>
          </a>
          <a href="https://www.dawidfaith.com/stream" target="_blank" rel="noreferrer" className="flex flex-col items-center p-4 rounded-2xl bg-gradient-to-br from-[#c6f6d5] to-[#f0e68c] text-zinc-900 font-semibold shadow-md hover:shadow-lg transition-all">
            <img src="https://cdn-icons-png.flaticon.com/512/727/727245.png" alt="Stream" className="w-8 h-8 mb-2" />
            <span>Stream besuchen</span>
          </a>
        </div>
        <p className="text-left text-sm text-gray-500">*Die Vorteile werden nach Überprüfung deiner Aktionen innerhalb von 24 Stunden aktiviert.</p>
      </Modal>
    </div>
  );
}