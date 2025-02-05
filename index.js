#!/usr/bin/env node

import prompts from "prompts";
import { execSync } from "child_process";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import ora from "ora";

const CONFIG = {
  templates: {
    vite: "template-vite",
    viteTailwind: "template-vite-tailwind",
  },
  commands: {
    createVite: (name) => `npm create vite@latest ${name} -- --template react`,
    createNext: (name) => `npx create-next-app@latest ${name}`,
    installTailwind: "npm install tailwindcss @tailwindcss/vite",
  },
};

class ProjectGenerator {
  constructor() {
    this.spinner = ora();
    this.dirname = path.dirname(fileURLToPath(import.meta.url));
  }

  checkDependencies() {
    try {
      execSync("npm --version", { stdio: "ignore" });
    } catch {
      throw new Error(
        "❌ npm is required but not installed. Please install npm first."
      );
    }
  }

  async getProjectConfig() {
    console.log(chalk.cyan("\n📦 Project Configuration\n"));

    const response = await prompts([
      {
        type: "select",
        name: "framework",
        message: "Choose a framework:",
        choices: [
          { title: "Vite + React", value: "vite" },
          { title: "Next.js", value: "next" },
        ],
      },
      {
        type: (prev) => (prev === "vite" ? "toggle" : null),
        name: "tailwind",
        message: "Install Tailwind CSS?",
        initial: true,
        active: "Yes",
        inactive: "No",
      },
      {
        type: "text",
        name: "projectName",
        message: "Project name:",
        validate: this.validateProjectName,
      },
    ]);

    if (!response.framework || !response.projectName) {
      throw new Error("Operation cancelled");
    }

    return response;
  }

  validateProjectName(name) {
    if (!name) return "❌ Project name required";
    if (fs.existsSync(name)) return "❌ Directory already exists";
    if (!/^[a-z0-9-_]+$/i.test(name))
      return "❌ Only letters, numbers, hyphens & underscores allowed";
    return true;
  }

  async copyTemplateFiles(projectPath, useTailwind) {
    this.spinner.start("📝 Adding files...");
    const templateDir = useTailwind
      ? CONFIG.templates.viteTailwind
      : CONFIG.templates.vite;
    const templatePath = path.join(this.dirname, templateDir);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`❌ ${templateDir} directory not found!`);
    }

    await this.cleanDirectory(projectPath);
    await fs.copy(templatePath, projectPath, {
      filter: (src) => !src.includes("node_modules"),
    });
    this.spinner.succeed("Files added successfully");
  }

  async cleanDirectory(projectPath) {
    const files = await fs.readdir(projectPath);
    for (const file of files) {
      if (file !== "package.json" && file !== "node_modules") {
        await fs.remove(path.join(projectPath, file));
      }
    }
  }

  async createViteProject(projectPath, useTailwind) {
    this.spinner.start("🚀 Creating Vite project...");
    await execSync(CONFIG.commands.createVite(path.basename(projectPath)), {
      stdio: "inherit",
    });
    this.spinner.succeed("Vite project created");

    process.chdir(projectPath);

    if (useTailwind) {
      this.spinner.start("🎨 Installing Tailwind CSS...");
      await execSync(CONFIG.commands.installTailwind, { stdio: "inherit" });
      this.spinner.succeed("Tailwind CSS installed");
    }

    await this.copyTemplateFiles(projectPath, useTailwind);
  }

  async createNextProject(projectPath) {
    this.spinner.start("🚀 Creating Next.js project...");
    await execSync(CONFIG.commands.createNext(path.basename(projectPath)), {
      stdio: "inherit",
    });
    this.spinner.succeed("Next.js project created");

    console.log(chalk.green("\n🎉 Setup complete! Next steps:"));
    console.log(chalk.cyan("\n1. Navigate to your project:"));
    console.log(chalk.blue(`   cd ${path.basename(projectPath)}`));
    console.log(chalk.cyan("\n2. Start development server:"));
    console.log(chalk.blue("   npm run dev"));
  }

  async generate() {
    try {
      this.checkDependencies();
      const config = await this.getProjectConfig();
      const projectPath = path.resolve(process.cwd(), config.projectName);

      if (config.framework === "vite") {
        await this.createViteProject(projectPath, config.tailwind);
      } else {
        await this.createNextProject(projectPath);
      }
    } catch (error) {
      this.spinner.fail();
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  }
}

new ProjectGenerator().generate();
