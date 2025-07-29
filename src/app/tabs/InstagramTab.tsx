
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

  // uuid aus URL
  const uuid = typeof window !== "undefined" ? getQueryParam("uuid") : null;

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f58529] via-[#dd2a7b] via-40% to-[#515bd4] p-4 relative">
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
        <button className="modal-btn mb-2" onClick={() => setModal("likeSave")}>❤️ 💾 <span>Like + Save</span></button>
        <button className="modal-btn mb-2" onClick={() => setModal("storyHelp")}>📣 <span>Story teilen</span></button>
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
        <button className="modal-btn" onClick={submitClaim}>✅ Claim absenden</button>
        <p className="mt-2" style={{ color: claimStatus.startsWith("✅") ? "green" : claimStatus.startsWith("❌") ? "red" : undefined }}>{claimStatus}</p>
      </Modal>
      <Modal open={modal === "storyHelp"} onClose={() => setModal(null)}>
        <p>📣 Bitte teile meinen Beitrag in deiner Instagram-Story<br/>und markiere mich mit <b>@dawidfaith</b>, damit du dein Upgrade erhältst.</p>
      </Modal>
      <Modal open={modal === "likeSave"} onClose={() => setModal(null)}>
        <p>1️⃣ Bitte entferne alle Likes und Saves von meinem Beitrag.</p>
        <button className="modal-btn mb-2" onClick={() => setModal("confirmCheckInitial")}>✅ Check aktuelle Werte</button>
        {likeStart !== null && saveStart !== null && (
          <div className="bg-gray-100 text-black rounded-lg p-2 my-2">Likes: {likeStart}<br/>Saves: {saveStart}</div>
        )}
        <p className="mt-4">2️⃣ Bitte like und speichere den Beitrag jetzt erneut, bevor du fortfährst!</p>
        <button className="modal-btn mb-2" onClick={() => setModal("confirmCheckAfter")}>✅ Check neue Werte</button>
        {likeAfter !== null && saveAfter !== null && (
          <div className="bg-gray-100 text-black rounded-lg p-2 my-2">Likes: {likeAfter}<br/>Saves: {saveAfter}</div>
        )}
        {confirmationMessage && <p className="text-green-600 font-bold mt-2">{confirmationMessage}</p>}
        <button className="modal-btn mt-2" onClick={() => { if (typeof window !== "undefined") { localStorage.clear(); window.location.reload(); } }}>🔄 Neu laden</button>
      </Modal>
      <Modal open={modal === "confirmCheckInitial"} onClose={() => setModal(null)}>
        <p>Bitte <b>entferne zuerst alle Likes und Saves</b> von meinem Beitrag – danach werden die aktuellen Zahlen gespeichert.</p>
        <p className="text-yellow-400 font-bold mt-2">⚠️ Diese Aktion ist nur einmal möglich pro Beitrag!</p>
        <button className="modal-btn" onClick={() => { setModal("likeSave"); checkInitial(); }}>✅ Ja, fortfahren</button>
      </Modal>
      <Modal open={modal === "confirmCheckAfter"} onClose={() => setModal(null)}>
        <p>Bitte <b>like und speichere den Beitrag erneut</b>, bevor du fortfährst – gleich werden die neuen Zahlen gespeichert.</p>
        <p className="text-yellow-400 font-bold mt-2">⚠️ Diese Aktion ist nur einmal möglich pro Beitrag!</p>
        <button className="modal-btn" onClick={() => { setModal("likeSave"); checkAfter(); }}>✅ Ja, fortfahren</button>
      </Modal>
      <Modal open={modal === "walletInfo"} onClose={() => setModal(null)}>
        <p><b>🔒 Wichtiger Hinweis:</b><br/><br/>Deine Wallet-Adresse wird dauerhaft mit deinem Social-Media-Account verbunden.<br/><br/>Wenn du sie ändern willst, schreib mir eine <b>DM mit dem Stichwort „Wallet“</b> auf <b>Instagram</b>.</p>
      </Modal>

      {/* Card */}
      <div className="bg-pink-600/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl border-2 border-white/15 text-white text-center">
        <div className="text-2xl font-bold mb-2">{username}</div>
        <img
          src={profileImage || "https://via.placeholder.com/100"}
          alt="Profilbild"
          className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-white/20"
        />
        <div className="bg-black/20 rounded-2xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="font-bold text-lg">Level {level}</div>
            <div className="text-base">{exp} / {maxExp} EXP</div>
            <button className="bg-white text-pink-600 font-bold rounded-full w-7 h-7 flex items-center justify-center shadow" title="Info" onClick={() => setModal("info")}>i</button>
          </div>
          <div className="relative w-full h-4 bg-zinc-900 rounded-full overflow-hidden mb-2">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4]"
              style={{ width: `${progressPercent}%` }}
            ></div>
            <div className="absolute w-full h-full flex items-center justify-center text-xs font-bold text-white drop-shadow">
              {progressPercent}%
            </div>
          </div>
          <div className="mt-2 text-yellow-300 text-base flex items-center justify-center gap-1">
            ⛏ <span>+{miningPower} D.Faith</span>
          </div>
        </div>
        {/* EXP-Quellen (optional einblendbar) */}
        <div className="text-left text-sm bg-white/10 rounded-xl p-3 mb-4">
          <div className="flex justify-between"><span>TikTok:</span><span>{expTiktok} EXP</span></div>
          <div className="flex justify-between"><span>Instagram:</span><span>{expInstagram} EXP</span></div>
          <div className="flex justify-between"><span>Stream:</span><span>{expStream} EXP</span></div>
          <div className="flex justify-between"><span>Facebook:</span><span>{expFacebook} EXP</span></div>
          <div className="flex justify-between"><span>LiveExp:</span><span>+{liveExp}%</span></div>
        </div>
        {/* System-Check */}
        <div className="border-2 border-white rounded-2xl p-4 bg-white/10 mb-4">
          <div className="font-bold text-base mb-2">✅ System Check</div>
          <div className="flex justify-between mb-1"><span>❤️ Like</span><span>{checkLike ? "✅" : "❌"} +10 EXP</span></div>
          <div className="flex justify-between mb-1"><span>💬 Kommentar</span><span>{checkComment ? "✅" : "❌"} +10 EXP</span></div>
          <div className="flex justify-between mb-1"><span>📣 Story</span><span>{checkStory ? "✅" : "❌"} +20 EXP</span></div>
          <div className="flex justify-between mb-1"><span>💾 Save</span><span>{checkSave ? "✅" : "❌"} +10 EXP</span></div>
        </div>
        {/* Buttons */}
        <div className="flex gap-4 mt-6">
          <button className="btn-upgrade flex-1 py-3 rounded-full font-bold bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] shadow-lg hover:scale-105 transition" onClick={() => setModal("upgrade")}>✨ Upgrade</button>
          <button className="btn-claim flex-1 py-3 rounded-full font-bold bg-gradient-to-r from-[#dd2a7b] via-[#8134af] to-[#515bd4] shadow-lg hover:scale-105 transition" onClick={() => setModal("claim")}>🪙 Claim</button>
        </div>
      </div>
    </div>
  );
}