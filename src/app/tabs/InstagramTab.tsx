'use client';

import { useState, useEffect } from 'react';

interface UserData {
  username: string;
  image: string;
  expTotal: string;
  expTiktok: string;
  expInstagram: string;
  expStream: string;
  expFacebook: string;
  liveNFTBonus: string;
  miningpower: string;
  liked: string;
  commented: string;
  story: string;
  saved: string;
  wallet?: string;
}

interface LevelInfo {
  level: number;
  minExp: number;
  maxExp: number;
}

export default function InstagramTab() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('⏳ Wird verarbeitet...');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [walletInput, setWalletInput] = useState('');
  const [claimStatus, setClaimStatus] = useState('');
  const [likeStart, setLikeStart] = useState(0);
  const [saveStart, setSaveStart] = useState(0);
  const [initialValues, setInitialValues] = useState('');
  const [afterValues, setAfterValues] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const levelThresholds = [39, 119, 239, 399, 599, 839, 1119, 1439, 1799, 2199, 2639, 3119, 3639, 4199, 4799, 5439, 6119, 6839, 7599, 8399, 9239, 10119, 11039, 11999, 12999, 14039, 15119, 16239, 17399, 18599, 19839, 21119, 22439, 23799, 25199, 26639, 28119, 29639, 31199, 32799, 34439, 36119, 37839, 39599, 41399, 43239, 45119, 47039, 48999, 99999999];
  const levelMins = [0, 40, 120, 240, 400, 600, 840, 1120, 1440, 1800, 2200, 2640, 3120, 3640, 4200, 4800, 5440, 6120, 6840, 7600, 8400, 9240, 10120, 11040, 12000, 13000, 14040, 15120, 16240, 17400, 18600, 19840, 21120, 22440, 23800, 25200, 26640, 28120, 29640, 31200, 32800, 34440, 36120, 37840, 39600, 41400, 43240, 45120, 47040, 49000];

  const getLevelAndExpRange = (exp: number): LevelInfo => {
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
  };

  const getQueryParam = (param: string): string | null => {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const uuid = getQueryParam("uuid") || "default-uuid";
        const response = await fetch("https://uuid-check-insta.vercel.app/api/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uuid })
        });
        const data = await response.json();

        setUserData(data);

        if (data.wallet && data.wallet.startsWith("0x")) {
          setWalletInput(data.wallet);
        }

        // Load stored values from localStorage
        const storedLikeStart = localStorage.getItem("dfaith_likeStart");
        const storedSaveStart = localStorage.getItem("dfaith_saveStart");

        if (storedLikeStart && storedSaveStart) {
          setLikeStart(parseInt(storedLikeStart));
          setSaveStart(parseInt(storedSaveStart));
          setInitialValues(`Likes: ${storedLikeStart}\nSaves: ${storedSaveStart}`);
        }
      } catch (error) {
        console.error("Fehler beim Laden des Userboards:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const openModal = (modalId: string) => {
    setActiveModal(modalId);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const submitClaim = async () => {
    if (!userData) return;

    setLoading(true);
    setLoadingText('⏳ Wird verarbeitet...');

    const uuid = getQueryParam("uuid");
    const username = userData.username;
    const miningPower = userData.miningpower;

    if (!walletInput.startsWith("0x") || walletInput.length < 42) {
      setClaimStatus("❌ Ungültige Wallet-Adresse.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("https://hook.eu2.make.com/1c62icx2yngv8v4g6y7k7songq01rblk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          uuid: uuid,
          wallet: walletInput,
          username: username,
          miningpower: miningPower
        })
      });

      const data = await response.json();

      if (data.status === "success" || data.success === true || data.claimed === true) {
        setClaimStatus(data.message || "✅ Claim erfolgreich ausgelöst!");
        localStorage.clear();
      } else {
        setClaimStatus("❌ Fehler: " + (data.message || "Unbekannter Fehler."));
      }
    } catch (error) {
      setClaimStatus("❌ Netzwerkfehler oder ungültige Antwort.");
      console.error("Claim Fehler:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkInitial = async () => {
    const uuid = getQueryParam("uuid");
    setLoading(true);
    setLoadingText('⏳ Wird verarbeitet...');

    try {
      const response = await fetch(`https://hook.eu2.make.com/bli0jo4nik0m9r4x9aj76ptktghdzckd?uuid=${encodeURIComponent(uuid || '')}`);
      const data = await response.json();
      
      const likes = parseInt(data.likes);
      const saves = parseInt(data.saves);
      
      setLikeStart(likes);
      setSaveStart(saves);
      setInitialValues(`Likes: ${likes}\nSaves: ${saves}`);
      
      localStorage.setItem("dfaith_likeStart", likes.toString());
      localStorage.setItem("dfaith_saveStart", saves.toString());
    } catch (error) {
      console.error("Fehler beim Laden der initialen Werte:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkAfter = async () => {
    const uuid = getQueryParam("uuid");
    setLoading(true);
    setLoadingText('⏳ Wird verarbeitet...');

    try {
      const response = await fetch(`https://hook.eu2.make.com/bli0jo4nik0m9r4x9aj76ptktghdzckd?uuid=${encodeURIComponent(uuid || '')}`);
      const data = await response.json();
      
      const newLikes = parseInt(data.likes);
      const newSaves = parseInt(data.saves);
      
      setAfterValues(`Likes: ${newLikes}\nSaves: ${newSaves}`);
      
      if (newLikes > likeStart && newSaves > saveStart) {
        setShowConfirmation(true);
      }
    } catch (error) {
      console.error("Fehler beim Laden der neuen Werte:", error);
    } finally {
      setLoading(false);
    }
  };

  const reloadPage = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (!userData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white text-xl">Lade Daten...</div>
      </div>
    );
  }

  const exp = parseInt(userData.expTotal);
  const { level, minExp, maxExp } = getLevelAndExpRange(exp);
  const currentLevelExp = exp - minExp;
  const levelRange = maxExp - minExp;
  const progressPercent = Math.round((currentLevelExp / levelRange) * 100);

  return (
    <div className="min-h-screen p-4" style={{
      background: 'linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4)',
      fontFamily: "'Poppins', 'Segoe UI', sans-serif"
    }}>
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white border-opacity-20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white font-bold text-shadow">{loadingText}</p>
          </div>
        </div>
      )}

      <div className="flex justify-center items-center min-h-full py-8">
        <div className="bg-pink-500 bg-opacity-18 rounded-3xl p-8 w-full max-w-sm text-center text-white border-2 border-white border-opacity-15 shadow-2xl">
          
          {/* Username */}
          <div className="text-2xl font-bold mb-4">@{userData.username}</div>
          
          {/* Profile Image */}
          <img 
            src={userData.image || "https://via.placeholder.com/100"} 
            alt="Profilbild" 
            className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
          />
          
          {/* Level Box */}
          <div className="bg-black bg-opacity-20 rounded-2xl p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-xl font-bold">Level {level}</div>
              <div className="text-base">{exp} / {maxExp} EXP</div>
              <button 
                onClick={() => openModal('infoModal')}
                className="bg-white text-pink-600 font-bold rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-md"
              >
                i
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="relative bg-gray-800 rounded-full h-4 overflow-hidden mb-3">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold"
                style={{ width: `${progressPercent}%` }}
              >
                {progressPercent}%
              </div>
            </div>
            
            <div className="text-yellow-400 text-sm">
              ⛏ +{userData.miningpower} D.Faith
            </div>
          </div>

          {/* System Check */}
          <div className="border-2 border-white rounded-2xl p-4 mb-6 bg-white bg-opacity-8">
            <div className="font-bold text-lg mb-3">✅ System Check</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>❤️ Like</span>
                <span>{userData.liked === "true" ? "✅" : "❌"} +10 EXP</span>
              </div>
              <div className="flex justify-between">
                <span>💬 Kommentar</span>
                <span>{userData.commented === "true" ? "✅" : "❌"} +10 EXP</span>
              </div>
              <div className="flex justify-between">
                <span>📣 Story</span>
                <span>{userData.story === "true" ? "✅" : "❌"} +20 EXP</span>
              </div>
              <div className="flex justify-between">
                <span>💾 Save</span>
                <span>{userData.saved === "true" ? "✅" : "❌"} +10 EXP</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => openModal('upgradeModal')}
              className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 text-white font-bold py-4 px-7 rounded-full text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              ✨ Upgrade
            </button>
            <button 
              onClick={() => openModal('claimModal')}
              className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 text-white font-bold py-4 px-7 rounded-full text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              🪙 Claim
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4">
          <div className="bg-white text-black rounded-2xl p-6 max-w-sm w-full text-center">
            
            {/* Upgrade Modal */}
            {activeModal === 'upgradeModal' && (
              <>
                <p className="text-xl font-semibold mb-4">✨ Upgrade deine EXP!</p>
                <div className="space-y-3 mb-4">
                  <button 
                    onClick={() => openModal('likeSaveModal')}
                    className="w-full bg-white border-2 border-gray-300 text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                  >
                    ❤️ 💾 <span className="ml-2">Like + Save</span>
                  </button>
                  <button 
                    onClick={() => openModal('storyHelpModal')}
                    className="w-full bg-white border-2 border-gray-300 text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                  >
                    📣 <span className="ml-2">Story teilen</span>
                  </button>
                </div>
                <button 
                  onClick={closeModal}
                  className="w-full bg-white border-2 border-gray-300 text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-50"
                >
                  ❌ Schließen
                </button>
              </>
            )}

            {/* Claim Modal */}
            {activeModal === 'claimModal' && (
              <>
                <div className="flex justify-center mb-4">
                  <button 
                    onClick={() => openModal('walletInfoModal')}
                    className="bg-white text-pink-600 font-bold rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-md"
                  >
                    i
                  </button>
                </div>
                <p className="mb-4">Gib deine Wallet-Adresse ein, um deinen Claim auszulösen:</p>
                <input 
                  type="text"
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-3 my-3 border border-gray-300 rounded-lg text-base"
                  readOnly={userData.wallet?.startsWith("0x")}
                />
                <button 
                  onClick={submitClaim}
                  className="w-full bg-white border-2 border-gray-300 text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-50 mb-3"
                >
                  ✅ Claim absenden
                </button>
                {claimStatus && (
                  <p className={`mb-3 ${claimStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                    {claimStatus}
                  </p>
                )}
                <button 
                  onClick={closeModal}
                  className="w-full bg-white border-2 border-gray-300 text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-50"
                >
                  ❌ Schließen
                </button>
              </>
            )}

            {/* Story Help Modal */}
            {activeModal === 'storyHelpModal' && (
              <>
                <p className="mb-4">📣 Bitte teile meinen Beitrag in deiner Instagram-Story<br/>und markiere mich mit <strong>@dawidfaith</strong>, damit du dein Upgrade erhältst.</p>
                <button 
                  onClick={closeModal}
                  className="w-full bg-white border-2 border-gray-300 text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-50"
                >
                  ❌ Verstanden
                </button>
              </>
            )}

            {/* Like Save Modal */}
            {activeModal === 'likeSaveModal' && (
              <>
                <p className="mb-3">1️⃣ Bitte entferne alle Likes und Saves von meinem Beitrag.</p>
                <button 
                  onClick={() => { closeModal(); openModal('confirmCheckInitial'); }}
                  className="w-full bg-white border-2 border-gray-300 text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-50 mb-3"
                >
                  ✅ Check aktuelle Werte
                </button>
                {initialValues && (
                  <div className="bg-gray-100 text-gray-800 rounded-lg p-2 mb-3 text-sm whitespace-pre-line">
                    {initialValues}
                  </div>
                )}
                <p className="mb-3">2️⃣ Bitte like und speichere den Beitrag jetzt erneut, bevor du fortfährst!</p>
                <button 
                  onClick={() => { closeModal(); openModal('confirmCheckAfter'); }}
                  className="w-full bg-white border-2 border-gray-300 text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-50 mb-3"
                >
                  ✅ Check neue Werte
                </button>
                {afterValues && (
                  <div className="bg-gray-100 text-gray-800 rounded-lg p-2 mb-3 text-sm whitespace-pre-line">
                    {afterValues}
                  </div>
                )}
                {showConfirmation && (
                  <p className="text-green-600 mb-3">✅ Erfolgreich! Bitte lade die Seite neu.</p>
                )}
                <button 
                  onClick={reloadPage}
                  className="w-full bg-white border-2 border-gray-300 text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-50 mb-3"
                >
                  🔄 Neu laden
                </button>
                <button 
                  onClick={closeModal}
                  className="w-full bg-white border-2 border-gray-300 text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-50"
                >
                  ❌ Schließen
                </button>
              </>
            )}

            {/* Confirmation Modals */}
            {activeModal === 'confirmCheckInitial' && (
              <>
                <p className="mb-3">Bitte <strong>entferne zuerst alle Likes und Saves</strong> von meinem Beitrag – danach werden die aktuellen Zahlen gespeichert.</p>
                <p className="text-yellow-500 font-bold mb-4">⚠️ Diese Aktion ist nur einmal möglich pro Beitrag!</p>
                <button 
                  onClick={() => { closeModal(); checkInitial(); }}
                  className="w-full bg-white border-2 border-gray-300 text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-50 mb-3"
                >
                  ✅ Ja, fortfahren
                </button>
                <button 
                  onClick={closeModal}
                  className="w-full bg-white border-2 border-gray-300 text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-50"
                >
                  ❌ Abbrechen
                </button>
              </>
            )}

            {activeModal === 'confirmCheckAfter' && (
              <>
                <p className="mb-3">Bitte <strong>like und speichere den Beitrag erneut</strong>, bevor du fortfährst – gleich werden die neuen Zahlen gespeichert.</p>
                <p className="text-yellow-500 font-bold mb-4">⚠️ Diese Aktion ist nur einmal möglich pro Beitrag!</p>
                <button 
                  onClick={() => { closeModal(); checkAfter(); }}
                  className="w-full bg-white border-2 border-gray-300 text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-50 mb-3"
                >
                  ✅ Ja, fortfahren
                </button>
                <button 
                  onClick={closeModal}
                  className="w-full bg-white border-2 border-gray-300 text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-50"
                >
                  ❌ Abbrechen
                </button>
              </>
            )}

            {/* Info Modal */}
            {activeModal === 'infoModal' && (
              <>
                <p className="text-xl font-bold mb-4">📊 Deine EXP-Quellen</p>
                <div className="text-left space-y-3 mb-4">
                  <div className="border-l-4 border-pink-500 pl-3">
                    <strong>Instagram:</strong> {userData.expInstagram} EXP
                  </div>
                  <div className="border-l-4 border-black pl-3">
                    <strong>TikTok:</strong> {userData.expTiktok} EXP
                  </div>
                  <div className="border-l-4 border-blue-600 pl-3">
                    <strong>Facebook:</strong> {userData.expFacebook} EXP
                  </div>
                  <div className="border-l-4 border-purple-600 pl-3">
                    <strong>Stream:</strong> {userData.expStream} EXP
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-3">
                    <strong>Live EXP Bonus:</strong> +{userData.liveNFTBonus}%
                  </div>
                </div>
                <button 
                  onClick={closeModal}
                  className="w-full bg-white border-2 border-gray-300 text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-50"
                >
                  ❌ Schließen
                </button>
              </>
            )}

            {/* Wallet Info Modal */}
            {activeModal === 'walletInfoModal' && (
              <>
                <p className="mb-4">
                  <strong>🔒 Wichtiger Hinweis:</strong><br/><br/>
                  Deine Wallet-Adresse wird dauerhaft mit deinem Social-Media-Account verbunden.<br/><br/>
                  Wenn du sie ändern willst, schreib mir eine <strong>DM mit dem Stichwort „Wallet"</strong> auf <strong>Instagram</strong>.
                </p>
                <button 
                  onClick={closeModal}
                  className="w-full bg-white border-2 border-gray-300 text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-50"
                >
                  ❌ Schließen
                </button>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}