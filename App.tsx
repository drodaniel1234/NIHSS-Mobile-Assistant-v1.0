import React, { useState, useEffect, useRef } from "react";
import { 
  Settings, 
  RotateCcw, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  AlertTriangle, 
  Copy, 
  Info, 
  FileText, 
  ArrowRight, 
  Cpu, 
  CheckCircle,
  HelpCircle
} from "lucide-react";

// --- Types ---

interface Option {
  score: number | string;
  label: string;
  description: string;
}

interface NIHSSItem {
  id: string;
  shortName: string;
  fullName: string;
  instructions: string;
  options: Option[];
}

interface Message {
  id: string;
  sender: "system" | "nurse" | "ai";
  text: string;
  timestamp: string;
  isAiSuggestion?: boolean;
  suggestedScore?: number | string;
  isClarification?: boolean;
  confidence?: "high" | "low";
  rationale?: string;
  itemId?: string;
}

// --- Standard 15 NIHSS Items ---
const NIHSS_ITEMS: NIHSSItem[] = [
  {
    id: "1a",
    shortName: "1a. LOC State",
    fullName: "1a. Level of Consciousness",
    instructions: "Observe the patient's alert state. Score what you see.",
    options: [
      { score: 0, label: "Alert", description: "Keenly responsive; active and oriented." },
      { score: 1, label: "Drowsy / Somnolent", description: "Arousable by minor stimulation (verbal, light touch) to obey commands, answer questions, or respond." },
      { score: 2, label: "Stuporous", description: "Requires repeated stimulation or painful stimuli to attend, or is obtunded (moves only with strong stimulation)." },
      { score: 3, label: "Comatose", description: "Responds only with motor reflex or autonomic effects, or totally unresponsive/flaccid." }
    ]
  },
  {
    id: "1b",
    shortName: "1b. LOC Questions",
    fullName: "1b. LOC Questions (Month & Age)",
    instructions: "Ask the patient two questions: 'What month is it?' and 'How old are you?' Answers must be exact.",
    options: [
      { score: 0, label: "Answers both correctly", description: "Correctly states both the current month and their age." },
      { score: 1, label: "Answers one correctly", description: "Correctly states either the month or age, but not both." },
      { score: 2, label: "Answers neither correctly", description: "Incorrect on both questions, mute, or severely aphasic." }
    ]
  },
  {
    id: "1c",
    shortName: "1c. LOC Commands",
    fullName: "1c. LOC Commands",
    instructions: "Ask the patient to open/close eyes and grip/release non-paretic hand. Only first attempt is scored.",
    options: [
      { score: 0, label: "Performs both correctly", description: "Successfully executes both commands." },
      { score: 1, label: "Performs one correctly", description: "Executes one command correctly but fails the other." },
      { score: 2, label: "Performs neither correctly", description: "Fails both commands entirely." }
    ]
  },
  {
    id: "2",
    shortName: "2. Best Gaze",
    fullName: "2. Best Gaze (Horizontal Movements)",
    instructions: "Test horizontal eye movements. Have patient track your finger or face side-to-side.",
    options: [
      { score: 0, label: "Normal", description: "Symmetric and full lateral eye movements." },
      { score: 1, label: "Partial gaze palsy", description: "Gaze is abnormal in one or both eyes, but forced deviation is not present." },
      { score: 2, label: "Forced deviation", description: "Complete gaze palsy or forced horizontal deviation that cannot be overcome by oculocephalic maneuver." }
    ]
  },
  {
    id: "3",
    shortName: "3. Visual Fields",
    fullName: "3. Visual Fields",
    instructions: "Test visual fields in all quadrants by finger wiggling or threat.",
    options: [
      { score: 0, label: "No visual loss", description: "Symmetric, intact visual fields in all quadrants." },
      { score: 1, label: "Partial hemianopia", description: "Asymmetric response or clear quadrant impairment." },
      { score: 2, label: "Complete hemianopia", description: "Complete loss of vision on one side." },
      { score: 3, label: "Bilateral hemianopia", description: "Blindness of any cause, including cortical blindness." }
    ]
  },
  {
    id: "4",
    shortName: "4. Facial Palsy",
    fullName: "4. Facial Palsy",
    instructions: "Ask patient to show teeth or raise eyebrows. Score symmetry of facial movement.",
    options: [
      { score: 0, label: "Normal", description: "Symmetric, normal facial movements." },
      { score: 1, label: "Minor paralysis", description: "Flattening of nasocial fold, slight asymmetry on smile or eye squeeze." },
      { score: 2, label: "Partial paralysis", description: "Clear lower facial paralysis; upper facial muscles remain relatively spared." },
      { score: 3, label: "Complete paralysis", description: "Unilateral or bilateral complete paralysis of upper and lower facial muscles." }
    ]
  },
  {
    id: "5a",
    shortName: "5a. Motor Arm - Left",
    fullName: "5a. Motor Arm - Left",
    instructions: "Extend the left arm to 90° (sitting) or 45° (supine) for 10 seconds.",
    options: [
      { score: 0, label: "No drift", description: "Holds left arm at 90° (or 45°) for the full 10 seconds." },
      { score: 1, label: "Drift", description: "Holds arm up initially, but drifts downward before the 10-second count is complete; does not hit bed." },
      { score: 2, label: "Some effort against gravity", description: "Arm drifts down to the bed but patient shows clear effort to lift or maintain it." },
      { score: 3, label: "No effort against gravity", description: "Arm falls immediately to the bed, patient cannot raise arm against gravity but has trace movement." },
      { score: 4, label: "No movement", description: "No voluntary movement or trace twitch detected." },
      { score: "UN", label: "UN - Amputation/joint fusion", description: "Limb is missing or joint is completely fused." }
    ]
  },
  {
    id: "5b",
    shortName: "5b. Motor Arm - Right",
    fullName: "5b. Motor Arm - Right",
    instructions: "Extend the right arm to 90° (sitting) or 45° (supine) for 10 seconds.",
    options: [
      { score: 0, label: "No drift", description: "Holds right arm at 90° (or 45°) for the full 10 seconds." },
      { score: 1, label: "Drift", description: "Holds arm up initially, but drifts downward before the 10-second count is complete; does not hit bed." },
      { score: 2, label: "Some effort against gravity", description: "Arm drifts down to the bed but patient shows clear effort to lift or maintain it." },
      { score: 3, label: "No effort against gravity", description: "Arm falls immediately to the bed, patient cannot raise arm against gravity but has trace movement." },
      { score: 4, label: "No movement", description: "No voluntary movement or trace twitch detected." },
      { score: "UN", label: "UN - Amputation/joint fusion", description: "Limb is missing or joint is completely fused." }
    ]
  },
  {
    id: "6a",
    shortName: "6a. Motor Leg - Left",
    fullName: "6a. Motor Leg - Left",
    instructions: "Hold left leg at 30° (always tested supine) for 5 seconds.",
    options: [
      { score: 0, label: "No drift", description: "Holds left leg at 30° for the full 5 seconds." },
      { score: 1, label: "Drift", description: "Holds leg up initially, but drifts downward before the 5-second count is complete; does not hit bed." },
      { score: 2, label: "Some effort against gravity", description: "Leg drifts down to the bed, but patient shows clear effort to lift or maintain it." },
      { score: 3, label: "No effort against gravity", description: "Leg falls immediately to the bed, patient cannot raise leg against gravity but has trace movement." },
      { score: 4, label: "No movement", description: "No voluntary movement or trace twitch detected." },
      { score: "UN", label: "UN - Amputation/joint fusion", description: "Limb is missing or joint is completely fused." }
    ]
  },
  {
    id: "6b",
    shortName: "6b. Motor Leg - Right",
    fullName: "6b. Motor Leg - Right",
    instructions: "Hold right leg at 30° (always tested supine) for 5 seconds.",
    options: [
      { score: 0, label: "No drift", description: "Holds right leg at 30° for the full 5 seconds." },
      { score: 1, label: "Drift", description: "Holds leg up initially, but drifts downward before the 5-second count is complete; does not hit bed." },
      { score: 2, label: "Some effort against gravity", description: "Leg drifts down to the bed, but patient shows clear effort to lift or maintain it." },
      { score: 3, label: "No effort against gravity", description: "Leg falls immediately to the bed, patient cannot raise leg against gravity but has trace movement." },
      { score: 4, label: "No movement", description: "No voluntary movement or trace twitch detected." },
      { score: "UN", label: "UN - Amputation/joint fusion", description: "Limb is missing or joint is completely fused." }
    ]
  },
  {
    id: "7",
    shortName: "7. Limb Ataxia",
    fullName: "7. Limb Ataxia",
    instructions: "Perform finger-to-nose and heel-to-shin tests on both sides.",
    options: [
      { score: 0, label: "Absent", description: "No coordination deficits or ataxia detected, or patient is completely paralyzed." },
      { score: 1, label: "Present in one limb", description: "Ataxia is present in either one arm or one leg." },
      { score: 2, label: "Present in two or more limbs", description: "Ataxia is present in multiple limbs (e.g., both arms, arm and leg)." }
    ]
  },
  {
    id: "8",
    shortName: "8. Sensory",
    fullName: "8. Sensory",
    instructions: "Test sensory response to pinprick on face, arms, legs, and trunk.",
    options: [
      { score: 0, label: "Normal", description: "Symmetric, intact sensation to pinprick/touch." },
      { score: 1, label: "Mild-to-moderate loss", description: "Patient feels pinprick but says it feels duller or less sharp on one side." },
      { score: 2, label: "Severe-to-total loss", description: "Patient has no awareness of touch/pinprick on the paretic side, or is comatose." }
    ]
  },
  {
    id: "9",
    shortName: "9. Best Language",
    fullName: "9. Best Language (Aphasia)",
    instructions: "Ask patient to describe the Cookie Theft picture, name items, and read sentences.",
    options: [
      { score: 0, label: "No aphasia", description: "Normal comprehension, expression, naming, and reading." },
      { score: 1, label: "Mild-to-moderate aphasia", description: "Some obvious loss of fluency or comprehension, but can still convey ideas." },
      { score: 2, label: "Severe aphasia", description: "Extremely fragmented communication; speech is heavily broken and examiner cannot comprehend much." },
      { score: 3, label: "Mute / Global aphasia", description: "Total loss of speech or comprehension; does not respond to verbal questions or naming cards." }
    ]
  },
  {
    id: "10",
    shortName: "10. Dysarthria",
    fullName: "10. Dysarthria (Speech Articulation)",
    instructions: "Ask patient to read or repeat the list of words.",
    options: [
      { score: 0, label: "0 - Normal", description: "Speech articulation is clear and completely normal." },
      { score: 1, label: "1 - Mild-to-moderate dysarthria", description: "Some slurring of words, but can still be understood with minor effort." },
      { score: 2, label: "2 - Severe dysarthria", description: "Speech is so slurred as to be unintelligible or patient is mute/anarthric." },
      { score: "UN", label: "UN - Intubated/unable to test", description: "Intubated or otherwise unable to test" }
    ]
  },
  {
    id: "11",
    shortName: "11. Extinction / Inattention",
    fullName: "11. Extinction & Inattention (Neglect)",
    instructions: "Test for neglect using double simultaneous sensory stimulation.",
    options: [
      { score: 0, label: "No inattention", description: "Symmetric perception in tactile, visual, and spatial dimensions." },
      { score: 1, label: "Partial inattention", description: "Neglects sensory stimuli on one side under double simultaneous stimulation (visual, tactile, auditory, or personal)." },
      { score: 2, label: "Complete hemi-inattention", description: "Profound hemi-inattention; lacks awareness of their paretic limb or does not respond to simultaneous stimuli in multiple modalities." }
    ]
  }
];

