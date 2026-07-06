# NIHSS Mobile Assistant 

A mobile-first clinical decision support (CDS) prototype designed to assist physicians with the National Institutes of Health Stroke Scale (NIHSS) using real-time conversational AI parsing.

## 🎯 Clinical Intent & Ecosystem Context
This repository is part of a broader engineering exploration demonstrating how large language models and agentic workflows can be safely, accountably, and transparently integrated into high-stakes clinical workflows—using acute stroke care as an initial clinical domain. 

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

## 🧩 Future Roadmap: The Stroke Copilot Ecosystem
This NIHSS Assistant is designed to function as the critical "first mile" data ingestion module within a broader, zero-duplicate-entry clinical pipeline:

1. **Bedside Capture:** Nurses and frontline providers use this mobile interface to rapidly and accurately calculate the NIHSS during an acute code.
2. **EHR Interoperability:** The tool will securely pipe this structured assessment directly into the patient's EHR, auto-populating the Telestroke Note.
3. **Downstream Decision Support:** Once in the note, this verified score feeds directly into advanced clinical decision support modules (like the *Telestroke IVT Assistant*) for immediate thrombolytic decision-making, and later into quality extraction dashboards for hospital reporting.

By streamlining data entry at the bedside, this ecosystem aims to eliminate retrospective charting burdens and ensure high-fidelity data flows across the entire multidisciplinary care team.

## Disclaimer
This repository contains experimental prototype code intended solely for research, demonstration, and educational purposes. It is not an FDA-cleared medical device, nor is it a substitute for independent clinical judgment. All final clinical determinations remain the strict responsibility of the treating physician. Do not use this software for direct patient care.
