/**
 * Home Assistant
 *
 * This Pebble App displays and changes
 * Homeassistant data
 *
 * Davide Nastri, 11/16/2017
 */

var UI = require('ui');
var ajax = require('ajax');
var vibe = require('ui/vibe');
var Voice = require('ui/voice');
var temperature;
var humidity;
var thermostateTemperature;
var newThermostateTemperature;
var thermostateStatus;
var upstairsLightsStatus;
var downstairsLightsStatus;
var thermostateData;
var ajax = require('ajax');

var updateDataUrl = 'UPDATE_DATA_URL';
var homeAssistantUrl = 'HOME_ASSISTANT_URL';
var particleDeviceID = 'PARTICLE_DEVICE_ID';
var particleTokenID = 'PARTICLE_TOKEN_ID';
var homeAssistantHeaders = "HOME_ASSISTANT_HEADERS";

var splashScreen = new UI.Card({ banner: 'images/splash.png' });

var mainCard = new UI.Card({
    //title: 'Home Assistant',
    //titleColor: 'sunset-orange', // Named string
    //subtitle: 'Color',
    //subtitleColor: '#00dd00', // 6-digit Hexadecimal string
    body: 'Loading data...',
    bodyColor: 0x9a0036, // 6-digit Hexadecimal number
    style: 'mono',
    action: {
        backgroundColor: 'black',
        up: 'images/lightbulb_white_icon.png',
        select: 'images/thermometer_white_icon.png',
        down: 'images/microphone_white_icon.png'
    }
});

var bulbMenu = new UI.Menu({
    sections: [{
        title: 'Upstairs',
        items: [{
            title: 'Upstairs',
            subtitle: 'Toggle lights'
        }, {
            title: 'Stairs Lamp',
            subtitle: 'Toggle Stairs Lamp'
        }, {
            title: 'Pc Lamp',
            subtitle: 'Toggle Pc Lamp'
        }, {
            title: 'Bedroom Leds',
            subtitle: 'Toggle Bedroom Leds'
        }, {
            title: 'Bedroom Lamp',
            subtitle: 'Toggle Bedroom Light'
        }, {
            title: 'Downstairs',
            subtitle: 'Toggle lights'
        }, {
            title: 'Tv Lamp',
            subtitle: 'Toggle Tv Lamp'
        }, {
            title: 'Sofa Lamp',
            subtitle: 'Toggle Sofa Lamp'
        }, {
            title: 'Gaming',
            subtitle: 'Time to play'
        }, {
            title: 'Goodnight',
            subtitle: 'Sleep tight'
        }, {
            title: 'Gaia sleep mode',
            subtitle: '<3 Ninna Gaia <3'
        }]
    }]
});

bulbMenu.on('select', function(e) {
    switch (e.item.title) {
        case "Upstairs":
            servicesAjaxCall('internet_button_1/1/unreal');
            break;
        case "Stairs Lamp":
            homeAssistantAjaxCall('switch', 'toggle', {
                "entity_id": "switch.stairs"
            });
            break;
        case "Pc Lamp":
            homeAssistantAjaxCall('switch', 'toggle', {
                "entity_id": "switch.pc"
            });
            break;
        case "Bedroom Leds":
            homeAssistantAjaxCall('switch', 'toggle', {
                "entity_id": "switch.bedroom"
            });
            break;
        case "Bedroom Lamp":
            homeAssistantAjaxCall('light', 'toggle', {
                "entity_id": "light.shower"
            });
            break;
        case "Downstairs":
            servicesAjaxCall('internet_button_1/3/unreal');
            break;
        case "Tv Lamp":
            homeAssistantAjaxCall('light', 'toggle', {
                "entity_id": "light.tv"
            });
            break;
        case "Sofa Lamp":
            homeAssistantAjaxCall('light', 'toggle', {
                "entity_id": "light.lamp"
            });
            break;
        case "Gaming":
            servicesAjaxCall('internet_button_1/4/unreal');
            break;
        case "Goodnight":
            servicesAjaxCall('internet_button_1/2/unreal');
            break;
        case "Gaia sleep mode":
            servicesAjaxCall('internet_button_2/3/unreal');
            break;
    }
});

