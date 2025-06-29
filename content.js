let problemTitle = ''
let problemDescription = ''
let userCode = ''


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

        //getting the prompt 

        chrome.storage.sync.get(['apikey'], function (result) {
            const APIKEY = result.apikey;
            const prompt = buildPrompt(userMsg);
            callGemini(prompt, APIKEY);
        })
    }
})

//rendering the usermsg
const renderUserMessage = (msg) => {
    const userMsg = document.createElement('div')
    userMsg.classList.add('user-msg');
    userMsg.textContent = msg;
    ai_response.appendChild(userMsg);
}

//rendering aimsg
const renderAIMessage = (msg) => {
    const aiMsg = document.createElement('div');
    aiMsg.classList.add('ai-msg');
    aiMsg.innerHTML = marked.parse(msg);
    ai_response.appendChild(aiMsg);
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
    return `
LeetCode Problem: ${problemTitle}

Description:
${problemDescription}

User's Code:
${userCode}

User's Question:
${userMsg}

Please help the user step by step, considering the problem and their code and their query.
`;
};

//calling the API
const callGemini = (prompt, apiKey) => {
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
        renderAIMessage(aiReply);
    })
    .catch(error => {
        renderAIMessage("Error: Could not get a response from Gemini.");
        console.error(error);
    });
};

