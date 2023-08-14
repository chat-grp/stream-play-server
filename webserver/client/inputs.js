document.getElementById("map").addEventListener("click", createGamepadMapping);
document.getElementById("init").addEventListener("click", resumeGamepadInput);
document.getElementById("pause").addEventListener("click", pauseGamepadInput);
document.getElementById("addGamepad").addEventListener("click", addGamepad);

// Check if the browser supports the Gamepad API
if ("getGamepads" in navigator) {
    // Start listening for gamepad events
    window.addEventListener("gamepadconnected", onGamepadConnected);
    window.addEventListener("gamepaddisconnected", onGamepadDisconnected);
} else {
    console.log("Gamepad API is not supported");
}

// Event handler when a gamepad is connected
function onGamepadConnected(event) {
    const gamepad = event.gamepad;
    const gamepadIndex = gamepad.index;
    const gamepadName = gamepad.id.toString();
    console.log("Gamepad connected:" + gamepad.id + " : " + gamepad.index);

    if (currentMappingButtons[gamepadIndex].length > 0) {
        return;
    }

    if (gamepadName.toLowerCase().includes("xbox")){
        console.log("GOT XBOX CONTROLLER");
        // Xbox 360
        currentMappingButtons[gamepadIndex] = {
            0: [false, 12],
            1: [false, 13],
            2: [false, 14],
            3: [false, 15],
            4: [false, 8],
            5: [false, 9],
            6: [true, 3],
            7: [true, 4],
            8: [false, 5],
            9: [false, 4],
            10: [false, 6],
            11: [false, 7],
            12: [false, 0],
            13: [false, 1],
            14: [false, 2],
            15: [false, 3]
        };
        currentMappingAxes[gamepadIndex] = {
            0: [true, 0],
            1: [true, 1],
            2: [true, 2],
            3: [true, 5]
        };
    } else if (gamepadName.toLowerCase().includes("ps3")){
        console.log("GOT PS3 CONTROLLER");
        // PS3
        currentMappingButtons[gamepadIndex] = {
            0: [false, 5],
            1: [false, 6],
            2: [false, 7],
            3: [false, 4],
            4: [false, 0],
            5: [false, 3],
            6: [false, 1],
            7: [false, 2],
            8: [true, 3],
            9: [true, 4],
            10: [false, 8],
            11: [false, 9],
            12: [false, 15],
            13: [false, 13],
            14: [false, 12],
            15: [false, 14]
        };
        currentMappingAxes[gamepadIndex] = {
            0: [true, 0],
            1: [true, 1],
            2: [true, 2],
            5: [true, 5]
        };
    }

    console.log(currentMappingButtons[gamepadIndex]);
    console.log(currentMappingAxes[gamepadIndex]);

    const table = document.getElementById("defaultcontroller");

    while (table.rows.length > 0) {
        table.deleteRow(0);
    }

    for (const element of defaultXboxController) {
        const row = table.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        const cell3 = row.insertCell(2);

        cell1.innerHTML = element.name;
        cell2.innerHTML = element.value;
        cell3.innerHTML = element.isAnalog;
    }

    populateTable(gamepadIndex);
    
}

// Event handler when a gamepad is disconnected
function onGamepadDisconnected(event) {
    const gamepad = event.gamepad;
    console.log("Gamepad disconnected:" + gamepad.id + " : " + gamepad.index);
}

