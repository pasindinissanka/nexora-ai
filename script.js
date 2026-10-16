// =========================================================
// NEXORA AI V3
// =========================================================



const API_URL = "https://nexora-ai-backend.pasindinissanka27.workers.dev";




let conversationHistory = JSON.parse(
    localStorage.getItem("nexora_chat_history") || "[]"
);

function saveChatHistory() {
    localStorage.setItem(
        "nexora_chat_history",
        JSON.stringify(conversationHistory)
    );
}



// ================= SEND MESSAGE =================

async function sendMessage() {

    const input = document.getElementById("messageInput");
    const message = input.value.trim();

    if (!message) return;

    const welcome = document.getElementById("welcome");

    if (welcome) {
        welcome.remove();
    }

    addMessage(message, "user");

    input.value = "";
    autoResize();

    const thinking = addMessage(
        "✦ NEXORA is thinking...",
        "ai",
        true
    );

    try {

        const response = await fetch(API_URL + "/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: message,
                history: conversationHistory
            })
        });

        const data = await response.json();

        thinking.remove();

        if (!response.ok) {
            throw new Error(
                data.error || "NEXORA backend error"
            );
        }

        const answer = data.answer;

        addMessage(answer, "ai");

        conversationHistory.push({
            role: "user",
            content: message
        });

        conversationHistory.push({
            role: "assistant",
            content: answer
        });

     saveChatHistory();

    }

    catch (error) {

        thinking.remove();

        addMessage(
            "### ⚠️ Connection problem\n\n" +
            "NEXORA couldn't reach the intelligence server. " +
            "Please check that the Colab backend and Cloudflare tunnel are running.",
            "ai"
        );

        console.error("NEXORA ERROR:", error);
    }
}


// ================= DISPLAY MESSAGE =================

function addMessage(text, sender, temporary = false) {

    const chatArea = document.getElementById("chatArea");

    const message = document.createElement("div");

    message.className = "message " + sender;

    if (temporary) {
        message.classList.add("temporary");
    }

    const content = document.createElement("div");

    content.className = "message-content";


    // User text remains plain and safe
    if (sender === "user") {

        content.textContent = text;

    }

    // NEXORA answers render Markdown
    else {

        if (
            typeof marked !== "undefined" &&
            !temporary
        ) {

            content.innerHTML = marked.parse(text);

        } else {

            content.textContent = text;

        }
    }


    message.appendChild(content);

    chatArea.appendChild(message);

    chatArea.scrollTop = chatArea.scrollHeight;

    return message;
}


// ================= SUGGESTIONS =================

function useSuggestion(text) {

    const input = document.getElementById("messageInput");

    input.value = text;

    autoResize();

    input.focus();
}


// ================= NEW CHAT =================

function newChat() {

    conversationHistory = [];

    location.reload();
}


// ================= MOBILE MENU =================

function toggleSidebar() {

    const sidebar = document.getElementById("sidebar");

    sidebar.classList.toggle("open");
}


// ================= TEXTAREA =================

function autoResize() {

    const input = document.getElementById("messageInput");

    input.style.height = "auto";

    input.style.height =
        Math.min(input.scrollHeight, 130) + "px";
}


const messageInput =
    document.getElementById("messageInput");


messageInput.addEventListener(
    "input",
    autoResize
);


messageInput.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }
    }
);
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js");
    });
}
window.addEventListener("DOMContentLoaded", () => {
    conversationHistory.forEach(message => {
        if (message.role === "user" || message.role === "assistant") {
            addMessage(message.content, message.role);
        }
    });
});