var thermostateMenu = new UI.Menu({
    sections: [{
        items: [{
            title: 'Thermostate on',
            subtitle: 'Turn thermostate on'
        }, {
            title: 'Thermostate off',
            subtitle: 'Turn thermostate off'
        }, {
            title: 'Raise temperature',
            subtitle: 'Raise by 0.5 Celsius'
        }, {
            title: 'Lower temperature',
            subtitle: 'Lower by 0.5 Celsius'
        }]
    }]
});

thermostateMenu.on('select', function(e) {
    switch (e.item.title) {
        case "Thermostate on":
            homeAssistantAjaxCall('climate', 'set_operation_mode', {
                "operation_mode": "performance"
            });
            break;
        case "Thermostate off":
            homeAssistantAjaxCall('climate', 'set_operation_mode', {
                "operation_mode": "eco"
            });
            break;
        case "Raise temperature":
            newThermostateTemperature = parseFloat(thermostateTemperature);
            newThermostateTemperature = newThermostateTemperature + 0.5;
            console.log('Current temp: ' + String(thermostateTemperature));
            console.log('New temp: ' + String(newThermostateTemperature));
            homeAssistantAjaxCall('climate', 'set_temperature', {
              "entity_id": "climate.toon_van_eneco",
              "temperature": String(newThermostateTemperature)
            });
            break;
        case "Lower temperature":
            newThermostateTemperature = parseFloat(thermostateTemperature);
            newThermostateTemperature = newThermostateTemperature - 0.5;
            homeAssistantAjaxCall('climate', 'set_temperature', {
                "entity_id": "climate.toon_van_eneco",
                "temperature": String(newThermostateTemperature)
            });
            break;
    }
});

mainCard.on('accelTap', function(e) {
    //vibe.vibrate('short');
    console.log('Shake detected.');
    updateData();
});

mainCard.on('show', function(e) {
    console.log('mainCard show detected.');
    updateData();
});

mainCard.on('click', function(e) {
    switch (e.button) {
        case 'up':
            bulbMenu.show();
            console.log('Up press on mainCard detected');
            break;
        case 'select':
            console.log('Select press on mainCard detected');
            thermostateMenu.show();
            break;
        case 'down':
            getUserVoice();
            console.log('Down press on mainCard detected');
            break;
        default:
            console.log('Error in mainCard button click');
    }
});

function strPad(n) {
    return String("0" + n).slice(-2);
}

function updateData() {
    console.log('Updating data...');
    mainCard.body('Loading...');
    ajax({
            url: updateDataUrl,
            type: 'json'
        },
        function(data) {
            temperature = data.current_temperature;
            thermostateTemperature = data.set_temperature;
            thermostateStatus = data.thermostate;
            upstairsLightsStatus = data.upstairs_lights;
            downstairsLightsStatus = data.living_room_lights;
            humidity = data.humidity;
            thermostateData = thermostateTemperature + ' ' + thermostateStatus;
            var currentDate = new Date();
            var currentDay = strPad(currentDate.getDate());
            var currentMonth = strPad(currentDate.getMonth()+1);
            var currentYear = currentDate.getFullYear().toString().substr(-2);
            var currentDateString = currentDay + '/' + currentMonth + '/' + currentYear;
            mainCard.body('   ' + currentDateString + '\n\nLights\nUp:  ' + upstairsLightsStatus + '\nDow: ' + downstairsLightsStatus + '\n\nThermostate\nNow: ' + temperature + '\nSet: ' + thermostateData);
            console.log('\nNow: ' + temperature + '\nSet: ' + thermostateData + '\nUp:  ' + upstairsLightsStatus + '\nDow: ' + downstairsLightsStatus);
            return data;
        }
    );
}

function homeAssistantAjaxCall(domain, service, serviceData) {
    vibe.vibrate('short');
    ajax({
            url: homeAssistantUrl + '/api/services/' + domain + '/' + service,
            method: 'post',
            data: serviceData,
            type: 'json',
            headers: homeAssistantHeaders
        },
        function(data) {
            console.log(data);
            vibe.vibrate('short');
            showMessage('Result', 'Request was successful', '');
        },
        function(error) {
            vibe.vibrate('short');
            vibe.vibrate('short');
            vibe.vibrate('short');
            showMessage('Result', 'Request returned an error', error);
        }
    );
}