function initGamepadInput() {
    console.log("INIT GAMEPAD INPUT");

    // Set the bit at the specified index (buttonIndex)
    function setBit(buttonIndex) {
        nextBitArray |= 1 << buttonIndex;
    }

    // Initialize the bit array
    let bitArray = [0, 0, 0, 0];
    let nextBitArray = 0;
    let stickValues = [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]];
    let moved = [false, false, false, false];

    // Function to update gamepad input
    function updateGamepadInput() {
        // console.log("READING");
        if (isPaused) {
            // Exit the function if it's paused
            return;
        }
        // Get the list of connected gamepads
        const gamepads = navigator.getGamepads();

        // Iterate through each gamepad
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (gamepad) {
                nextBitArray = 0;
                moved[i] = false;                        

                // Handle gamepad buttons input
                for (let j = 0; j < gamepad.buttons.length; j++) {
                    if (j in currentMappingButtons[i]){
                        const button = gamepad.buttons[j];
                        const curr = currentMappingButtons[i][j];
                        // Check if the button is pressed
                        if (button.pressed) {
                            if (!curr[0]) {
                                setBit(curr[1], nextBitArray);
                            } else if (stickValues[i][curr[1]] !== 100) {
                                stickValues[i][curr[1]] = 100;
                                moved[i] = true;
                            }
                        } else {
                            if (curr[0] && stickValues[i][curr[1]] !== 0){
                                stickValues[i][curr[1]] = 0;
                                moved[i] = true;
                            }
                        }
                    }
                }

                // Handle gamepad axis input
                for (let k = 0; k < gamepad.axes.length; k++) {
                    if (k in currentMappingAxes[i]){
                        const axis = ((gamepad.axes[k] * 100) | 0);
                        const curr = currentMappingAxes[i][k];
                        // Check if the axe is moved
                        if (!curr[0] && axis > 50) {
                            setBit(curr[1], nextBitArray);
                        } else if (axis !== stickValues[i][curr[1]]) {
                            stickValues[i][curr[1]] = axis;
                            moved[i] = true;
                        }
                    }
                }

                if (nextBitArray !== bitArray[i]) {
                    moved[i] = true;
                    bitArray[i] = nextBitArray;
                }

                if (moved[i]) {
                    console.log("SENDING");
                    console.log(bitArray[i].toString(2));
                    console.log(stickValues);
                    send({
                        type: "GAMEPAD",
                        data: JSON.stringify({
                            wButtons: bitArray[i],
                            bLeftTrigger: stickValues[i][3],
                            bRightTrigger: stickValues[i][4],
                            sThumbLX: stickValues[i][0],
                            sThumbLY: stickValues[i][1],
                            sThumbRX: stickValues[i][2],
                            sThumbRY: stickValues[i][5],
                        }),
                        option: i,
                    });
                }
            }
        }

        // Continue listening for gamepad input
        requestAnimationFrame(updateGamepadInput);
    }

    // Start listening for gamepad input
    requestAnimationFrame(updateGamepadInput);
}

// Flag to control the loop
let isPaused = true;

// Function to pause the gamepad input
function pauseGamepadInput() {
    isPaused = true;
}

// Function to resume the gamepad input
function resumeGamepadInput() {
    if (isPaused) {
        isPaused = false;
        initGamepadInput(); // Start/resume the loop
    }
}

const defaultXboxController = [
    { name: "DPadUp", value: 0, isAnalog: false },
    { name: "DPadDown", value: 1, isAnalog: false },
    { name: "DPadLeft", value: 2, isAnalog: false },
    { name: "DPadRight", value: 3, isAnalog: false },
    { name: "Start", value: 4, isAnalog: false },
    { name: "Back", value: 5, isAnalog: false },
    { name: "LeftThumbstick", value: 6, isAnalog: false },
    { name: "RightThumbstick", value: 7, isAnalog: false },
    { name: "LeftShoulder", value: 8, isAnalog: false },
    { name: "RightShoulder", value: 9, isAnalog: false },
    // { name: "Guide", value: 10, isAnalog: false },
    { name: "A", value: 12, isAnalog: false },
    { name: "B", value: 13, isAnalog: false },
    { name: "X", value: 14, isAnalog: false },
    { name: "Y", value: 15, isAnalog: false },
    { name: "LeftTrigger", value: 3, isAnalog: true },
    { name: "RightTrigger", value: 4, isAnalog: true },
    { name: "LeftThumbstick (X-Axis)", value: 0, isAnalog: true },
    { name: "LeftThumbstick (Y-Axis)", value: 1, isAnalog: true },
    { name: "RightThumbstick (X-Axis)", value: 2, isAnalog: true },
    { name: "RightThumbstick (Y-Axis)", value: 5, isAnalog: true }
];
  
var currentMappingButtons = [{}, {}, {}, {}]
// format = 0: [true, 1]

var currentMappingAxes = [{}, {}, {}, {}]
// format = 0: [true, 1]

