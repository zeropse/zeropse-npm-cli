#!/usr/bin/env node

import inquirer from "inquirer";
import chalk from "chalk";
import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prompt = inquirer.createPromptModule();

// Execute shell commands safely
function runCommand(command, options = {}) {
  try {
    execSync(command, { stdio: "inherit", ...options });
  } catch (error) {
    console.error(`❌ Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
  return true;
}

// Remove unnecessary files safely
async function removeUnnecessaryFiles(projectName) {
  const pathsToRemove = [
    "public",
    "README.md",
    "src/assets",
    "src/App.css",
    "src/index.css",
  ].map((file) => path.join(projectName, file));

  await Promise.allSettled(
    pathsToRemove.map(async (filePath) => {
      try {
        await fs.rm(filePath, { recursive: true, force: true });
      } catch {
        console.warn(`⚠️ Could not remove ${filePath}`);
      }
    })
  );
}

// Copy template files safely
async function copyFileFromTemplate(templatePath, targetPath) {
  try {
    await fs.copyFile(templatePath, targetPath);
  } catch {
    console.warn(`⚠️ Missing template file: ${path.basename(templatePath)}`);
  }
}

async function installVite(projectName, useTS) {
  console.log(
    `🚀 Creating a Vite project: ${projectName} (${
      useTS ? "TypeScript" : "JavaScript"
    })...`
  );

  if (
    !runCommand(
      `npm create vite@latest ${projectName} -- --template ${
        useTS ? "react-ts" : "react"
      }`
    )
  ) {
    return process.exit(1);
  }

  console.log("📦 Installing dependencies...");
  if (!runCommand("npm install", { cwd: projectName })) {
    return process.exit(1);
  }

  await removeUnnecessaryFiles(projectName);

  if (!useTS) {
    await setupViteFiles(projectName);
  }
}

async function setupViteFiles(projectName) {
  const stylesDir = path.join(projectName, "src/style");
  await fs.mkdir(stylesDir, { recursive: true });

  const templateFiles = [
    { src: "bin/files/gitignore.txt", dest: ".gitignore" },
    { src: "bin/files/vite/index.txt", dest: "index.html" },
    { src: "bin/files/vite/app.txt", dest: "src/App.jsx" },
    { src: "bin/files/vite/main.txt", dest: "src/main.jsx" },
    { src: "bin/files/vite/style.txt", dest: "src/style/index.css" },
  ];

  await Promise.all(
    templateFiles.map(({ src, dest }) =>
      copyFileFromTemplate(
        path.join(__dirname, src),
        path.join(projectName, dest)
      )
    )
  );
}

async function installNext(projectName) {
  console.log(`🚀 Creating a Next.js project: ${projectName}...`);

  if (!runCommand(`npx create-next-app@latest ${projectName}`)) {
    return process.exit(1);
  }

  await removeUnnecessaryFiles(projectName);
}

async function installTailwind(projectName, useTS) {
  console.log("🎨 Installing Tailwind CSS...");

  if (
    !runCommand("npm install tailwindcss @tailwindcss/vite", {
      cwd: projectName,
    })
  ) {
    return process.exit(1);
  }

  await setupTailwindFiles(projectName, useTS);

  console.log("✅ Tailwind CSS setup complete!");
}

async function setupTailwindFiles(projectName, useTS) {
  const stylesDir = path.join(projectName, "src/style");
  await fs.mkdir(stylesDir, { recursive: true });

  const templateFiles = [
    { src: "bin/files/tailwind/vite.config.txt", dest: "vite.config.js" },
    { src: "bin/files/tailwind/css.txt", dest: "src/style/index.css" },
    { src: "bin/files/tailwind/indextailwind.txt", dest: "index.html" },
    { src: "bin/files/tailwind/app.txt", dest: "src/App.jsx" },
    { src: "bin/files/tailwind/main.txt", dest: "src/main.jsx" },
  ];

  await Promise.all(
    templateFiles.map(({ src, dest }) =>
      copyFileFromTemplate(
        path.join(__dirname, src),
        path.join(projectName, dest)
      )
    )
  );
}

async function main() {
  console.log(chalk.cyan("\n📦 Project Configuration\n"));
  try {
    const { framework } = await prompt([
      {
        type: "list",
        name: "framework",
        message: "Choose your framework:",
        choices: ["React (Vite)", "NextJS"],
      },
    ]);

    const { projectName } = await prompt([
      {
        type: "input",
        name: "projectName",
        message: "Enter the name of your project:",
        default: "my-project",
      },
    ]);

    if (framework === "React (Vite)") {
      const { useTS, useTailwind } = await prompt([
        {
          type: "confirm",
          name: "useTS",
          message: "Do you want to use TypeScript?",
          default: false,
        },
        {
          type: "confirm",
          name: "useTailwind",
          message: "Do you want to use Tailwind CSS?",
          default: true,
        },
      ]);

      await installVite(projectName, useTS);

      if (useTailwind) {
        await installTailwind(projectName, useTS);
      }
    } else {
      await installNext(projectName);
    }

    console.log("✅ Project setup complete! Happy coding! 🎉");
  } catch (error) {
    console.error("❌ An error occurred:", error.message);
  }
}

main();
