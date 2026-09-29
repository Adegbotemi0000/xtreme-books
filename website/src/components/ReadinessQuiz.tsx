"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Reveal } from "./Reveal";

const QUESTIONS = [
  {
    prompt: "When a customer asks for an invoice, how fast can your team produce one with correct VAT and a TIN on it?",
    options: [
      { label: "Immediately, from the system", score: 2 },
      { label: "Within a day, someone builds it manually", score: 1 },
      { label: "It takes a while to track down the details", score: 0 },
    ],
  },
  {
    prompt: "If NRS asked for your e-invoicing records today, what would you send them?",
    options: [
      { label: "An export, ready to go", score: 2 },
      { label: "I'd need a few days to pull it together", score: 1 },
      { label: "Honestly, I'm not sure", score: 0 },
    ],
  },
  {
    prompt: "How many places does a single sale get recorded before it's reflected in your books?",
    options: [
      { label: "One — it flows through automatically", score: 2 },
      { label: "Two or three, re-entered by hand", score: 1 },
      { label: "It depends who remembered to log it", score: 0 },
    ],
  },
];

const RESULTS = [
  { min: 0, max: 1, title: "There's real exposure here.", body: "Manual invoicing and scattered records make e-invoicing compliance a scramble, not a given. Worth fixing before it's forced on you." },
  { min: 2, max: 4, title: "You're partway there.", body: "Some of this is systematic, some still depends on someone remembering. A single source of truth closes that gap." },
  { min: 5, max: 6, title: "You're in good shape.", body: "Your records are already close to e-invoicing-ready — the main upside left is cutting out the manual re-entry." },
];

export function ReadinessQuiz() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  function answer(points: number) {
    const newScore = score + points;
    if (step + 1 < QUESTIONS.length) {
      setStep(step + 1);
      setScore(newScore);
    } else {
      setScore(newScore);
      setDone(true);
    }
  }

  function restart() {
    setStep(0);
    setScore(0);
    setDone(false);
  }

  const result = RESULTS.find((r) => score >= r.min && score <= r.max) ?? RESULTS[0];

  return (
    <section className="pb-28">
      <div className="mx-auto max-w-2xl px-6">
        <Reveal>
          <div className="glass-panel rounded-3xl p-8 sm:p-10">
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              60-second check
            </span>
            <h2 className="mt-3 font-display text-2xl text-foreground sm:text-3xl">
              How e-invoicing ready is your business, really?
            </h2>

            {!done ? (
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Question {step + 1} of {QUESTIONS.length}
                </p>
                <p className="mt-2 text-lg text-foreground">{QUESTIONS[step].prompt}</p>
                <div className="mt-6 flex flex-col gap-3">
                  {QUESTIONS[step].options.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => answer(opt.score)}
                      className="rounded-2xl border border-border bg-white px-5 py-3.5 text-left text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5 cursor-pointer"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-8">
                <p className="font-display text-xl text-foreground">{result.title}</p>
                <p className="mt-3 text-muted-foreground">{result.body}</p>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    See plans
                    <ArrowRight size={16} />
                  </Link>
                  <button
                    onClick={restart}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted cursor-pointer"
                  >
                    <RotateCcw size={16} />
                    Retake
                  </button>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