async function createGamepadMapping() {

    // Get the list of connected gamepads
    const gamepads = navigator.getGamepads();

    // Prompt the user to press each button
    console.log("Press each gamepad button when prompted:");

    // Iterate through each gamepad
    for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i];
        if (gamepad) {
            console.log(i);
            await checkButtonPress(gamepad); // Start checking for button press
        }
    }

    // Function to handle button mapping
    async function mapButtons(gamepadIndex, askedInput, defaultValues, isAnalog) {
        return new Promise((resolve, reject) => {
        const gamepad = navigator.getGamepads()[gamepadIndex];

        const buttons = gamepad.buttons;
        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];

            if (button.pressed) {
                console.log(i + ", " + isAnalog + ", " + askedInput);
                currentMappingButtons[gamepadIndex][i] = [isAnalog, askedInput];
                resolve(); // Resolve the Promise to signal completion
                return; // Exit the loop and function
            }
        }

        const axes = gamepad.axes;
        for (let i = 0; i < axes.length; i++) {
            const axe = axes[i];

            if (Math.abs(axe - defaultValues[i]) > 0.5) {
                // console.log(axe);
                console.log(i + ", " + isAnalog + ", " + askedInput);
                currentMappingAxes[gamepadIndex][i] = [isAnalog, askedInput];
                resolve(); // Resolve the Promise to signal completion
                return; // Exit the loop and function
            }
        }

        // If no button is pressed, schedule the next iteration
        requestAnimationFrame(() => {
            mapButtons(gamepadIndex, askedInput, defaultValues, isAnalog)
            .then(resolve) // Propagate the resolve signal
            .catch(reject); // Propagate any error
            });
        });
    }

    // Function to continuously check for button press
    async function checkButtonPress(gamepad) {
        // const gamepad = navigator.getGamepads()[gamepadindex];
        const axes = gamepad.axes;
        const gamepadindex = gamepad.index;
        var defaultValues = [];

        for (let i = 0; i < axes.length; i++) {
            defaultValues[i] = axes[i];
        }

        for (const element of defaultXboxController) {
            console.log(`Key: ${element.name}, Value: ${element.value}, IsAnalog: ${element.isAnalog}` );
            try {
                await mapButtons(gamepadindex, element.value, defaultValues, element.isAnalog);
                console.log("Is ok");
                await delay(1000);
            } catch (error) {
                console.log("Error mapping")
            }
        }

        console.log(currentMappingButtons[gamepadindex]);
        console.log(currentMappingAxes[gamepadindex]);
        console.log(gamepadindex);
        populateTable(gamepadindex);
    }
}

// Function to introduce a delay using setTimeout
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to populate the table with data
function populateTable(index) {
    const table = document.getElementById("controller"+index);

    while (table.rows.length > 0) {
        table.deleteRow(0);
    }

    // For currentMappingButtons
    for (const [key, value] of Object.entries(currentMappingButtons[index])) {
        const row = table.insertRow();
        const cell1 = row.insertCell(0);
        cell1.innerHTML = key;
        const cell2 = row.insertCell(1);
        cell2.innerHTML = value;
    }

    // For currentMappingAxes
    for (const [key, value] of Object.entries(currentMappingAxes[index])) {
        const row = table.insertRow();
        const cell1 = row.insertCell(0);
        cell1.innerHTML = key;
        const cell2 = row.insertCell(1);
        cell2.innerHTML = value;
    }

}

function addGamepad() {
    console.log("Adding gamepad on the server");
    send({
        type: "ADDGAMEPAD",
        data: "",
    });
}

// Disabled for now as I couldn't find a clean way to handle keyboard input in background
function initKeyAndMouseInput() {
        // Set the inputs
    // log key
    document.addEventListener("keydown", (e) => {
        console.log(e);
        // send({
        //     type: "KEYDOWN",
        //     data: JSON.stringify({
        //         keyCode: e.keyCode,
        //     }),
        // });
    });

    // document.addEventListener("keyup", (e) => {
    //     send({
    //         type: "KEYUP",
    //         data: JSON.stringify({
    //             keyCode: e.keyCode,
    //         }),
    //     });
    // });

    // Add the event listeners for mousedown, mousemove, and mouseup
    // video.addEventListener("mousedown", (e) => {
    //     x = e.offsetX;
    //     y = e.offsetY;
    //     boundRect = video.getBoundingClientRect();
    //     console.log(e.offsetX, e.offsetY);
    //     send({
    //         type: "MOUSEDOWN",
    //         data: JSON.stringify({
    //             isLeft: e.button == 0 ? 1 : 0, // 1 is right button
    //             x: e.offsetX,
    //             y: e.offsetY,
    //             width: boundRect.width,
    //             height: boundRect.height,
    //         }),
    //     });
    // });

    // video.addEventListener("mouseup", (e) => {
    //     x = e.offsetX;
    //     y = e.offsetY;
    //     boundRect = video.getBoundingClientRect();
    //     console.log(e.offsetX, e.offsetY);
    //     send({
    //         type: "MOUSEUP",
    //         data: JSON.stringify({
    //             isLeft: e.button == 0 ? 1 : 0, // 1 is right button
    //             x: e.offsetX,
    //             y: e.offsetY,
    //             width: boundRect.width,
    //             height: boundRect.height,
    //         }),
    //     });
    // });

    // video.addEventListener("mousemove", function (e) {
    //     x = e.offsetX;
    //     y = e.offsetY;
    //     boundRect = video.getBoundingClientRect();
    //     send({
    //         type: "MOUSEMOVE",
    //         data: JSON.stringify({
    //             isLeft: e.button == 0 ? 1 : 0, // 1 is right button
    //             x: e.offsetX,
    //             y: e.offsetY,
    //             width: boundRect.width,
    //             height: boundRect.height,
    //         }),
    //     });
    // });
}