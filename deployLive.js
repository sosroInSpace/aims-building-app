const fs = require("fs");
const { spawn } = require("child_process");

// Clear the console
console.clear();

// Create the config file
const config = {
    name: "aims-inspection",
    scope: "james-casellas-projects"
};

fs.writeFileSync("vercel-temp.json", JSON.stringify(config, null, 2));

// Run the Vercel deploy command and wait for it to complete
console.log("Starting Vercel deployment...");
const deployProcess = spawn("npx", ["vercel", "--prod", "--local-config", "vercel-temp.json", "--yes"], {
    stdio: "inherit", // Show output in console
    shell: true
});

deployProcess.on("close", code => {
    console.log(`\nVercel deployment finished with exit code: ${code}`);

    // Delete the temp file after deployment completes
    fs.unlink("vercel-temp.json", err => {
        if (err) {
            console.error("Failed to delete temp config file:", err);
        } else {
            console.log("Temporary config file cleaned up.");
        }
    });
});

deployProcess.on("error", error => {
    console.error("Failed to start deployment:", error);

    // Clean up temp file even if deployment fails
    fs.unlink("vercel-temp.json", err => {
        if (err) {
            console.error("Failed to delete temp config file:", err);
        }
    });
});
