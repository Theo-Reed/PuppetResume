# Puppet Resume - Backend
A professional AI-driven resume tailoring and PDF generation backend powered by Node.js, Puppeteer, and Gemini AI.
[中文版](./README_CN.md)

## Core Capability: Automatic Resume Tailoring

This project is more than just a PDF generator. Its flagship feature is **AI-Powered Resume Tailoring**: automatically filtering, highlighting, and optimizing a user's resume content based on a specific Job Description (JD) to ensure a perfect match for every application.

## Features

- ✂️ **Smart AI Tailoring**: Analyzes JDs to rewrite work experiences and skills, creating a custom resume for every job.
- 📑 **High-Quality PDF Generation**: Uses Puppeteer to generate pixel-perfect professional resumes from dynamic HTML templates.
- 🤖 **Gemini AI Integration**: Leverages Google Gemini for logical, natural, and persuasive content optimization.
- 🌍 **Multi-language Support**: Seamlessly generates resumes in both English and Chinese, handling localized date formats and terminology.
- 💳 **Membership & Payments**: Integrated WeChat Pay for membership management and premium feature access.

## Project Structure

- `src/server.ts`: Entry point for the Express application.
- `src/resumeAIService.ts`: Core AI tailoring logic.
- `src/resumeGenerator.ts`: Puppeteer-based PDF generation logic.
- `src/geminiService.ts`: Gemini AI service integration.
- `src/db.ts`: MongoDB connection and initialization.
- `src/interfaces/`: API route handlers.

## License

ISC

