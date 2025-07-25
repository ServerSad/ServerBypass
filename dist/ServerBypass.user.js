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
                background: rgba(0, 0, 0, 0.95);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 999999;
                color: white;
                font-family: 'Poppins', sans-serif;
            `;
            overlay.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 20px;">Bypassando Lootlinks...</div>
                <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <div style="margin-top: 20px; font-size: 16px;">Isso pode levar de 30-60 segundos</div>
                <div class="connection-status" style="font-size: 14px; margin-top: 10px; color: #aaa;">Bypass modificado por ServerSadzz...</div>
            `;
            document.body.appendChild(overlay);

            const style = document.createElement("style");
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
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
                <div style="font-size: 24px; margin-bottom: 20px;">Bypass bem-sucedido!</div>
                <div style="font-size: 16px; margin-bottom: 20px; word-break: break-all; max-width: 80%;">${destinationUrl}</div>
                <button style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Continuar para o Link</button>
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
                <div style="font-size: 24px; margin-bottom: 20px; color: #e74c3c;">Ocorreu um erro</div>
                <div style="font-size: 16px; margin-bottom: 20px;">${message}</div>
                <div style="font-size: 14px; color: #aaa;">Verifique o console para detalhes</div>
            `;
        }
    }

    // Injetar fonte necessária
    const font = document.createElement("link");
    font.rel = "stylesheet";
    font.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap";
    document.head.appendChild(font);

    // Iniciar handler
    if (window.location.href.includes("loot")) handleLootlinks();
})();
