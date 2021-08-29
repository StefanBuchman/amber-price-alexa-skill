const Alexa = require('ask-sdk-core');
const axios = require('axios');

const AMBER_SCREEN = require('./apl_amberPrice.json');
const AMBER_TOKEN = 'amberToken';

let AMBER_API_ENDPOINT = process.env.AMBER_API_ENDPOINT;
let AMBER_API_KEY = process.env.AMBER_API_KEY;
let AMBER_SITE = process.env.AMBER_SITE;

async function getCurrentAmberPrice() {
    
    let config = {
        headers: {
          'Authorization': 'Bearer ' + AMBER_API_KEY
        }
      };
      
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowDate = tomorrow.toLocaleDateString('en-AU');
    
    const response = await axios.get(`${AMBER_API_ENDPOINT}/${AMBER_SITE}/prices?resolution=30&endDate=${tomorrowDate}`, config);

    var currentPriceRaw = response.data.filter(interval => interval.type === 'CurrentInterval');
    let pricekWhFl = parseFloat(currentPriceRaw[0].perKwh);
    let pricekWh = Math.round(pricekWhFl);

    var futurePricesRaw = response.data.filter(interval => interval.type === 'ForecastInterval');
    let futureSum = 0;

    for (let i = 0; i <= 5; i++) {
        futureSum += futurePricesRaw[i].perKwh;
    };

    let futureAverageFl = futureSum/6;
    let futurePriceAvg = Math.round(futureAverageFl);
    
    return {currentPrice: pricekWh, futureAverage: futurePriceAvg};
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome, you can say whats the price of electricity or Help. Which would you like to try?';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CurrentPriceIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CurrentPriceIntent';
    },
    async handle(handlerInput) {
        const priceResponse = await getCurrentAmberPrice();

        const pricekWh = priceResponse.currentPrice;
        const futurekWh = priceResponse.futureAverage;

        let priceDelta = pricekWh - futurekWh;

        console.log({currentPrice: pricekWh, futureAverage: futurekWh, priceDelta: priceDelta});
        
        let speakOutput = `The current price of electricity is ${pricekWh} cents per kilowatt hour.`;
        
        let amberBg = "https://alexa-skill-asset-repo.s3.ap-southeast-2.amazonaws.com/images/amber-green.png";
        
        if (pricekWh <= 22) {
            speakOutput += " Now is a great time to run appliances."
        } else if (pricekWh > 22 && pricekWh <= 30) {
            amberBg = "https://alexa-skill-asset-repo.s3.ap-southeast-2.amazonaws.com/images/amber-orange.png"
            speakOutput += " Only run appliances if you have to right now."
            
        } else if (pricekWh > 30) {
            amberBg = "https://alexa-skill-asset-repo.s3.ap-southeast-2.amazonaws.com/images/amber-red.png"
            speakOutput += " Avoid running any appliances, time to conserve."
        }

        if (priceDelta < -2) {
            speakOutput += ` Prices are dropping by ${priceDelta} cents per kilowatt hour over the next 3 hours.`
        } else if (priceDelta > 2) {
            speakOutput += speakOutput += ` Prices are increasing by ${priceDelta} cents per kilowatt hour over the next 3 hours.`
        } else {
            speakOutput += " Prices are steady for the next 3 hours."
        }

        console.log(speakOutput);
        
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']){
            
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .addDirective({
                    type: 'Alexa.Presentation.APL.RenderDocument',
                    document: AMBER_SCREEN,
                    datasources: {
                        "headlineTemplateData": {
                            "type": "object",
                            "objectId": "headlineSample",
                            "properties": {
                                "backgroundImage": {
                                    "contentDescription": null,
                                    "smallSourceUrl": null,
                                    "largeSourceUrl": null,
                                    "sources": [
                                        {
                                            "url": amberBg,
                                            "size": "large"
                                        }
                                    ]
                                },
                                "textContent": {
                                    "primaryText": {
                                        "type": "PlainText",
                                        "text": `Electricity is currently ${String(pricekWh)}¢/kWh`
                                    }
                                },
                                "logoUrl": "",
                                "hintText": "Try, \"Alexa, ask Amber when to run the dishwasher?\""
                            }
                        }
                    },
                })
                .getResponse();
            
        } else {
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        }
    }
};

const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello World!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        CurrentPriceIntentHandler,
        HelloWorldIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
        ) 
    .addErrorHandlers(
        ErrorHandler,
        )
    .lambda();
