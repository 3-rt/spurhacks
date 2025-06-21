import fs from "fs";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Initialize the Groq client
const groq = new Groq(GROQ_API_KEY);
async function main() {
  // Create a translation job
  const translation = await groq.audio.translations.create({
    file: fs.createReadStream("harvard.wav"), // Required path to audio file - replace with your audio file!
    model: "whisper-large-v3", // Required model to use for translation
    prompt: "Specify context or spelling", // Optional
    language: "en", // Optional ('en' only)
    response_format: "json", // Optional
    temperature: 0.0, // Optional
  });
  // Log the transcribed text
  console.log(translation.text);
}
main();