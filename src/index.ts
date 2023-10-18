import OpenAI from "openai";
import {ChatCompletionMessageParam} from "openai/src/resources/chat/completions";
import {parseCommandLineArguments} from "./utils/CommandLineOptions";

/* Read program parameter into variable */

// Example dummy function hard coded to return the same weather
// In production, this could be your backend API or an external API
function getCurrentWeather(location: string, unit: "celsius" | "fahrenheit" = "fahrenheit") {
    const weatherInfo = {
        location: location,
        temperature: "72",
        unit: unit,
        forecast: ["sunny", "windy"],
    };
    return JSON.stringify(weatherInfo);
}

async function runConversation(openai: OpenAI) {

    // Step 1: send the conversation and available functions to GPT
    const messages: ChatCompletionMessageParam[] = [
        {
            role: "user",
            content: "What's the weather like in Boston?"
        }
    ];
    const functions = [
        {
            name: "get_current_weather",
            description: "Get the current weather in a given location",
            parameters: {
                type: "object",
                properties: {
                    location: {
                        type: "string",
                        description: "The city and state, e.g. San Francisco, CA",
                    },
                    unit: {"type": "string", "enum": ["celsius", "fahrenheit"]},
                },
                required: ["location"],
            },
        }
    ];

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-16k",
        messages: messages,
        functions: functions,
        function_call: "auto",  // auto is default, but we'll be explicit
    });
    const responseMessage = response.choices[0].message;
    // Step 2: check if GPT wanted to call a function

    if (responseMessage.function_call) {
        // Step 3: call the function
        // Note: the JSON response may not always be valid; be sure to handle errors
        const availableFunctions: Record<string, any> = {
            get_current_weather: getCurrentWeather,
        };  // only one function in this example, but you can have multiple
        const functionName = responseMessage.function_call.name;
        const functionToCall = availableFunctions[functionName];
        const functionArgs = JSON.parse(responseMessage.function_call.arguments);
        const functionResponse = functionToCall(...functionArgs);

        // Step 4: send the info on the function call and function response to GPT
        messages.push(responseMessage);  // extend conversation with assistant's reply
        messages.push({
            role: "function",
            name: functionName,
            content: functionResponse,
        });  // extend conversation with function response
        const secondResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-16k",
            messages: messages,
        });  // get a new response from GPT where it can see the function response
        return secondResponse.choices[0].message;
    }
}




// Main logic
function main() {
    const openai = new OpenAI();

    runConversation(openai).then(console.log).catch(console.error);
}

// Execute the script
main();