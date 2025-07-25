// ==UserScript==
// @name         ServerBypass LootLabs
// @namespace    https://discord.gg/trvwz7
// @version      v1.0
// @description  Bypass apenas para Lootlinks!!!!!!
// @author       ServerSadzz
// @match        https://lootlinks.co/*
// @match        https://loot-links.com/*
// @match        https://loot-link.com/*
// @match        https://linksloot.net/*
// @match        https://lootdest.com/*
// @match        https://lootlink.org/*
// @match        https://lootdest.info/*
// @match        https://lootdest.org/*
// @match        https://links-loot.com/*
// @icon         https://i.imgur.com/egKYZMC.png
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    "use strict";

    function handleLootlinks() {
        // Mostrar estado de conexão inicial
        showConnectionStatus("Conectando ao servidor...");

        const originalFetch = window.fetch;
        window.fetch = async function (...args) {
            const [resource] = args;
            const url = typeof resource === "string" ? resource : resource.url;

            if (url.includes("/tc")) {
                try {
                    showConnectionStatus("Estabelecendo conexão...");

                    const response = await originalFetch(...args);
                    const data = await response.clone().json();

                    if (Array.isArray(data) && data.length > 0) {
                        const { urid, task_id, action_pixel_url, session_id } = data[0];
                        const shard = parseInt(urid.slice(-5)) % 3;

                        showConnectionStatus("Conectando ao WebSocket...");

                        const ws = new WebSocket(
                            `wss://${shard}.${INCENTIVE_SERVER_DOMAIN}/c?uid=${urid}&cat=${task_id}&key=${KEY}&session_id=${session_id}&is_loot=1&tid=${TID}`
                        );

                        ws.onopen = () => {
                            showConnectionStatus("Conexão estabelecida, aguardando resposta...");
                            setInterval(() => ws.send("0"), 1000);
                        };

                        ws.onmessage = (e) => {
                            if (e.data.startsWith("r:")) {
                                const encodedString = e.data.slice(2);
                                try {
                                    const destinationUrl = decodeURI(encodedString);
                                    showBypassResult(destinationUrl);
                                } catch (err) {
                                    console.error("Erro de decriptação:", err);
                                    showErrorUI("Falha ao decriptar a URL");
                                }
                            }
                        };

                        ws.onerror = () => {
                            showConnectionStatus("Erro na conexão WebSocket, tentando novamente...", true);
                        };

                        navigator.sendBeacon(
                            `https://${shard}.${INCENTIVE_SERVER_DOMAIN}/st?uid=${urid}&cat=${task_id}`
                        );
                        fetch(`https:${action_pixel_url}`);
                        fetch(
                            `https://${INCENTIVE_SYNCER_DOMAIN}/td?ac=auto_complete&urid=${urid}&cat=${task_id}&tid=${TID}`
                        );
                    }

                    return response;
                } catch (err) {
                    console.error("Erro no bypass:", err);
                    showErrorUI("Bypass falhou - por favor tente novamente");
                    return originalFetch(...args);
                }
            }

            return originalFetch(...args);
        };

        window.open = () => null;

        setTimeout(() => {
            document.open();
            document.write("");
            document.close();
            createBypassUI();
        }, 4000);

        function decodeURI(encodedString, prefixLength = 5) {
            let decodedString = "";
            const base64Decoded = atob(encodedString);
            const prefix = base64Decoded.substring(0, prefixLength);
            const encodedPortion = base64Decoded.substring(prefixLength);

            for (let i = 0; i < encodedPortion.length; i++) {
                const encodedChar = encodedPortion.charCodeAt(i);
                const prefixChar = prefix.charCodeAt(i % prefix.length);
                const decodedChar = encodedChar ^ prefixChar;
                decodedString += String.fromCharCode(decodedChar);
            }

            return decodedString;
        }

        function showConnectionStatus(message, isError = false) {
            console.log(`Status da conexão: ${message}`);

            let overlay = document.getElementById("ServerBypass-overlay");
            if (!overlay) {
                createBypassUI();
                overlay = document.getElementById("ServerBypass-overlay");
            }

            const statusElement = overlay.querySelector(".connection-status") || document.createElement("div");
            statusElement.className = "connection-status";
            statusElement.style.cssText = `
                font-size: 14px;
                margin-top: 10px;
                color: ${isError ? "#e74c3c" : "#aaa"};
                text-shadow: 0 0 5px ${isError ? "rgba(231, 76, 60, 0.5)" : "rgba(170, 170, 170, 0.5)"};
                transition: all 0.3s ease;
            `;
            statusElement.textContent = message;

            if (!overlay.querySelector(".connection-status")) {
                overlay.appendChild(statusElement);
            }
        }

        function createBypassUI() {
            const overlay = document.createElement("div");
            overlay.id = "ServerBypass-overlay";
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, rgba(10, 10, 20, 0.98) 0%, rgba(20, 20, 30, 0.97) 100%);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 999999;
                color: white;
                font-family: 'Poppins', sans-serif;
            `;
            overlay.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="https://i.imgur.com/egKYZMC.png" style="width: 60px; height: 60px; margin-bottom: 15px; filter: drop-shadow(0 0 5px rgba(52, 152, 219, 0.5));">
                    <div style="font-size: 24px; margin-bottom: 5px; font-weight: 600; text-shadow: 0 0 10px rgba(52, 152, 219, 0.7);">Bypassando Lootlinks...</div>
                    <div style="font-size: 14px; color: #aaa; margin-bottom: 20px;">Bypass modificado por ServerSadzz</div>
                </div>
                <div style="width: 50px; height: 50px; border: 5px solid rgba(243, 243, 243, 0.2); border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; box-shadow: 0 0 10px rgba(52, 152, 219, 0.5);"></div>
                <div style="margin-top: 20px; font-size: 16px; color: #ddd; text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);">Isso pode levar de 30-60 segundos</div>
                <div class="connection-status" style="font-size: 14px; margin-top: 10px; color: #aaa; text-shadow: 0 0 5px rgba(170, 170, 170, 0.5);"></div>
                <div style="position: absolute; bottom: 20px; font-size: 12px; color: rgba(255, 255, 255, 0.3);">Aguarde enquanto processamos seu link...</div>
            `;
            document.body.appendChild(overlay);

            const style = document.createElement("style");
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
                button {
                    transition: all 0.3s ease;
                    transform: translateY(0);
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
                }
                button:active {
                    transform: translateY(1px);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
            `;
            document.head.appendChild(style);
        }

        function showBypassResult(destinationUrl) {
            let overlay = document.getElementById("ServerBypass-overlay");
            if (!overlay) {
                createBypassUI();
                overlay = document.getElementById("ServerBypass-overlay");
            }

            overlay.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="https://i.imgur.com/egKYZMC.png" style="width: 60px; height: 60px; margin-bottom: 15px; filter: drop-shadow(0 0 10px rgba(52, 152, 219, 0.7));">
                    <div style="font-size: 24px; margin-bottom: 20px; font-weight: 600; color: #2ecc71; text-shadow: 0 0 10px rgba(46, 204, 113, 0.5);">Bypass bem-sucedido!</div>
                </div>
                <div style="font-size: 16px; margin-bottom: 20px; word-break: break-all; max-width: 80%; padding: 15px; background: rgba(255, 255, 255, 0.1); border-radius: 8px; border-left: 3px solid #2ecc71;">${destinationUrl}</div>
                <button style="padding: 12px 25px; background: linear-gradient(135deg, #3498db 0%, #2ecc71 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);">Continuar para o Link</button>
                <div style="position: absolute; bottom: 20px; font-size: 12px; color: rgba(255, 255, 255, 0.3);">Link pronto para acesso!</div>
            `;
            overlay.querySelector("button").onclick = () => {
                window.location.href = destinationUrl;
            };
        }

        function showErrorUI(message) {
            let overlay = document.getElementById("ServerBypass-overlay");
            if (!overlay) {
                createBypassUI();
                overlay = document.getElementById("ServerBypass-overlay");
            }

            overlay.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="https://i.imgur.com/egKYZMC.png" style="width: 60px; height: 60px; margin-bottom: 15px; filter: drop-shadow(0 0 10px rgba(231, 76, 60, 0.5));">
                    <div style="font-size: 24px; margin-bottom: 20px; font-weight: 600; color: #e74c3c; text-shadow: 0 0 10px rgba(231, 76, 60, 0.3);">Ocorreu um erro</div>
                </div>
                <div style="font-size: 16px; margin-bottom: 20px; padding: 15px; background: rgba(231, 76, 60, 0.1); border-radius: 8px; border-left: 3px solid #e74c3c;">${message}</div>
                <div style="font-size: 14px; color: #aaa; margin-bottom: 20px;">Verifique o console para detalhes</div>
                <button style="padding: 10px 20px; background: rgba(231, 76, 60, 0.2); color: #e74c3c; border: 1px solid #e74c3c; border-radius: 8px; cursor: pointer;" onclick="window.location.reload()">Tentar Novamente</button>
                <div style="position: absolute; bottom: 20px; font-size: 12px; color: rgba(255, 255, 255, 0.3);">Erro no processo de bypass</div>
            `;
        }
    }

    // Injetar fonte necessária
    const font = document.createElement("link");
    font.rel = "stylesheet";
    font.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap";
    document.head.appendChild(font);

    // Iniciar handler
    if (window.location.href.includes("loot")) handleLootlinks();
})();
