import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_FILE = join(__dirname, "..", "data", "countdowns.json");

export class CountdownStore {
  constructor() {
    this.countdowns = this.load();
  }

  load() {
    try {
      if (existsSync(DATA_FILE)) {
        const data = readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(data).map((c) => ({
          ...c,
          targetDate: new Date(c.targetDate),
        }));
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    }
    return [];
  }

  save() {
    try {
      const dir = dirname(DATA_FILE);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(DATA_FILE, JSON.stringify(this.countdowns, null, 2), "utf-8");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des données:", error);
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  create(data) {
    const countdown = {
      id: this.generateId(),
      title: data.title,
      targetDate: data.targetDate,
      style: data.style,
      createdAt: new Date().toISOString(),
    };

    this.countdowns.push(countdown);
    this.save();
    return countdown;
  }

  get(id) {
    return this.countdowns.find((c) => c.id === id);
  }

  getAll() {
    return [...this.countdowns];
  }

  delete(id) {
    const index = this.countdowns.findIndex((c) => c.id === id);
    if (index === -1) {
      return false;
    }
    this.countdowns.splice(index, 1);
    this.save();
    return true;
  }
}

