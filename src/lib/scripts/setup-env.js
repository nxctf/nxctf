const fs = require("fs");
const path = require("path");
const readline = require("readline");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    });
  });
}

async function run() {
  try {
    const envLocalExists = fs.existsSync(path.join(PROJECT_ROOT, ".env.local"));
    const envExists = fs.existsSync(path.join(PROJECT_ROOT, ".env"));

    if (envLocalExists || envExists) {
      // Env already setup, skip
      return;
    }

    if (!process.stdin.isTTY) {
      console.log(".env.local not found. Non-interactive terminal detected, skipping environment file generation.");
      return;
    }

    console.log(".env.local not found.\n");
    const answer = await askQuestion("Do you want to generate .env.local from .env.example? (Y/n) ");
    const choice = answer.trim().toLowerCase();

    if (choice === "" || choice === "y" || choice === "yes") {
      let sourceFile = path.join(PROJECT_ROOT, ".env.example");
      if (!fs.existsSync(sourceFile)) {
        sourceFile = path.join(PROJECT_ROOT, "env.example");
      }

      if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, path.join(PROJECT_ROOT, ".env.local"));
        console.log(`Successfully generated .env.local from ${path.basename(sourceFile)}`);
      } else {
        console.error("Error: Neither .env.example nor env.example found in the project root.");
      }
    } else {
      console.log("Skipping .env.local generation.");
    }
  } catch (err) {
    console.error("Failed during environment setup:");
    console.error(err.message);
    process.exit(1);
  }
}

run();
