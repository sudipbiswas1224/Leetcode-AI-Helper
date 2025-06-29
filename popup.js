
document.addEventListener('DOMContentLoaded', () => {
    const submit_btn = document.querySelector('button');
    const api_key_input = document.querySelector('.api-key-input');
    let API_KEY = '';
   

    submit_btn.addEventListener('click', () => {
        API_KEY = api_key_input.value;
        api_key_input.value = ''
        chrome.storage.sync.set({apikey: API_KEY},function(){
            console.log('api key saved');
        })
        
    });
    
    
});


