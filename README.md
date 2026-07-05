# NIHSS Mobile Assistant (v1.0) 🧠📱

A mobile-first clinical decision support (CDS) prototype designed to assist physicians with the National Institutes of Health Stroke Scale (NIHSS) using real-time conversational AI parsing.

## 🎯 Clinical Intent & Ecosystem Context
This repository is part of a broader engineering exploration demonstrating how large language models and agentic workflows can be safely, accountably, and transparently integrated into high-stakes clinical workflows—using acute stroke care as an initial proving ground. 

During an acute stroke code, speed and accuracy are paramount. This tool explores how conversational interfaces can streamline complex neurological scoring without displacing the clinician from the center of decision-making.

---

## 🚀 Live Demo
Experience the functional frontend prototype here: 
👉 **[NIHSS Assistant Live Demo](https://nihss-assistant-984675033725.us-east1.run.app)**

---

## 🛠️ Tech Stack & Architecture
* **Frontend:** React, TypeScript, Tailwind CSS
* **AI Architecture:** Gemini API (leveraging structured JSON schemas for deterministic, auditable clinical extraction)
* **Deployment:** Containerized and hosted via Google Cloud Run