function particlePhotonAjaxCall(command, parameters) {
    vibe.vibrate('short');
    var mydata = {
        access_token: particleTokenID,
        args: parameters
    };
    ajax({
            url: 'https://api.particle.io/v1/devices/' + particleDeviceID + '/' + command,
            method: 'post',
            data: mydata
        },
        function(data) {
            data = JSON.parse(data);
            if (data.return_value == 1) {
                vibe.vibrate('short');
                showMessage('Result', 'Request was successful', 'Command was sent without any problem');
            } else {
                vibe.vibrate('short');
                vibe.vibrate('short');
                vibe.vibrate('short');
                showMessage('Result', 'Request returned an error', data);
            }
        },
        function(error) {
            vibe.vibrate('short');
            vibe.vibrate('short');
            vibe.vibrate('short');
            showMessage('Result', 'Request returned an error', error);
        }
    );
}

function servicesAjaxCall(command, parameters) {
    console.log('Starting Services Ajax Call');
    vibe.vibrate('short');
    ajax({
            url: 'http://www.davidenastri.it:8080/' + command,
            method: 'get'
        },
        function(data) {
            console.log(data);
            data = JSON.parse(data);
            if (data.return_value == 1) {
                vibe.vibrate('short');
                showMessage('Result', 'Request was successful', '');
            } else {
                vibe.vibrate('short');
                vibe.vibrate('short');
                vibe.vibrate('short');
                showMessage('Result', 'Request returned an error', data);
            }
        },
        function(error) {
            vibe.vibrate('short');
            vibe.vibrate('short');
            vibe.vibrate('short');
            showMessage('Result', 'Request returned an error', error);
        }
    );
}

function showMessage(title, subtitle, body) {
    var card = new UI.Card();
    card.title(title);
    card.subtitle(subtitle);
    card.body(body);
    card.show();
    card.style('small');
    setTimeout(function() {
        card.hide();
        updateData();
    }, 3000);
}

function getUserVoice() {
    console.log('Getting user voice...');
    // Start a diction session and skip confirmation
    Voice.dictate('start', true, function(e) {
        if (e.err) {
            console.log('Error: ' + e.err);
            return;
        }
        showMessage('Voice recognized', '', e.transcription);
        parseVoiceInputText(e.transcription);
        return e.transcription;
    });

}

function parseVoiceInputText(textString) {
    var myRegexp = /^(accendi|spegni|attiva).*(luce|luci|computer|riscaldamento|scena).*?(gaming|studio|soggiorno|scale|camera da letto|soggiorno|gaia|tv|divano)?$/g;
    var match = myRegexp.exec(textString.toLowerCase());
    try {
        var verb = match[1];
        var object = match[2];
        var location = match[3];
        console.log("Voice command received: " + verb + " " + object + " " + location);
        switch (true) {
            case ((verb === 'accendi' || verb === 'spegni') && (object === 'luci') && (location === 'soggiorno')):
                servicesAjaxCall('internet_button_1/3/unreal');
                break;
            case ((verb === 'accendi' || verb === 'spegni') && (object === 'luci') && (location === 'camera da letto')):
                servicesAjaxCall('internet_button_1/1/unreal');
                break;
            case ((verb === 'attiva') && (object === 'scena') && (location === 'gaia')):
                servicesAjaxCall('internet_button_2/3/unreal');
                break;
            case ((verb === 'attiva') && (object === 'scena') && (location === 'gaming')):
                servicesAjaxCall('internet_button_1/4/unreal');
                break;
            case ((verb === 'accendi' || verb === 'spegni') && (object === 'luce') && (location === 'tv')):
                homeAssistantAjaxCall('light', 'toggle', {
                    "entity_id": "light.tv"
                });
                break;
            case ((verb === 'accendi' || verb === 'spegni') && (object === 'luce') && (location === 'divano')):
                homeAssistantAjaxCall('light', 'toggle', {
                    "entity_id": "light.lamp"
                });
                break;
          default:
                showMessage('Non capisco', 'Ecco alcuni esempi', 'Attiva la scena gaming\nAccendi le luci in soggiorno\nAccendi le luci in camera da letto');
                break;
        }
    } catch (err) {
        showMessage('Non capisco', 'Ecco alcuni esempi', 'Attiva la scena gaming\nAccendi le luci in soggiorno\nAccendi le luci in camera da letto');
    }
    return;
}

updateData();

setTimeout(function() {
    splashScreen.hide();
    mainCard.show();
}, 2500);

splashScreen.show();


// Set Interval Snippet
//setInterval(function(){
//  updateData();
//}, 5000);
