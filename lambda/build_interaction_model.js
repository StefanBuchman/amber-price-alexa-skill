const { ControlInteractionModelGenerator } = require('ask-sdk-controls');

new ControlInteractionModelGenerator()
    .withInvocationName('amber')
    .addIntent({ name: 'AMAZON.StopIntent' })
    .addIntent({ name: 'AMAZON.NavigateHomeIntent' })
    .addIntent({ name: 'AMAZON.HelpIntent' })
    .addIntent({ name: 'AMAZON.CancelIntent' })

    // Add a custom intent
    .addIntent({ name: 'CurrentPriceIntent', samples: [
        "what's the current price",
        "what is the price of electricity",
        "electricity"
    ]})

    .buildAndWrite('../skill-package/interactionModels/custom/en-AU.json');