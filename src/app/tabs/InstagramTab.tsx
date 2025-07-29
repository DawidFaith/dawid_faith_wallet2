
import React, { useEffect, useState } from "react";

// Instagram Story-Ring SVG
function StoryRing({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex items-center justify-center">
      <svg width="104" height="104" viewBox="0 0 104 104" className="absolute z-0 animate-spin-slow" style={{filter:'drop-shadow(0 0 8px #fd1d1d88)'}}>
        <defs>
          <linearGradient id="ig-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f58529"/>
            <stop offset="50%" stopColor="#dd2a7b"/>
            <stop offset="100%" stopColor="#515bd4"/>
          </linearGradient>
        </defs>
        <circle cx="52" cy="52" r="48" stroke="url(#ig-ring)" strokeWidth="6" fill="none" />
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Kreis-Progressbar für Level
function CircleProgress({ percent, children }: { percent: number, children?: React.ReactNode }) {
  const r = 38, c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(percent, 100));
  return (
    <svg width="90" height="90" className="block mx-auto">
      <circle cx="45" cy="45" r={r} stroke="#eee" strokeWidth="8" fill="none" />
      <circle cx="45" cy="45" r={r} stroke="url(#ig-ring)" strokeWidth="8" fill="none" strokeDasharray={c} strokeDashoffset={c - c * p / 100} style={{transition:'stroke-dashoffset 0.7s cubic-bezier(.4,2,.6,1)'}}/>
      <defs>
        <linearGradient id="ig-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f58529"/>
          <stop offset="50%" stopColor="#dd2a7b"/>
          <stop offset="100%" stopColor="#515bd4"/>
        </linearGradient>
      </defs>
      {children && <foreignObject x="15" y="15" width="60" height="60">
        <div className="w-full h-full flex flex-col items-center justify-center">
          {children}
        </div>
      </foreignObject>}
    </svg>
  );
}

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f58529] via-[#dd2a7b] via-40% to-[#515bd4] p-2 sm:p-4 relative font-[Poppins,sans-serif]">
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
          <div className="flex items-center gap-2 border-l-4 border-yellow-400 pl-2"><img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="Live" className="w-5 h-5 rounded-full" /><b>Live EXP Bonus:</b> <span>+{liveExp}%</span></div>
        </div>
      </Modal>
      <Modal open={modal === "upgrade"} onClose={() => setModal(null)}>
        <p className="text-xl font-bold mb-4">✨ Upgrade deine EXP!</p>
        <button className="modal-btn mb-2 bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white font-bold" onClick={() => setModal("likeSave")}>❤️ 💾 <span>Like + Save</span></button>
        <button className="modal-btn mb-2 bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white font-bold" onClick={() => setModal("storyHelp")}>📣 <span>Story teilen</span></button>
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
        <button className="modal-btn bg-gradient-to-r from-[#dd2a7b] via-[#8134af] to-[#515bd4] text-white font-bold" onClick={submitClaim}>✅ Claim absenden</button>
        <p className="mt-2" style={{ color: claimStatus.startsWith("✅") ? "green" : claimStatus.startsWith("❌") ? "red" : undefined }}>{claimStatus}</p>
      </Modal>
      <Modal open={modal === "storyHelp"} onClose={() => setModal(null)}>
        <p>📣 Bitte teile meinen Beitrag in deiner Instagram-Story<br/><b>@dawidfaith</b>, damit du dein Upgrade erhältst.</p>
      </Modal>
      <Modal open={modal === "likeSave"} onClose={() => setModal(null)}>
        <p>1️⃣ Bitte entferne alle Likes und Saves von meinem Beitrag.</p>
        <button className="modal-btn mb-2 bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white font-bold" onClick={() => setModal("confirmCheckInitial")}>✅ Check aktuelle Werte</button>
        {likeStart !== null && saveStart !== null && (
          <div className="bg-gray-100 text-black rounded-lg p-2 my-2">Likes: {likeStart}<br/>Saves: {saveStart}</div>
        )}
        <p className="mt-4">2️⃣ Bitte like und speichere den Beitrag jetzt erneut, bevor du fortfährst!</p>
        <button className="modal-btn mb-2 bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white font-bold" onClick={() => setModal("confirmCheckAfter")}>✅ Check neue Werte</button>
        {likeAfter !== null && saveAfter !== null && (
          <div className="bg-gray-100 text-black rounded-lg p-2 my-2">Likes: {likeAfter}<br/>Saves: {saveAfter}</div>
        )}
        {confirmationMessage && <p className="text-green-600 font-bold mt-2">{confirmationMessage}</p>}
        <button className="modal-btn mt-2 bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white font-bold" onClick={() => { if (typeof window !== "undefined") { localStorage.clear(); window.location.reload(); } }}>🔄 Neu laden</button>
      </Modal>
      <Modal open={modal === "confirmCheckInitial"} onClose={() => setModal(null)}>
        <p>Bitte <b>entferne zuerst alle Likes und Saves</b> von meinem Beitrag – danach werden die aktuellen Zahlen gespeichert.</p>
        <p className="text-yellow-400 font-bold mt-2">⚠️ Diese Aktion ist nur einmal möglich pro Beitrag!</p>
        <button className="modal-btn bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white font-bold" onClick={() => { setModal("likeSave"); checkInitial(); }}>✅ Ja, fortfahren</button>
      </Modal>
      <Modal open={modal === "confirmCheckAfter"} onClose={() => setModal(null)}>
        <p>Bitte <b>like und speichere den Beitrag erneut</b>, bevor du fortfährst – gleich werden die neuen Zahlen gespeichert.</p>
        <p className="text-yellow-400 font-bold mt-2">⚠️ Diese Aktion ist nur einmal möglich pro Beitrag!</p>
        <button className="modal-btn bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white font-bold" onClick={() => { setModal("likeSave"); checkAfter(); }}>✅ Ja, fortfahren</button>
      </Modal>
      <Modal open={modal === "walletInfo"} onClose={() => setModal(null)}>
        <p><b>🔒 Wichtiger Hinweis:</b><br/><br/>Deine Wallet-Adresse wird dauerhaft mit deinem Social-Media-Account verbunden.<br/><br/>Wenn du sie ändern willst, schreib mir eine <b>DM mit dem Stichwort „Wallet“</b> auf <b>Instagram</b>.</p>
      </Modal>

      {/* Instagram Gradient Header */}
      <div className="w-full max-w-full sm:max-w-[410px] h-2 rounded-t-3xl mb-[-8px] bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] animate-gradient-x" />
      <div className="card bg-white rounded-3xl p-2 xs:p-3 sm:p-8 w-full max-w-full sm:max-w-[410px] shadow-2xl border border-zinc-200 text-zinc-900 text-center flex flex-col items-center relative" style={{boxShadow:'0 4px 32px 0 rgba(221,42,123,0.10)'}}>
        <div className="flex flex-col items-center w-full">
          <div className="mt-2 mb-2">
            <StoryRing>
              <img
                src={profileImage || "https://via.placeholder.com/100"}
                alt="Profilbild"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-md animate-pop"
              />
            </StoryRing>
          </div>
          <div className="username text-[2.1rem] sm:text-[2.3rem] font-extrabold mb-1 flex items-center justify-center gap-2 tracking-tight" style={{fontFamily:'Poppins,Arial,sans-serif'}}>
            <span>{username}</span>
            <span className="inline-block text-[#fd1d1d] animate-bounce">{level >= 10 ? <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#fd1d1d"/><text x="12" y="17" textAnchor="middle" fontSize="14" fill="#fff" fontWeight="bold">★</text></svg> : null}</span>
          </div>
        </div>
        <div className="my-2 flex flex-col items-center">
          <CircleProgress percent={progressPercent}>
            <div className="flex flex-col items-center justify-center">
              <span className="text-lg sm:text-xl font-extrabold text-[#fd1d1d] drop-shadow">{progressPercent}%</span>
              <span className="text-xs text-zinc-500 font-semibold">Level {level}</span>
            </div>
          </CircleProgress>
          <div className="mt-2 text-[#f58529] text-base sm:text-lg font-semibold">{exp} / {maxExp} EXP</div>
          <div className="mt-1 text-yellow-500 text-base sm:text-lg flex items-center justify-center gap-1 font-semibold">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 21 12 17.27 7.82 21 9 12.91l-5-3.64 5.91-.01L12 2z" fill="#fbc02d"/></svg>
            <span>+{miningPower} D.Faith</span>
          </div>
        </div>
        {/* System-Check */}
        <div className="system-check border border-zinc-200 rounded-2xl p-3 sm:p-4 bg-white/70 mb-4 w-full mt-2">
          <div className="system-check-header font-bold text-base sm:text-lg mb-2 text-[#dd2a7b] flex items-center gap-2">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#fd1d1d"/><text x="12" y="17" textAnchor="middle" fontSize="14" fill="#fff" fontWeight="bold">IG</text></svg>
            System Check
          </div>
          <div className="check-item flex justify-between mb-1 text-[1rem] sm:text-[1.1rem] font-medium items-center">
            <span className="flex items-center gap-1"><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#fd1d1d"/></svg> Like</span>
            <span className={checkLike ? "text-green-600" : "text-red-400"}>{checkLike ? "✅" : "❌"} +10 EXP</span>
          </div>
          <div className="check-item flex justify-between mb-1 text-[1rem] sm:text-[1.1rem] font-medium items-center">
            <span className="flex items-center gap-1"><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M21 6.5a2.5 2.5 0 0 0-2.5-2.5h-13A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a2.5 2.5 0 0 0 2.5-2.5v-11zM5.5 5h13A1.5 1.5 0 0 1 20 6.5V7H4v-.5A1.5 1.5 0 0 1 5.5 5zm13 14h-13A1.5 1.5 0 0 1 4 17.5V8h16v9.5a1.5 1.5 0 0 1-1.5 1.5z" fill="#fd1d1d"/></svg> Kommentar</span>
            <span className={checkComment ? "text-green-600" : "text-red-400"}>{checkComment ? "✅" : "❌"} +10 EXP</span>
          </div>
          <div className="check-item flex justify-between mb-1 text-[1rem] sm:text-[1.1rem] font-medium items-center">
            <span className="flex items-center gap-1"><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M17.5 6.5a5.5 5.5 0 1 0-11 0c0 2.74 2.24 5.02 5.5 8.54 3.26-3.52 5.5-5.8 5.5-8.54zM12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#fd1d1d"/></svg> Story</span>
            <span className={checkStory ? "text-green-600" : "text-red-400"}>{checkStory ? "✅" : "❌"} +20 EXP</span>
          </div>
          <div className="check-item flex justify-between mb-1 text-[1rem] sm:text-[1.1rem] font-medium items-center">
            <span className="flex items-center gap-1"><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" fill="#fd1d1d"/><path d="M8 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> Save</span>
            <span className={checkSave ? "text-green-600" : "text-red-400"}>{checkSave ? "✅" : "❌"} +10 EXP</span>
          </div>
        </div>
        {/* Buttons */}
        <div className="button-row flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 w-full">
          <button className="btn-upgrade flex-1 py-3 rounded-full font-extrabold bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] shadow-lg hover:scale-105 active:scale-95 transition text-white text-lg sm:text-xl tracking-tight flex items-center justify-center gap-2 animate-pop" onClick={() => setModal("upgrade")}>⚡ Upgrade</button>
          <button className="btn-claim flex-1 py-3 rounded-full font-extrabold bg-gradient-to-r from-[#dd2a7b] via-[#8134af] to-[#515bd4] shadow-lg hover:scale-105 active:scale-95 transition text-white text-lg sm:text-xl tracking-tight flex items-center justify-center gap-2 animate-pop" onClick={() => setModal("claim")}>✅ Claim</button>
        </div>
      </div>
      <style jsx global>{`
        @keyframes gradient-x {
          0%,100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease-in-out infinite;
        }
        .animate-pop {
          animation: pop 0.3s cubic-bezier(.4,2,.6,1);
        }
        @keyframes pop {
          0% { transform: scale(0.95); }
          80% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-spin-slow {
          animation: spin 6s linear infinite;
        }
      `}</style>
    </div>
  );
}