// Define an interface for the parsed arguments
interface CommandLineOptions {
    [key: string]: string;
}

// Function to parse command line arguments
export function parseCommandLineArguments(): CommandLineOptions {
    let args: CommandLineOptions = {};

    for (let i = 2; i < process.argv.length; i++) {
        // Look for a named parameter (format: --key=value)
        let arg = process.argv[i];
        if (arg.startsWith("--")) {
            // Split the argument based on the equal sign
            let splitArg = arg.substring(2).split("=");
            if (splitArg.length === 2) {
                // Add to the arguments dictionary
                const [key, value] = splitArg;
                args[key] = value;
            } else {
                console.warn(`Warning: Invalid argument format detected: ${arg}`);
            }
        }
    }

    return args;
}