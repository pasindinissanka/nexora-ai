// =========================================================
// NEXORA AI V3
// =========================================================



const API_URL = "https://nexora-ai-backend.pasindinissanka27.workers.dev";





const CHATS_KEY = "nexora_saved_chats";
const ACTIVE_KEY = "nexora_active_chat_id";

function getSavedChats() {
    try {
        return JSON.parse(localStorage.getItem(CHATS_KEY) || "[]");
    } catch {
        return [];
    }
}
const oldChats = localStorage.getItem("nexora_saved_chats");

if (oldChats) {
    try {
        const parsed = JSON.parse(oldChats);
        if (!Array.isArray(parsed)) {
            localStorage.removeItem("nexora_saved_chats");
        }
    } catch {
        localStorage.removeItem("nexora_saved_chats");
    }
}
let savedChats = getSavedChats();
let activeChatId = localStorage.getItem(ACTIVE_KEY);

let conversationHistory = [];

if (activeChatId) {
    const activeChat = savedChats.find(
        chat => chat.id === activeChatId
    );

    if (activeChat) {
        conversationHistory = activeChat.messages || [];
    }
} else {
    // Preserve messages saved using the previous version
    try {
        conversationHistory = JSON.parse(
            localStorage.getItem("nexora_chat_history") || "[]"
        );
    } catch {
        conversationHistory = [];
    }
}

function saveChatHistory() {
    if (!conversationHistory.length) return;

    if (!activeChatId) {
        activeChatId = crypto.randomUUID();
        localStorage.setItem(ACTIVE_KEY, activeChatId);
    }

    const title = conversationHistory.find(
        message => message.role === "user"
    )?.content.slice(0, 45) || "New Conversation";

    const chat = {
        id: activeChatId,
        title: title,
        messages: [...conversationHistory]
    };

    const index = savedChats.findIndex(
        item => item.id === activeChatId
    );

    if (index >= 0) {
        savedChats[index] = chat;
    } else {
        savedChats.unshift(chat);
    }

    localStorage.setItem(CHATS_KEY, JSON.stringify(savedChats));
    localStorage.removeItem("nexora_chat_history");
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
            "Please check your internet connection and try again.",
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
    // Previous conversations are already saved automatically.
    activeChatId = null;
    conversationHistory = [];

    localStorage.removeItem("nexora_active_chat_id");
    localStorage.removeItem("nexora_chat_history");

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
    if (conversationHistory.length > 0) {
        const welcome = document.getElementById("welcome");
        if (welcome) welcome.remove();
    }

    conversationHistory.forEach(message => {
        if (message.role === "user") {
            addMessage(message.content, "user");
        } else if (message.role === "assistant") {
            addMessage(message.content, "ai");
        }
    });
});



function showSavedChats() {
    const list = document.getElementById("chatHistoryList");
    if (!list) return;

    list.innerHTML = "";

    getSavedChats().forEach(chat => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "saved-chat-item";
        button.textContent = "💬 " + chat.title;

        button.onclick = () => {
            localStorage.setItem("nexora_active_chat_id", chat.id);
            localStorage.removeItem("nexora_chat_history");
            location.reload();
        };

        list.appendChild(button);
    });
}

document.addEventListener("DOMContentLoaded", showSavedChats);

