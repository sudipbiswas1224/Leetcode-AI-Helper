let problemTitle = ''
let problemDescription = ''
let userCode = ''
let chatHistory = []


//ai-help-button funcionality 
const ai_help_btn = document.createElement('div');
ai_help_btn.textContent = 'AI HELP'
ai_help_btn.classList.add('open');
ai_help_btn.classList.add('button');

document.body.appendChild(ai_help_btn);

//chatbox functionality 
const chatbox = document.createElement('div');
chatbox.classList.add('chatbox')
chatbox.classList.add('hidden');
document.body.appendChild(chatbox);

//ai response div
const ai_response = document.createElement('div');
ai_response.classList.add('ai-response');
chatbox.appendChild(ai_response);

//input and send container
const input_send = document.createElement('div')
input_send.classList.add('input-send');
chatbox.appendChild(input_send)

//user input
const user_input = document.createElement('textarea')
user_input.classList.add('user-input')
user_input.setAttribute('placeholder', 'Ask something')
input_send.appendChild(user_input)


//send button
const send_btn = document.createElement('img')
send_btn.src = 'https://cdn-icons-png.flaticon.com/512/12439/12439274.png';
send_btn.classList.add('send-btn');
input_send.appendChild(send_btn);


//Ai help button press functionality 
let isChatbotVisible = false;
ai_help_btn.addEventListener('click', () => {
    chatbox.classList.toggle('hidden');
    isChatbotVisible = !isChatbotVisible;
    if (isChatbotVisible) {
        ai_help_btn.classList.toggle('close')
        ai_help_btn.classList.toggle('open')
        ai_help_btn.textContent = 'CLOSE'
    }
    else {
        ai_help_btn.textContent = 'AI HELP'
        ai_help_btn.classList.toggle('open')
        ai_help_btn.classList.toggle('close')
    }

})

//send button feature 
send_btn.addEventListener('click', () => {
    //getting the problem context
    fetchProblemContext();

    const userMsg = user_input.value;
    if (userMsg != '') {
        renderUserMessage(userMsg);
        user_input.value = '';

        // Show 'AI is thinking...' placeholder
        const thinkingMsg = document.createElement('div');
        thinkingMsg.classList.add('ai-msg', 'thinking-msg');
        thinkingMsg.textContent = 'AI is thinking...';
        ai_response.appendChild(thinkingMsg);

        //getting the prompt 
        chrome.storage.sync.get(['apikey'], function (result) {
            const APIKEY = result.apikey;
            const prompt = buildPrompt(userMsg);
            callGemini(prompt, APIKEY, thinkingMsg); // Pass the placeholder element
            chatHistory.push({ role: "User", content: userMsg });
        })
    }
})

//rendering the usermsg
const renderUserMessage = (msg) => {
    const userMsg = document.createElement('div')
    userMsg.classList.add('user-msg');
    userMsg.textContent = msg;
    ai_response.appendChild(userMsg);
    // Scroll to bottom
    ai_response.scrollTop = ai_response.scrollHeight;
}

//rendering aimsg
const renderAIMessage = (msg) => {
    const aiMsg = document.createElement('div');
    aiMsg.classList.add('ai-msg');
    aiMsg.innerHTML = marked.parse(msg);
    ai_response.appendChild(aiMsg);
    // Scroll to bottom
    ai_response.scrollTop = ai_response.scrollHeight;
}

//fetching problem context
const fetchProblemContext = () => {
    //getting the tile
    const problemTitleDiv = document.querySelector('title');
    problemTitle = problemTitleDiv ? problemTitleDiv.textContent : null;
    console.log(problemTitle);

    //getting the problem and the user code 
    const metaDescription = document.querySelector('meta[name="description"]');
    problemDescription = metaDescription ? metaDescription.content.slice(44) : null;
    console.log(problemDescription);


    //getting the code
    const codeLines = document.body.querySelectorAll('.view-line');
    codeLines.forEach(line => {
        userCode += line.textContent + '\n';
    })
    console.log(userCode);

}

//building a promt
const buildPrompt = (userMsg) => {
    let prompt = `
LeetCode Problem: \n${problemTitle}\n

Description:\n
${problemDescription}\n

User's Code:\n
${userCode}\n

User's Question:\n
${userMsg}\n

Previous conversation:\n
`;
    chatHistory.forEach(msg => {
        prompt += `${msg.role === 'user' ? 'user' : 'AI'}: ${msg.content}\n`
    })

    prompt += 'Please continue the conversation and help the user to solve his problem according to his query and give user query specific reply'

    return prompt;
};

//calling the API
const callGemini = (prompt, apiKey, thinkingMsg) => {
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    })
        .then(response => response.json())
        .then(data => {
            // Gemini's response structure is different from OpenAI's
            const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
            if (thinkingMsg && thinkingMsg.parentNode) {
                thinkingMsg.parentNode.removeChild(thinkingMsg);
            }
            chatHistory.push({ role: "AI", content: aiReply })
            renderAIMessage(aiReply);
        })
        .catch(error => {
            if (thinkingMsg && thinkingMsg.parentNode) {
                thinkingMsg.parentNode.removeChild(thinkingMsg);
            }
            renderAIMessage("Error: Could not get a response from Gemini.");
            console.error(error);
        });
};

