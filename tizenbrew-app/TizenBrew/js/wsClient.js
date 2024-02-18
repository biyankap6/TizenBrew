"use strict";

let client;
const isTizen3 = navigator.userAgent.includes('Tizen 3.0');

function connect() {
    const ip = localStorage.getItem('ip');
    try {
        client = new WebSocket(`ws://${ip}`);
        client.onmessage = onMessage;
        client.onopen = onOpen;
        client.onerror = () => {
            localStorage.removeItem('ip');
            window.location.reload();
        }
    } catch(e) {
        localStorage.removeItem('ip');
        window.location.reload();
    }
    
}

window.send = (message) => {
    client.send(JSON.stringify(message));
}

function onMessage(msg) {
    const message = JSON.parse(msg.data);
    switch (message.type) {
        case 'debugStatus': {
            if (message.inDebug) {
                // TODO: Handle debug status in UI.
                send({ type: 'loadModules' });
            } else {
                send({ type: 'relaunchInDebug', isTizen3 });
                tizen.application.getCurrentApplication().exit();
            }
            break;
        }
        case 'modules': {
            if (message.modules.length != 0) {
                let firstOne = true;
                document.getElementById('appList').innerHTML = '';
                for (const module of message.modules) {
                    document.getElementById('appList').innerHTML += `
                    <div data-packagename="${module.name}" data-appPath="${module.appPath}" class="card has-w-96 is-shadowed column is-one-quarter is-full-mobile is-flex ${firstOne ? 'has-bg-primary' : 'has-bg-secondary'} item">
                        <div>
                            <h1 class="has-mb-1 has-text-white">${module.appName}</h1>
                            <h3 class="is-semitransparent">
                                ${module.description}
                            </h3>
                        </div>
                    </div>
                    `;
                    firstOne = false;
                }
                window.selectedItem = document.querySelector(".has-bg-primary");
                window.currentRow = selectedItem.parentElement.parentElement;
            } else {
                document.getElementById('navigateText').innerHTML = "Seems like you haven't installed any modules (or configured them) yet. Get to installing, I guess.";
                window.selectedItem.style.display = 'none';
            }
            break;
        }
        case 'error': {
            document.getElementById('errorDiv').innerHTML = `<div class="alert has-mb-none item" style="background-color: #db2b2b;">
            <h1 class="has-text-light">Error: ${message.message}</h1>
            </div>`
            setTimeout(() => {
                document.getElementById('errorDiv').innerHTML = '';
            }, 5000);
        }
        default: {
           // This should never happen.
        }
    }
}

function onOpen() {
    // We have to get the debug status to know if we need to relaunch in debug mode.
    send({ type: 'getDebugStatus' });
}