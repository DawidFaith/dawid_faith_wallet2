
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] via-[#6d28d9] via-40% to-[#f472b6] p-4 relative font-[Poppins,sans-serif]" style={{
      backgroundImage: `url('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80'), linear-gradient(135deg, #1e1b4b 0%, #6d28d9 50%, #f472b6 100%)`,
      backgroundBlendMode: 'overlay',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh'
    }}>
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

      {/* Card */}
      <div className="card bg-[rgba(30,27,75,0.85)] rounded-[32px] p-8 w-full max-w-[420px] shadow-2xl border-2 border-pink-400/30 text-white text-center flex flex-col items-center relative" style={{boxShadow:'0 0 40px 0 #6d28d9, 0 0 80px 0 #f472b6'}}>
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-2 animate-bounce">
          <span role="img" aria-label="note" className="text-pink-300 text-3xl">🎵</span>
          <span role="img" aria-label="note2" className="text-purple-400 text-2xl">🎶</span>
        </div>
        <div className="username text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <span>{username}</span>
          <span className="text-pink-300 animate-pulse">{level >= 10 ? "🌟" : ""}</span>
        </div>
        <img
          src={profileImage || "https://cdn-icons-png.flaticon.com/512/727/727245.png"}
          alt="Profilbild"
          className="w-28 h-28 rounded-full object-cover mx-auto mb-4 border-4 border-pink-400/40 shadow-lg"
          style={{boxShadow:'0 0 0 6px #f472b6, 0 0 0 12px #6d28d9'}}
        />
        <div className="level-box bg-gradient-to-r from-[#6d28d9]/60 via-[#f472b6]/40 to-[#1e1b4b]/60 rounded-2xl p-5 mb-4 w-full border border-pink-400/30 shadow-inner">
          <div className="flex justify-between items-center mb-2">
            <div className="level font-bold text-lg text-pink-200 flex items-center gap-2">
              <span className="inline-block"><svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path fill="#f472b6" d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 21 12 17.27 7.82 21 9 12.91l-5-3.64 5.91-.01L12 2z"/></svg></span>
              Level {level}
            </div>
            <div className="exp text-base text-purple-200">{exp} / {maxExp} EXP</div>
            <button className="bg-pink-200 text-[#6d28d9] font-bold rounded-full w-8 h-8 flex items-center justify-center shadow border border-pink-400/60 hover:scale-110 transition" title="Info" onClick={() => setModal("info")}>🎧</button>
          </div>
          <div className="progress-bar relative w-full h-5 bg-[#2d225a] rounded-full overflow-hidden mb-2 shadow-inner">
            <div
              className="progress absolute left-0 top-0 h-full bg-gradient-to-r from-[#f472b6] via-[#6d28d9] to-[#1e1b4b] animate-pulse"
              style={{ width: `${progressPercent}%`, transition: 'width 0.7s cubic-bezier(.4,2,.6,1)' }}
            ></div>
            <div className="progress-label absolute w-full h-full flex items-center justify-center text-xs font-bold text-white drop-shadow">
              <span className="inline-block mr-1">🎵</span>{progressPercent}%
            </div>
          </div>
          <div className="mt-2 text-pink-200 text-base flex items-center justify-center gap-2">
            <span role="img" aria-label="music">🎸</span> <span>+{miningPower} D.Faith</span>
          </div>
        </div>
        {/* System-Check */}
        <div className="system-check border-2 border-pink-400/30 rounded-2xl p-4 bg-[#2d225a]/60 mb-4 w-full shadow-inner">
          <div className="system-check-header font-bold text-base mb-2 flex items-center gap-2 text-pink-200">✅ System Check <span className="text-purple-300">🎤</span></div>
          <div className="check-item flex justify-between mb-1"><span>❤️ Like</span><span>{checkLike ? "✅" : "❌"} +10 EXP</span></div>
          <div className="check-item flex justify-between mb-1"><span>💬 Kommentar</span><span>{checkComment ? "✅" : "❌"} +10 EXP</span></div>
          <div className="check-item flex justify-between mb-1"><span>📣 Story</span><span>{checkStory ? "✅" : "❌"} +20 EXP</span></div>
          <div className="check-item flex justify-between mb-1"><span>💾 Save</span><span>{checkSave ? "✅" : "❌"} +10 EXP</span></div>
        </div>
        {/* Buttons */}
        <div className="button-row flex gap-4 mt-6 w-full">
          <button className="btn-upgrade flex-1 py-3 rounded-full font-bold bg-gradient-to-r from-[#f472b6] via-[#6d28d9] to-[#1e1b4b] shadow-lg hover:scale-105 transition text-white text-lg flex items-center justify-center gap-2" onClick={() => setModal("upgrade")}>🎶 <span>Upgrade</span></button>
          <button className="btn-claim flex-1 py-3 rounded-full font-bold bg-gradient-to-r from-[#6d28d9] via-[#f472b6] to-[#1e1b4b] shadow-lg hover:scale-105 transition text-white text-lg flex items-center justify-center gap-2" onClick={() => setModal("claim")}>🎵 <span>Claim</span></button>
        </div>
      </div>
    </div>
  );
}