export default function App() {
  // --- States ---
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem("nihss_gemini_api_key") || "";
  });
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem("nihss_gemini_model") || "gemini-3.5-flash";
  });

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [scores, setScores] = useState<Record<string, number | string>>({});
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [verificationOpen, setVerificationOpen] = useState<boolean>(false);
  const [progressDropdownOpen, setProgressDropdownOpen] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>("");
  const [tempModel, setTempModel] = useState<string>("gemini-3.5-flash");
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<boolean>(false);

  // Active item
  const currentItem = NIHSS_ITEMS[currentStepIndex];

  // Ref for auto-scrolling chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Initialize first message ---
  useEffect(() => {
    resetAssessment();
  }, []);

  // --- Auto-scroll on new messages ---
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAnalyzing]);

  // --- Reset Assessment ---
  const resetAssessment = () => {
    setScores({});
    setObservations({});
    setCurrentStepIndex(0);
    setProgressDropdownOpen(false);
    
    const initialWelcome: Message = {
      id: "welcome",
      sender: "system",
      text: "👋 **Welcome to the NIHSS Clinical Assistant Prototype!**\n\nThis clinical decision support aid streamlines the 15-item **National Institutes of Health Stroke Scale (NIHSS)** assessment. \n\n**Instructions:**\n1. Select the scoring criteria directly using the tactile cards below.\n2. Or, type/dictate raw clinical observations in the bottom chat bar to have the AI parse the score for you.\n\n*Note: This is a demo for clinical decision support. Confirm each score before proceeding.*",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const firstItemGreeting: Message = {
      id: "greet-1a",
      sender: "system",
      text: `📋 Let's begin with **${NIHSS_ITEMS[0].fullName}**:\n*${NIHSS_ITEMS[0].instructions}*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      itemId: NIHSS_ITEMS[0].id
    };

    setMessages([initialWelcome, firstItemGreeting]);
  };

  // --- Save API Key ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("nihss_gemini_api_key", tempApiKey);
    localStorage.setItem("nihss_gemini_model", tempModel);
    setApiKey(tempApiKey);
    setSelectedModel(tempModel);
    setSaveToast("Settings saved successfully!");
    setTimeout(() => {
      setSaveToast(null);
      setSettingsOpen(false);
    }, 1500);

    // Add alert in message feed indicating status
    const sysMsg: Message = {
      id: `sys-config-${Date.now()}`,
      sender: "system",
      text: tempApiKey 
        ? `⚙️ **API Credentials Activated:** System configured to use **${tempModel}** with provided API Key. Live AI parsing is now active.` 
        : "⚙️ **API Credentials Cleared:** Switched to **Demo Simulator Mode** (offline rule-based clinical keyword parsing).",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, sysMsg]);
  };

  // Open settings with current stored values
  const openSettings = () => {
    setTempApiKey(apiKey);
    setTempModel(selectedModel);
    setSettingsOpen(true);
  };

  // --- Jump directly to an item from Tracker ---
  const jumpToItem = (index: number) => {
    setCurrentStepIndex(index);
    setProgressDropdownOpen(false);

    const jumpMsg: Message = {
      id: `jump-${index}-${Date.now()}`,
      sender: "system",
      text: `🔄 **Jumping to ${NIHSS_ITEMS[index].fullName}**:\n*${NIHSS_ITEMS[index].instructions}*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      itemId: NIHSS_ITEMS[index].id
    };
    setMessages(prev => [...prev, jumpMsg]);
  };

  // --- Score Confirmation Action ---
  const handleConfirmScore = (scoreVal: number | string, customObsText?: string) => {
    // Save score
    const updatedScores = { ...scores, [currentItem.id]: scoreVal };
    setScores(updatedScores);

    // Save observation text
    const label = currentItem.options.find(o => o.score === scoreVal)?.label || String(scoreVal);
    const obsText = customObsText || `Direct clinician selection: Score ${scoreVal} (${label})`;
    setObservations(prev => ({ ...prev, [currentItem.id]: obsText }));

    // Append nurse confirmation message
    const nurseMsg: Message = {
      id: `nurse-conf-${currentItem.id}-${Date.now()}`,
      sender: "nurse",
      text: `✅ **Confirmed Score ${scoreVal}** for ${currentItem.shortName}: *${label}*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Calculate updated total score
    const isLastItem = currentStepIndex === NIHSS_ITEMS.length - 1;

    setMessages(prev => [...prev, nurseMsg]);

    if (!isLastItem) {
      // Auto advance after short delay
      const nextIndex = currentStepIndex + 1;
      setTimeout(() => {
        setCurrentStepIndex(nextIndex);
        const nextItem = NIHSS_ITEMS[nextIndex];
        const nextGreeting: Message = {
          id: `greet-${nextItem.id}-${Date.now()}`,
          sender: "system",
          text: `📋 Next, **${nextItem.fullName}**:\n*${nextItem.instructions}*`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          itemId: nextItem.id
        };
        setMessages(prev => [...prev, nextGreeting]);
      }, 400);
    } else {
      // All complete! Show complete message
      setTimeout(() => {
        const total = calculateTotalScore(updatedScores);
        const severity = getSeverityCategory(total);
        const completeMsg: Message = {
          id: `complete-${Date.now()}`,
          sender: "system",
          text: `🎉 **NIH Stroke Scale Completed!**\n\n* **Cumulative NIHSS Score:** **${total} / 42**\n* **Stroke Severity:** **${severity}**\n\nPlease click the button below to verify and copy the clinician documentation note.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, completeMsg]);
        setVerificationOpen(true);
      }, 500);
    }
  };

  // --- Offline Fallback Keyword-Based Clinical Parser ---
  const simulateClinicalParsing = (text: string, itemId: string): { score: number | string; confidence: "high" | "low"; rationale: string } => {
    const cleanText = text.toLowerCase().trim();
    const activeItem = NIHSS_ITEMS.find(item => item.id === itemId) || currentItem;

    // Direct score keyword matching (e.g. "score 2", "0", "one")
    if (cleanText.includes("score 0") || cleanText === "0") {
      return { score: 0, confidence: "high", rationale: `User explicitly stated score 0: "${activeItem.options[0]?.label}".` };
    }
    if (cleanText.includes("score 1") || cleanText === "1") {
      const opt = activeItem.options.find(o => o.score === 1) || activeItem.options[1];
      return { score: 1, confidence: "high", rationale: `User explicitly requested score 1: "${opt?.label}".` };
    }
    if (cleanText.includes("score 2") || cleanText === "2") {
      const opt = activeItem.options.find(o => o.score === 2) || activeItem.options[2];
      return { score: 2, confidence: "high", rationale: `User explicitly requested score 2: "${opt?.label}".` };
    }
    if (cleanText.includes("score 3") || cleanText === "3") {
      const opt = activeItem.options.find(o => o.score === 3) || activeItem.options[3];
      if (opt) {
        return { score: 3, confidence: "high", rationale: `User explicitly requested score 3: "${opt.label}".` };
      }
    }
    if (cleanText.includes("score 4") || cleanText === "4") {
      const opt = activeItem.options.find(o => o.score === 4) || activeItem.options[4];
      if (opt) {
        return { score: 4, confidence: "high", rationale: `User explicitly requested score 4: "${opt.label}".` };
      }
    }
    if (
      cleanText.includes("untestable") || 
      cleanText.includes("amputation") || 
      cleanText.includes("fused") || 
      cleanText.includes("intubated") || 
      cleanText.includes("unable to test") || 
      cleanText === "un"
    ) {
      const opt = activeItem.options.find(o => o.score === "UN");
      if (opt) {
        return { score: "UN", confidence: "high", rationale: "User specified untestable state matching criteria UN." };
      }
    }

    // --- Ambiguity Test ---
    if (cleanText.includes("not sure") || cleanText.includes("maybe") || cleanText.includes("ambiguous") || cleanText.includes("unclear") || cleanText.length < 5) {
      const fallbackScore = activeItem.options[0]?.score ?? 0;
      return {
        score: fallbackScore,
        confidence: "low",
        rationale: "The bedside description is too brief or explicitly expresses clinical uncertainty. The duration, response amplitude, or limb-specific factors are unclear from the observation."
      };
    }

    // --- Item specific clinical rules ---
    switch (itemId) {
      case "1a": // LOC
        if (cleanText.includes("awake") || cleanText.includes("alert") || cleanText.includes("keen") || cleanText.includes("normal")) {
          return { score: 0, confidence: "high", rationale: "Patient is described as awake and responsive, indicating alert state." };
        }
        if (cleanText.includes("drowsy") || cleanText.includes("sleepy") || cleanText.includes("somnolent") || cleanText.includes("verbal stimulus") || cleanText.includes("wakes up")) {
          return { score: 1, confidence: "high", rationale: "Observation notes patient is drowsy/sleepy but arousable with voice/light touch." };
        }
        if (cleanText.includes("stuporous") || cleanText.includes("noxious") || cleanText.includes("pain") || cleanText.includes("sternal rub")) {
          return { score: 2, confidence: "high", rationale: "Patient requires physical/noxious stimulation (sternal rub) to respond, indicating stupor." };
        }
        if (cleanText.includes("coma") || cleanText.includes("unresponsive") || cleanText.includes("flaccid") || cleanText.includes("reflex")) {
          return { score: 3, confidence: "high", rationale: "Patient is completely unresponsive or responds only with reflexes, consistent with coma." };
        }
        break;

      case "1b": // LOC Questions
        if (cleanText.includes("both") || cleanText.includes("correctly") || (cleanText.includes("month") && cleanText.includes("age") && cleanText.includes("correct"))) {
          return { score: 0, confidence: "high", rationale: "Bedside note mentions patient correctly identified both age and month." };
        }
        if (cleanText.includes("one") || cleanText.includes("only month") || cleanText.includes("only age") || cleanText.includes("partial")) {
          return { score: 1, confidence: "high", rationale: "Patient correctly stated only one item (either age or month)." };
        }
        if (cleanText.includes("neither") || cleanText.includes("wrong") || cleanText.includes("aphasic") || cleanText.includes("aphasia") || cleanText.includes("mute")) {
          return { score: 2, confidence: "high", rationale: "Observation indicates patient failed to answer either question correctly or is non-verbal/aphasic." };
        }
        break;

      case "1c": // LOC Commands
        if (cleanText.includes("both") || (cleanText.includes("eyes") && cleanText.includes("hand") && cleanText.includes("did both"))) {
          return { score: 0, confidence: "high", rationale: "Patient successfully opened/closed eyes and gripped/released hand." };
        }
        if (cleanText.includes("one") || cleanText.includes("eyes only") || cleanText.includes("grip only") || cleanText.includes("only eyes") || cleanText.includes("only hand")) {
          return { score: 1, confidence: "high", rationale: "Patient was only able to perform one of the two motor commands correctly." };
        }
        if (cleanText.includes("neither") || cleanText.includes("cannot") || cleanText.includes("failed") || cleanText.includes("no command") || cleanText.includes("no movement")) {
          return { score: 2, confidence: "high", rationale: "Patient failed to perform both requested commands." };
        }
        break;

      case "2": // Gaze
        if (cleanText.includes("normal") || cleanText.includes("full") || cleanText.includes("tracking") || cleanText.includes("symmetric")) {
          return { score: 0, confidence: "high", rationale: "Bedside eye movement description indicates normal, symmetric conjugate gaze." };
        }
        if (cleanText.includes("partial") || cleanText.includes("one eye") || cleanText.includes("lag") || cleanText.includes("palsy")) {
          return { score: 1, confidence: "high", rationale: "Eye movements reveal a horizontal gaze palsy or asymmetrical restriction." };
        }
        if (cleanText.includes("forced") || cleanText.includes("locked") || cleanText.includes("deviation") || cleanText.includes("stuck")) {
          return { score: 2, confidence: "high", rationale: "Severe forced eye deviation present that could not be overcome." };
        }
        break;

      case "3": // Visual
        if (cleanText.includes("normal") || cleanText.includes("intact") || cleanText.includes("no loss") || cleanText.includes("all quadrants")) {
          return { score: 0, confidence: "high", rationale: "Visual fields are full and intact symmetrically." };
        }
        if (cleanText.includes("quadrant") || cleanText.includes("partial") || cleanText.includes("upper") || cleanText.includes("lower")) {
          return { score: 1, confidence: "high", rationale: "Identified a partial quadrantanopia or asymmetrical restriction." };
        }
        if (cleanText.includes("hemianopia") || cleanText.includes("one side") || cleanText.includes("half") || cleanText.includes("neglects side")) {
          return { score: 2, confidence: "high", rationale: "Complete visual loss detected on one side (hemianopia)." };
        }
        if (cleanText.includes("blind") || cleanText.includes("both sides") || cleanText.includes("bilateral") || cleanText.includes("cortical")) {
          return { score: 3, confidence: "high", rationale: "Severe bilateral visual loss / complete visual blindness reported." };
        }
        break;

      case "4": // Facial
        if (cleanText.includes("normal") || cleanText.includes("symmetric") || cleanText.includes("no palsy") || cleanText.includes("fine")) {
          return { score: 0, confidence: "high", rationale: "Facial expression and grimace are symmetric and normal." };
        }
        if (cleanText.includes("minor") || cleanText.includes("asymmetry") || cleanText.includes("nasolabial") || cleanText.includes("flattening") || cleanText.includes("slight")) {
          return { score: 1, confidence: "high", rationale: "Slight flattening of nasolabial fold or minor asymmetric smile." };
        }
        if (cleanText.includes("partial") || cleanText.includes("mouth") || cleanText.includes("lower face") || cleanText.includes("droop")) {
          return { score: 2, confidence: "high", rationale: "Clear lower facial weakness/droop typical of central motor lesion." };
        }
        if (cleanText.includes("complete") || cleanText.includes("total") || cleanText.includes("upper and lower") || cleanText.includes("entire face")) {
          return { score: 3, confidence: "high", rationale: "Complete hemifacial paralysis affecting both upper and lower muscle groups." };
        }
        break;

      case "5a":
      case "5b": // Arms
        if (cleanText.includes("no drift") || cleanText.includes("holds") || cleanText.includes("10 seconds") || cleanText.includes("full count") || cleanText.includes("normal strength")) {
          return { score: 0, confidence: "high", rationale: "Patient held the tested arm extended at the required angle for the full 10 seconds without drift." };
        }
        if (cleanText.includes("drift") || cleanText.includes("sinks") || cleanText.includes("falls slowly") || cleanText.includes("does not touch")) {
          return { score: 1, confidence: "high", rationale: "Arm was held up initially but drifted downward without touching the bed before 10 seconds." };
        }
        if (cleanText.includes("hits bed") || cleanText.includes("touches bed") || cleanText.includes("cannot hold") || cleanText.includes("against gravity but falls") || cleanText.includes("some effort")) {
          return { score: 2, confidence: "high", rationale: "Arm drifted all the way down to the bed, but the patient exhibited some effort against gravity." };
        }
        if (cleanText.includes("no effort") || cleanText.includes("immediately") || cleanText.includes("cannot lift") || cleanText.includes("falls immediately")) {
          // Check if total paralysis
          if (cleanText.includes("no movement") || cleanText.includes("paralyzed") || cleanText.includes("flaccid") || cleanText.includes("dead weight")) {
            return { score: 4, confidence: "high", rationale: "No trace muscle contraction or movement was detected in the limb." };
          }
          return { score: 3, confidence: "high", rationale: "The arm fell immediately to the bed, indicating no effective effort against gravity, but trace movement remains." };
        }
        break;

      case "6a":
      case "6b": // Legs
        if (cleanText.includes("no drift") || cleanText.includes("holds") || cleanText.includes("5 seconds") || cleanText.includes("full count") || cleanText.includes("normal strength")) {
          return { score: 0, confidence: "high", rationale: "Patient held the tested leg extended at 30° for the full 5 seconds without drift." };
        }
        if (cleanText.includes("drift") || cleanText.includes("sinks") || cleanText.includes("falls slowly") || cleanText.includes("does not touch")) {
          return { score: 1, confidence: "high", rationale: "Leg was held up initially but drifted downward without touching the bed before 5 seconds." };
        }
        if (cleanText.includes("hits bed") || cleanText.includes("touches bed") || cleanText.includes("cannot hold") || cleanText.includes("against gravity but falls") || cleanText.includes("some effort")) {
          return { score: 2, confidence: "high", rationale: "Leg drifted all the way down to the bed, but the patient exhibited some effort against gravity." };
        }
        if (cleanText.includes("no effort") || cleanText.includes("immediately") || cleanText.includes("cannot lift") || cleanText.includes("falls immediately")) {
          if (cleanText.includes("no movement") || cleanText.includes("paralyzed") || cleanText.includes("flaccid") || cleanText.includes("dead weight")) {
            return { score: 4, confidence: "high", rationale: "No trace muscle contraction or movement was detected in the leg." };
          }
          return { score: 3, confidence: "high", rationale: "The leg fell immediately to the bed, indicating no effective effort against gravity, but trace movement remains." };
        }
        break;

      case "7": // Ataxia
        if (cleanText.includes("normal") || cleanText.includes("no ataxia") || cleanText.includes("absent") || cleanText.includes("symmetric") || cleanText.includes("perfect")) {
          return { score: 0, confidence: "high", rationale: "Finger-to-nose and heel-to-shin testing are normal; limb ataxia is absent." };
        }
        if (cleanText.includes("one limb") || cleanText.includes("arm only") || cleanText.includes("leg only") || cleanText.includes("unilateral") || cleanText.includes("ataxic arm") || cleanText.includes("ataxic leg")) {
          return { score: 1, confidence: "high", rationale: "Ataxia is present in a single limb (either left/right arm or leg)." };
        }
        if (cleanText.includes("two limbs") || cleanText.includes("both arms") || cleanText.includes("both legs") || cleanText.includes("multiple") || cleanText.includes("both sides")) {
          return { score: 2, confidence: "high", rationale: "Ataxia is present in two or more limbs." };
        }
        break;

      case "8": // Sensory
        if (cleanText.includes("normal") || cleanText.includes("symmetric") || cleanText.includes("feels sharp") || cleanText.includes("fully intact")) {
          return { score: 0, confidence: "high", rationale: "Sensation to pinprick is symmetric and normal in all regions." };
        }
        if (cleanText.includes("dull") || cleanText.includes("mild") || cleanText.includes("moderate") || cleanText.includes("less sharp") || cleanText.includes("numbness")) {
          return { score: 1, confidence: "high", rationale: "Mild-to-moderate hemisensory loss; pinprick is felt but is described as duller." };
        }
        if (cleanText.includes("severe") || cleanText.includes("total") || cleanText.includes("no sensation") || cleanText.includes("does not feel") || cleanText.includes("comatose")) {
          return { score: 2, confidence: "high", rationale: "Severe or total sensory loss detected; patient did not feel pinprick at all." };
        }
        break;

      case "9": // Language
        if (cleanText.includes("normal") || cleanText.includes("fluent") || cleanText.includes("no aphasia") || cleanText.includes("fully understood") || cleanText.includes("perfectly")) {
          return { score: 0, confidence: "high", rationale: "Comprehension, naming, and description of the picture are completely normal." };
        }
        if (cleanText.includes("mild") || cleanText.includes("moderate") || cleanText.includes("paraphasia") || cleanText.includes("hesitant") || cleanText.includes("some difficulty")) {
          return { score: 1, confidence: "high", rationale: "Mild-to-moderate aphasia; communication is slow or has naming errors but is mostly clear." };
        }
        if (cleanText.includes("severe") || cleanText.includes("broken") || cleanText.includes("fragmented") || cleanText.includes("hard to comprehend") || cleanText.includes("cannot name")) {
          return { score: 2, confidence: "high", rationale: "Severe aphasia; communication is highly fragmented and the examiner cannot interpret intent." };
        }
        if (cleanText.includes("mute") || cleanText.includes("global") || cleanText.includes("unresponsive") || cleanText.includes("no speech")) {
          return { score: 3, confidence: "high", rationale: "Total global aphasia or muteness; patient produces no verbal response or understanding." };
        }
        break;

      case "10": // Dysarthria
        if (cleanText.includes("normal") || cleanText.includes("clear") || cleanText.includes("articulation") || cleanText.includes("perfect")) {
          return { score: 0, confidence: "high", rationale: "Speech articulation is completely clear and normal." };
        }
        if (cleanText.includes("mild") || cleanText.includes("moderate") || cleanText.includes("slur") || cleanText.includes("some slurring") || cleanText.includes("intelligible")) {
          return { score: 1, confidence: "high", rationale: "Mild-to-moderate dysarthria; patient slurs some words but can be understood." };
        }
        if (cleanText.includes("severe") || cleanText.includes("unintelligible") || cleanText.includes("cannot understand") || cleanText.includes("mute") || cleanText.includes("anarthric")) {
          return { score: 2, confidence: "high", rationale: "Severe dysarthria; speech is slurred to the point of being entirely unintelligible, or patient is anarthric." };
        }
        break;

      case "11": // Extinction
        if (cleanText.includes("normal") || cleanText.includes("no neglect") || cleanText.includes("no inattention") || cleanText.includes("symmetric") || cleanText.includes("feels both")) {
          return { score: 0, confidence: "high", rationale: "No inattention or extinction; patient perceives double simultaneous stimulation perfectly." };
        }
        if (cleanText.includes("partial") || cleanText.includes("sensory neglect") || cleanText.includes("visual neglect") || cleanText.includes("extinguishes") || cleanText.includes("inattention")) {
          return { score: 1, confidence: "high", rationale: "Partial inattention or extinction present in a single modality (e.g. visual or tactile)." };
        }
        if (cleanText.includes("complete") || cleanText.includes("profound") || cleanText.includes("hemi-inattention") || cleanText.includes("severe neglect")) {
          return { score: 2, confidence: "high", rationale: "Profound complete hemi-inattention / neglect in multiple sensory modalities." };
        }
        break;
    }

    // Default general fallback
    return {
      score: 1,
      confidence: "low",
      rationale: `Bedside note loaded: "${text}". Assigned a default score of 1 based on general observation, but details are too ambiguous to verify confidence.`
    };
  };

  // --- Real Live Gemini API Call ---
  const callLiveGeminiAPI = async (text: string, itemId: string) => {
    const activeItem = NIHSS_ITEMS.find(item => item.id === itemId) || currentItem;
    
    const promptText = `
Active NIH Stroke Scale (NIHSS) Exam Item:
ID: ${activeItem.id}
Name: ${activeItem.fullName}
Testing Instructions: ${activeItem.instructions}

Scoring Rubric Criteria:
${activeItem.options.map(o => `- Score ${o.score}: ${o.label} (${o.description})`).join('\n')}

Nurse's Bedside Text Observation:
"${text}"

Your Task:
You are an expert clinical parser. Analyze the nurse's text description and extract:
1. The exact 'score' that fits best (must be one of the scores defined in the criteria above, e.g. 0, 1, 2, 3, 4, or "UN").
2. Your 'confidence' ("high" or "low"). If there's an ambiguity in the nurse's report (such as missing timing, no mention of drift, or unclear patient compliance), set confidence to "low".
3. A clinical 'rationale' (1-2 sentences explaining why you chose this score based on their observation).

Return ONLY a strict JSON object with these exact keys:
{
  "score": 0, // (or appropriate integer/string)
  "confidence": "high", // ("high" or "low")
  "rationale": "The explanation here..."
}
`;

    // Fetch URL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: promptText,
              }
            ]
          }
        ],
        systemInstruction: {
          parts: [
            {
              text: "You are an expert clinical parser for the NIH Stroke Scale. The nurse will provide a free-text bedside observation for the current exam item. Analyze their text and return a strict JSON object containing: 'score' (the exact integer matching the standard scale criteria), 'confidence' (high/low), and a brief 'rationale' explaining why you picked that score."
            }
          ]
        },
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        }
      })
    });

    if (!res.ok) {
      throw new Error(`Gemini API Error: Status ${res.status}`);
    }

    const data = await res.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      throw new Error("Empty response from Gemini model.");
    }

    // Clean up markdown block wrapping if present
    let cleaned = resultText.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();

    return JSON.parse(cleaned);
  };

  // --- Send Message and Trigger AI Parsing ---
  const handleSendObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim()) return;

    const userInput = currentInput.trim();
    setCurrentInput("");

    // Add Nurse message
    const nurseMsg: Message = {
      id: `nurse-obs-${Date.now()}`,
      sender: "nurse",
      text: userInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, nurseMsg]);
    setIsAnalyzing(true);

    try {
      if (apiKey) {
        // LIVE AI CALL
        const result = await callLiveGeminiAPI(userInput, currentItem.id);
        
        const aiMsg: Message = {
          id: `ai-parse-${Date.now()}`,
          sender: "ai",
          text: `🤖 **AI Clinical Parsing Suggestion (${selectedModel}):**`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAiSuggestion: true,
          suggestedScore: result.score,
          confidence: result.confidence || "high",
          rationale: result.rationale || "Extracted based on clinical notes.",
          itemId: currentItem.id
        };
        
        setIsAnalyzing(false);
        setMessages(prev => [...prev, aiMsg]);
      } else {
        // SIMULATED OFFLINE MODE
        // Introduce a realistic clinical delay
        setTimeout(() => {
          const result = simulateClinicalParsing(userInput, currentItem.id);
          
          const aiMsg: Message = {
            id: `ai-parse-sim-${Date.now()}`,
            sender: "ai",
            text: `🤖 **AI Clinical Parsing Suggestion (Offline Simulation):**`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAiSuggestion: true,
            suggestedScore: result.score,
            confidence: result.confidence,
            rationale: result.rationale,
            itemId: currentItem.id
          };
          
          setIsAnalyzing(false);
          setMessages(prev => [...prev, aiMsg]);
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      setIsAnalyzing(false);

      // Gracefully fall back to simulated so they aren't blocked by network errors
      const simulatedResult = simulateClinicalParsing(userInput, currentItem.id);
      const errMsg: Message = {
        id: `ai-err-${Date.now()}`,
        sender: "system",
        text: `⚠️ **Live AI Parsing Failed:** ${err.message || "Network issue"}.\n\n*Switched automatically to Offline clinical parser simulation below:*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const aiMsg: Message = {
        id: `ai-parse-fallback-${Date.now()}`,
        sender: "ai",
        text: `🤖 **AI Suggested Score (Simulated Fallback):**`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAiSuggestion: true,
        suggestedScore: simulatedResult.score,
        confidence: simulatedResult.confidence,
        rationale: simulatedResult.rationale,
        itemId: currentItem.id
      };

      setMessages(prev => [...prev, errMsg, aiMsg]);
    }
  };

  // --- Calculate summary metrics ---
  const calculateTotalScore = (activeScores: Record<string, number | string>): number => {
    let total = 0;
    Object.entries(activeScores).forEach(([_, val]) => {
      if (val === "UN") {
        total += 0;
      } else if (typeof val === "number") {
        total += val;
      } else {
        const parsed = parseInt(String(val), 10);
        if (!isNaN(parsed)) {
          total += parsed;
        }
      }
    });
    return total;
  };

  const getSeverityCategory = (scoreVal: number): string => {
    if (scoreVal === 0) return "No Stroke Symptoms";
    if (scoreVal >= 1 && scoreVal <= 4) return "Minor Stroke";
    if (scoreVal >= 5 && scoreVal <= 15) return "Moderate Stroke";
    if (scoreVal >= 16 && scoreVal <= 20) return "Moderate-to-Severe Stroke";
    return "Severe Stroke";
  };

  const countCompletedItems = (): number => {
    return Object.keys(scores).length;
  };

  // --- Generate Standardized Clinical Documentation Note ---
  const generateClinicalNoteText = (): string => {
    const timestamp = new Date().toLocaleString();
    const total = calculateTotalScore(scores);
    const severity = getSeverityCategory(total);

    let note = `========================================================\n`;
    note += `   NIHSS ASSISTANT CLINICAL DOCUMENTATION REPORT\n`;
    note += `========================================================\n`;
    note += `Timestamp:       ${timestamp}\n`;
    note += `Prototype:       Decision Support & Bedside Log\n`;
    note += `Total Score:     ${total} / 42 (${severity})\n`;
    note += `--------------------------------------------------------\n\n`;
    note += `INDIVIDUAL ITEM BREKADOWN:\n`;

    NIHSS_ITEMS.forEach(item => {
      const scoreVal = scores[item.id];
      const hasScore = scoreVal !== undefined;
      const scoreLabel = hasScore 
        ? item.options.find(o => o.score === scoreVal)?.label || String(scoreVal)
        : "NOT ASSESSED";
      const scoreStr = hasScore ? `${scoreVal}` : "N/A";
      const obs = observations[item.id] || "No clinical observation logged.";

      note += `${item.shortName}:\n`;
      note += `  - Score:  ${scoreStr} (${scoreLabel})\n`;
      note += `  - Observation: ${obs}\n\n`;
    });

    note += `--------------------------------------------------------\n`;
    note += `⚠️ CLINICAL DISCLAIMER:\n`;
    note += `This report is a clinical decision support prototype output. It does NOT replace professional clinician judgment, formal NIHSS certification, or institutional protocol. Sourced assessments must be verified, signed, and authorized by a certified clinician before entering into the patient's permanent Electronic Health Record (EHR).\n`;
    note += `========================================================`;

    return note;
  };

  // --- Clipboard Copy ---
  const copyToClipboard = () => {
    const text = generateClinicalNoteText();
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopyToast(true);
        setTimeout(() => setCopyToast(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy note: ", err);
      });
  };

  return (
    <div id="nihss-app" className="min-h-screen bg-slate-100 flex flex-col items-center justify-center font-sans antialiased">
      
      {/* 
        Smartphone Mockup Frame 
        Adapts seamlessly: fills full viewport on mobile screen size, centered box on desktop 
      */}
      <div className="w-full max-w-md h-screen md:h-[840px] md:rounded-3xl md:shadow-2xl md:border-8 md:border-slate-800 bg-white flex flex-col overflow-hidden relative">
        
        {/* Mobile Header */}
        <header className="bg-slate-900 text-white px-4 py-3 flex flex-col shrink-0 border-b border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <FileText size={18} className="text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-base leading-tight tracking-wide">NIHSS Assistant</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Clinical Demo</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                id="btn-reset"
                onClick={resetAssessment}
                title="Reset Assessment"
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <RotateCcw size={18} />
              </button>
              <button 
                id="btn-settings"
                onClick={openSettings}
                title="Configure Gemini API"
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors relative"
              >
                <Settings size={18} />
                {!apiKey && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-slate-900"></span>
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Progress Tracker Header Bar */}
          <div className="mt-3 border-t border-slate-800 pt-2">
            <button 
              id="btn-progress-dropdown"
              onClick={() => setProgressDropdownOpen(!progressDropdownOpen)}
              className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white focus:outline-none py-1 px-2 rounded hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-indigo-400">
                  Progress: {countCompletedItems()}/15 Completed
                </span>
                <span className="text-slate-500">|</span>
                <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-white">
                  Score: {calculateTotalScore(scores)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400">View Protocol List</span>
                {progressDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {/* Collapsible Dropdown Content */}
            {progressDropdownOpen && (
              <div className="mt-2 bg-slate-950/80 rounded-lg p-2 max-h-60 overflow-y-auto border border-slate-800/80 transition-all">
                <p className="text-[10px] text-slate-400 font-medium mb-2 px-1">TAP ANY ITEM TO JUMP TO STEP:</p>
                <div className="grid grid-cols-1 gap-1">
                  {NIHSS_ITEMS.map((item, idx) => {
                    const isCompleted = scores[item.id] !== undefined;
                    const isActive = idx === currentStepIndex;
                    const scoreVal = scores[item.id];
                    
                    return (
                      <button
                        key={item.id}
                        id={`tracker-item-${item.id}`}
                        onClick={() => jumpToItem(idx)}
                        className={`flex items-center justify-between text-left p-1.5 rounded transition-all text-xs ${
                          isActive 
                            ? "bg-indigo-950/50 text-indigo-200 border-l-2 border-indigo-500 font-medium" 
                            : isCompleted
                              ? "bg-slate-900/60 text-slate-300 hover:bg-slate-800/60"
                              : "text-slate-500 hover:bg-slate-900/40"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isCompleted ? (
                            <Check className="text-emerald-500 shrink-0" size={13} />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full border border-slate-600 shrink-0 block"></span>
                          )}
                          <span className="truncate">{item.fullName}</span>
                        </div>
                        {isCompleted && (
                          <span className="bg-emerald-950/60 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                            {scoreVal}
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[10px] text-indigo-400 font-medium animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Clinical Disclaimer Banner - Standard and clear */}
        <div className="bg-amber-50 border-b border-amber-200 p-2.5 flex items-start gap-2 text-amber-900 shrink-0">
          <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-[10px] leading-relaxed text-amber-800">
            <strong>Clinical Safety Disclaimer:</strong> Prototype only. Does not replace clinician judgment, formal NIHSS certification, or institutional protocol. Do not make autonomous treatment decisions or mention thrombolysis/thrombectomy eligibility.
          </div>
        </div>

        {/* Scrollable Observation Feed / Clinical Log (Top/Middle Area) */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col space-y-3">
          
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Observation Feed / Clinical Log
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              ID: {currentItem.id} Thread
            </span>
          </div>

          {messages.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-xs font-medium">
              No observations logged for this exam yet.
            </div>
          )}

          <div className="flex flex-col space-y-3">
            {messages.map((msg) => {
              const isNurse = msg.sender === "nurse";
              const isAi = msg.sender === "ai";
              const isSystem = msg.sender === "system";

              if (isSystem) {
                const msgItem = msg.itemId ? NIHSS_ITEMS.find(i => i.id === msg.itemId) : null;
                const showCards = msgItem && msg.itemId === currentItem.id && scores[msg.itemId] === undefined;

                return (
                  <div key={msg.id} className="bg-slate-200/80 text-slate-800 p-3 rounded-xl border border-slate-200 text-xs leading-relaxed max-w-[92%] self-start flex flex-col gap-2.5">
                    <div className="whitespace-pre-line">{msg.text}</div>
                    
                    {showCards && (
                      <div className="border-t border-slate-300/60 pt-3 mt-1 text-slate-800 flex flex-col gap-2">
                        <div className="space-y-1.5 mt-1">
                          <p className="text-[9px] font-bold text-slate-500 tracking-wide uppercase px-1">
                            TACTILE SCORING CARDS (TAP TO CONFIRM):
                          </p>
                          
                          <div className="grid grid-cols-1 gap-1.5">
                            {msgItem.options.map((opt) => {
                              const isSelected = scores[msgItem.id] === opt.score;
                              return (
                                <button
                                  key={opt.score}
                                  id={`btn-score-${msgItem.id}-${opt.score}`}
                                  onClick={() => handleConfirmScore(opt.score)}
                                  className={`w-full text-left touch-target rounded-lg p-2.5 border flex items-start gap-2.5 transition-all ${
                                    isSelected 
                                      ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/10 text-indigo-900" 
                                      : "bg-white hover:bg-slate-50 active:bg-slate-100 border-slate-200 text-slate-700"
                                  }`}
                                >
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 border ${
                                    isSelected 
                                      ? "bg-indigo-600 border-indigo-600 text-white" 
                                      : "bg-slate-100 border-slate-200 text-slate-800"
                                  }`}>
                                    {opt.score}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-xs leading-none">{opt.label}</div>
                                    <div className="text-[10px] text-slate-500 leading-tight mt-1">{opt.description}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              if (isNurse) {
                return (
                  <div key={msg.id} className="flex flex-col items-end max-w-[85%] ml-auto">
                    <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-none text-xs leading-relaxed shadow-sm">
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 font-mono font-medium">
                      Clinician • {msg.timestamp}
                    </span>
                  </div>
                );
              }

              if (isAi && msg.isAiSuggestion) {
                const optMatch = currentItem.options.find(o => o.score === msg.suggestedScore);
                const isLowConfidence = msg.confidence === "low";

                return (
                  <div key={msg.id} className={`p-3.5 rounded-2xl border max-w-[92%] self-start flex flex-col gap-2.5 transition-all shadow-sm ${
                    isLowConfidence 
                      ? "bg-amber-50 border-amber-200 text-amber-950" 
                      : "bg-white border-slate-200 text-slate-800"
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isLowConfidence ? "bg-amber-500 text-white animate-bounce" : "bg-emerald-600 text-white"}`}>
                        <Cpu size={14} />
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-none">
                          {isLowConfidence ? "Clinical Ambiguity Detected" : "AI Suggested Assessment"}
                        </div>
                        <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                          Confidence: <span className={isLowConfidence ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>{msg.confidence?.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs">
                      {isLowConfidence ? (
                        <div className="p-2 bg-amber-100/60 border border-amber-200 rounded-lg text-amber-900 leading-relaxed font-medium mb-1.5">
                          ⚠️ <strong>Clarification required:</strong> The model parsed a score but detected notable ambiguity or missing details. Please select manually.
                        </div>
                      ) : null}
                      
                      <div className="leading-relaxed whitespace-pre-line">
                        Recommended Score for {currentItem.shortName}: <strong className="font-mono text-indigo-700 underline text-sm">{msg.suggestedScore} ({optMatch?.label || "Parsed"})</strong>
                      </div>

                      <div className="text-[11px] mt-1.5 italic bg-slate-50 p-2 rounded border border-slate-100 leading-normal text-slate-600 font-mono">
                        &ldquo;{msg.rationale}&rdquo;
                      </div>
                    </div>

                    {/* Interactive Accept / Clarify Buttons */}
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        id="btn-confirm-ai-score"
                        onClick={() => handleConfirmScore(msg.suggestedScore!, `AI suggested: ${msg.rationale}`)}
                        className={`text-xs px-3 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all ${
                          isLowConfidence
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        <Check size={14} />
                        Confirm Score {msg.suggestedScore}
                      </button>

                      <button
                        id="btn-override-score"
                        onClick={() => {
                          const customMsg: Message = {
                            id: `custom-clarify-${Date.now()}`,
                            sender: "system",
                            text: `📝 **Manual Correction requested:** Please select the correct value directly using the scoring cards below.`,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            itemId: currentItem.id
                          };
                          setMessages(prev => [...prev, customMsg]);
                        }}
                        className="text-xs bg-slate-200 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-300 active:scale-95 transition-all font-medium"
                      >
                        Select Different Score
                      </button>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>

          {/* Parsing loader message */}
          {isAnalyzing && (
            <div id="ai-loading-indicator" className="bg-white border border-slate-200 p-3 rounded-2xl max-w-[80%] self-start flex items-center gap-3 shadow-sm shrink-0">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-slate-500 font-mono">AI expert clinical parser is reading bedside text...</span>
            </div>
          )}

          {/* Complete Checklist Completion CTA if applicable */}
          {countCompletedItems() === 15 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col items-center text-center gap-2.5 shrink-0">
              <CheckCircle size={32} className="text-emerald-600" />
              <div>
                <h3 className="font-bold text-sm text-emerald-950">NIHSS Clinical Protocol Complete</h3>
                <p className="text-xs text-emerald-800 leading-normal mt-1">All 15 exam scale criteria have been scored and clinically assessed. Your total stroke severity metric is ready.</p>
              </div>
              <button
                id="btn-view-summary"
                onClick={() => setVerificationOpen(true)}
                className="bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg font-bold shadow hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <FileText size={14} />
                Generate Documentation & Clinical Note
              </button>
            </div>
          )}

          {/* Anchor for auto-scroll */}
          <div ref={chatEndRef} />
        </div>

        {/* 
          Fixed Bottom Input Panel 
          Maintains strict messaging aesthetic, keeping natural language entry docked at bottom.
        */}
        <div className="bg-white border-t border-slate-200 p-3 shrink-0">
          <form id="bedside-form" onSubmit={handleSendObservation} className="flex gap-2">
            <input
              type="text"
              id="txt-observation-input"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              disabled={isAnalyzing}
              placeholder={`Describe observation for ${currentItem.shortName}...`}
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400 disabled:opacity-60"
            />
            <button
              type="submit"
              id="btn-submit-observation"
              disabled={isAnalyzing || !currentInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl disabled:opacity-40 transition-all active:scale-95"
            >
              <Send size={16} />
            </button>
          </form>

          {/* Assistant Engine Status Indicator */}
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${apiKey ? "bg-emerald-500" : "bg-amber-400 animate-pulse"}`}></span>
              <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider">
                {apiKey ? `Live AI: ${selectedModel}` : "Demo Simulator Mode Active"}
              </span>
            </div>
            {!apiKey && (
              <button 
                onClick={openSettings} 
                className="text-[9px] text-indigo-500 hover:underline font-bold"
              >
                Configure Gemini API Key
              </button>
            )}
          </div>
        </div>

        {/* --- SETTINGS / API KEY MODAL --- */}
        {settingsOpen && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings size={16} className="text-indigo-400" />
                  <h3 className="font-display font-bold text-sm tracking-wide">Gemini API Configuration</h3>
                </div>
                <button 
                  onClick={() => setSettingsOpen(false)}
                  className="text-slate-400 hover:text-white font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="p-4 space-y-4">
                <div className="p-3 bg-indigo-50 rounded-lg text-xs leading-relaxed text-indigo-900 flex gap-2">
                  <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    This app processes free-text observations using <strong>Google Gemini</strong>. Paste your AI Studio API key below. It is saved 100% locally in your secure browser <code>localStorage</code>.
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wide">Gemini API Key:</label>
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
                  />
                  <div className="mt-1 flex justify-between">
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] text-indigo-600 hover:underline"
                    >
                      Get an API key from Google AI Studio →
                    </a>
                    {tempApiKey && (
                      <button
                        type="button"
                        onClick={() => setTempApiKey("")}
                        className="text-[10px] text-red-500 hover:underline font-medium"
                      >
                        Clear Key
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wide">Model Selection:</label>
                  <select
                    value={tempModel}
                    onChange={(e) => setTempModel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  >
                    <option value="gemini-3.5-flash">gemini-3.5-flash (Latest Speed)</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash (Standard legacy)</option>
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Next Gen)</option>
                  </select>
                </div>

                {saveToast && (
                  <div className="bg-emerald-50 text-emerald-800 text-center py-2 rounded text-xs font-bold font-mono">
                    {saveToast}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white font-bold text-xs py-2.5 rounded-lg shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    Save Configuration
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(false)}
                    className="bg-slate-100 text-slate-700 font-semibold text-xs py-2.5 px-4 rounded-lg hover:bg-slate-200 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- VERIFICATION MODAL / EXPORT CLINICAL NOTE --- */}
        {verificationOpen && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 flex flex-col h-[85%] animate-in fade-in zoom-in duration-200">
              
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-indigo-400" />
                  <h3 className="font-display font-bold text-sm tracking-wide">Verification & Documentation</h3>
                </div>
                <button 
                  onClick={() => setVerificationOpen(false)}
                  className="text-slate-400 hover:text-white font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Patient metrics info block */}
              <div className="bg-slate-50 p-3.5 border-b border-slate-200 shrink-0 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">AGGREGATED ASSESSMENT RESULT</div>
                  <div className="text-sm font-display font-bold text-slate-800">
                    NIHSS Score: <span className="text-indigo-600 underline text-base font-mono font-black">{calculateTotalScore(scores)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-[10px] font-bold font-mono uppercase">
                    {getSeverityCategory(calculateTotalScore(scores))}
                  </span>
                </div>
              </div>

              {/* Text Note Viewport */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-950 text-emerald-400 font-mono text-[10px] leading-relaxed select-all">
                <pre className="whitespace-pre-wrap">{generateClinicalNoteText()}</pre>
              </div>

              {/* Action Toolbar */}
              <div className="p-4 bg-white border-t border-slate-100 space-y-2 shrink-0">
                
                {copyToast && (
                  <div className="bg-emerald-50 text-emerald-800 text-center py-2 rounded text-xs font-bold flex items-center justify-center gap-1 font-mono">
                    <CheckCircle size={14} /> Note Copied to Clipboard!
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 bg-indigo-600 text-white font-bold text-xs py-3 rounded-lg shadow-sm hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Copy size={14} />
                    Copy Note to Clipboard
                  </button>

                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to reset the current exam? This clears all scored items and observations.")) {
                        resetAssessment();
                        setVerificationOpen(false);
                      }
                    }}
                    className="bg-red-50 hover:bg-red-100 text-red-600 text-xs py-3 px-3 rounded-lg border border-red-200 font-bold active:scale-95 transition-all"
                    title="Reset Exam"
                  >
                    Reset
                  </button>
                </div>

                <button
                  onClick={() => setVerificationOpen(false)}
                  className="w-full text-center py-2 text-[11px] text-slate-500 hover:text-slate-700 font-medium"
                >
                  Back to Chat Protocol
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
