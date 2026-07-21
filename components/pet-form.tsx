"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { PetFormValues } from "@/lib/pets";
import { emptyPet } from "@/lib/pets";
import { Button, Section, TextArea, TextField } from "@/components/ui";

const tabs = ["Basic", "Routine & Meals", "Medical", "Behavior & Habits", "Emergency", "Vaccinations"] as const;
type Tab = (typeof tabs)[number];
type Props = { initialValues?: PetFormValues; onSave: (values: PetFormValues) => Promise<void>; submitLabel: string };

const blankMeal = { time: "", food: "", portion: "", notes: "" };
const blankMedication = { name: "", dosage: "", type: "consistent" as const, schedule: "", scenario: "", notes: "" };
const blankHabit = { behavior: "", symptoms: "", steps: "" };
const blankVaccination = { vaccine_name: "", date_administered: null, expiry_date: null, vet_name: "", notes: "" };

type MergeMode = "fill" | "replace";

function mergeFill(current: PetFormValues, fill: Partial<PetFormValues>, mode: MergeMode = "fill"): PetFormValues {
  const use = (currentValue: string, proposed?: string) => mode === "replace" ? (proposed || currentValue || "") : (currentValue || proposed || "");
  const hasMeal = current.meals.some((meal) => Boolean(meal.time || meal.food || meal.portion || meal.notes));
  const hasMedication = current.medical.medication.some((medication) => Boolean(medication.name || medication.dosage || medication.schedule || medication.scenario || medication.notes));
  const hasHabit = current.behavior.habits.some((habit) => Boolean(habit.behavior || habit.symptoms || habit.steps));
  const hasVaccination = current.vaccinations.some((vaccination) => Boolean(vaccination.vaccine_name || vaccination.vet_name || vaccination.date_administered || vaccination.expiry_date || vaccination.notes));
  return {
    ...current,
    name: use(current.name, fill.name), nickname: use(current.nickname, fill.nickname), age: use(current.age, fill.age), breed: use(current.breed, fill.breed), blood_type: use(current.blood_type, fill.blood_type),
    routine: { walks: use(current.routine.walks, fill.routine?.walks), sleep: use(current.routine.sleep, fill.routine?.sleep) },
    meals: mode === "replace" ? (fill.meals?.length ? fill.meals : current.meals) : (hasMeal ? current.meals : fill.meals || current.meals),
    medical: { ...current.medical, conditions: use(current.medical.conditions, fill.medical?.conditions), allergies: use(current.medical.allergies, fill.medical?.allergies), vet_details: use(current.medical.vet_details, fill.medical?.vet_details), medication: mode === "replace" ? (fill.medical?.medication?.length ? fill.medical.medication : current.medical.medication) : (hasMedication ? current.medical.medication : fill.medical?.medication || current.medical.medication) },
    behavior: { ...current.behavior, likes: use(current.behavior.likes, fill.behavior?.likes), dislikes: use(current.behavior.dislikes, fill.behavior?.dislikes), triggers: use(current.behavior.triggers, fill.behavior?.triggers), commands: use(current.behavior.commands, fill.behavior?.commands), comfort_routines: use(current.behavior.comfort_routines, fill.behavior?.comfort_routines), habits: mode === "replace" ? (fill.behavior?.habits?.length ? fill.behavior.habits : current.behavior.habits) : (hasHabit ? current.behavior.habits : fill.behavior?.habits || current.behavior.habits) },
    emergency: { contacts: use(current.emergency.contacts, fill.emergency?.contacts), instructions: use(current.emergency.instructions, fill.emergency?.instructions) },
    vaccinations: mode === "replace" ? (fill.vaccinations?.length ? fill.vaccinations : current.vaccinations) : (hasVaccination ? current.vaccinations : fill.vaccinations || current.vaccinations),
  };
}

function suggestionSummary(fill: Partial<PetFormValues>) {
  const items = [
    fill.name && `Name: ${fill.name}`,
    fill.nickname && `Nickname: ${fill.nickname}`,
    fill.age && `Age: ${fill.age}`,
    fill.breed && `Breed: ${fill.breed}`,
    fill.blood_type && `Blood type: ${fill.blood_type}`,
    fill.routine?.walks && `Walks: ${fill.routine.walks}`,
    fill.routine?.sleep && `Sleep: ${fill.routine.sleep}`,
    ...(fill.meals || []).map((meal) => `Meal: ${[meal.time, meal.food, meal.portion, meal.notes].filter(Boolean).join(" — ")}`),
    fill.medical?.conditions && `Conditions: ${fill.medical.conditions}`,
    fill.medical?.allergies && `Allergies: ${fill.medical.allergies}`,
    ...(fill.medical?.medication || []).map((medication) => `Medication: ${[medication.name, medication.dosage, medication.schedule || medication.scenario, medication.notes].filter(Boolean).join(" — ")}`),
    fill.medical?.vet_details && `Vet: ${fill.medical.vet_details}`,
    fill.behavior?.likes && `Likes: ${fill.behavior.likes}`,
    fill.behavior?.dislikes && `Dislikes: ${fill.behavior.dislikes}`,
    fill.behavior?.triggers && `Triggers: ${fill.behavior.triggers}`,
    fill.behavior?.commands && `Commands: ${fill.behavior.commands}`,
    fill.behavior?.comfort_routines && `Comfort routine: ${fill.behavior.comfort_routines}`,
    ...(fill.behavior?.habits || []).map((habit) => `Habit: ${[habit.behavior, habit.symptoms, habit.steps].filter(Boolean).join(" — ")}`),
    fill.emergency?.contacts && `Emergency contacts: ${fill.emergency.contacts}`,
    fill.emergency?.instructions && `Emergency instructions: ${fill.emergency.instructions}`,
    ...(fill.vaccinations || []).map((vaccination) => `Vaccination: ${[vaccination.vaccine_name, vaccination.date_administered, vaccination.expiry_date && `expires ${vaccination.expiry_date}`, vaccination.vet_name].filter(Boolean).join(" — ")}`),
  ];
  return items.filter((item): item is string => Boolean(item));
}

export function PetForm({ initialValues, onSave, submitLabel }: Props) {
  const [tab, setTab] = useState<Tab>("Basic");
  const [error, setError] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [description, setDescription] = useState("");
  const [pendingFill, setPendingFill] = useState<{ extraction: Partial<PetFormValues>; transcript?: string } | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting, errors } } = useForm<PetFormValues>({ defaultValues: initialValues || emptyPet });
  const values = watch();
  const pendingSuggestions = pendingFill ? suggestionSummary(pendingFill.extraction) : [];
  useEffect(() => { if (initialValues) reset(initialValues); }, [initialValues, reset]);
  const set = (next: PetFormValues) => reset(next, { keepDefaultValues: true });
  const add = <T,>(list: T[], item: T, update: (items: T[]) => void) => update([...list, item]);

  async function extractCare({ file, audio, text }: { file?: File; audio?: File; text?: string }) {
    if (!file && !audio && !text?.trim()) return;
    setExtracting(true); setError("");
    try {
      const body = new FormData();
      body.append("scope", tab);
      if (file) body.append("file", file);
      if (audio) body.append("audio", audio);
      if (text?.trim()) body.append("text", text.trim());
      const response = await fetch("/api/extract", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPendingFill({ extraction: data.extraction, transcript: data.transcript });
      setDescription("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not understand that care note."); }
    finally { setExtracting(false); }
  }
  async function quickFill(file?: File) { if (file) await extractCare({ file }); }
  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setError("Voice recording is not available in this browser. You can type a note instead."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const pieces: BlobPart[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) pieces.push(event.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop()); setRecording(false);
        const type = recorder.mimeType || "audio/webm";
        void extractCare({ audio: new File([new Blob(pieces, { type })], "care-note.webm", { type }) });
      };
      recorderRef.current = recorder; recorder.start(); setRecording(true); setError("");
    } catch {
      setError("Microphone access was not granted. You can type a note instead.");
    }
  }
  function stopRecording() { recorderRef.current?.stop(); }
  async function submit(data: PetFormValues) { setError(""); try { await onSave(data); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save this profile."); } }

  return <form onSubmit={handleSubmit(submit)} className="pb-16"><Section title="Tell Carrie what matters" description={`Describe ${tab === "Basic" ? "your pet's care" : tab.toLowerCase()} in your own words. We will turn it into fields for you to review.`}><TextArea label="Type a care note" value={description} onChange={(event) => setDescription(event.target.value)} placeholder={tab === "Routine & Meals" ? "Breakfast is 2 scoops of kibble with a sprinkle of supplement…" : tab === "Medical" ? "Give NexGard on the 25th of every month…" : "Share anything your caregiver should know…"}/><div className="mt-3 flex flex-wrap gap-2"><Button type="button" disabled={extracting || !description.trim()} onClick={() => extractCare({ text: description })}>Turn note into details</Button>{recording ? <Button type="button" variant="danger" onClick={stopRecording}>■ Stop recording</Button> : <Button type="button" variant="secondary" disabled={extracting} onClick={startRecording}>● Record a voice note</Button>}</div><p className="mt-3 text-xs text-stone-500">Nothing is saved until you review and save the profile. Voice notes are transcribed temporarily and discarded.</p>{extracting && <p className="mt-3 text-sm font-medium text-teal-700">{recording ? "Listening…" : "Turning your note into care details…"}</p>}</Section>{pendingFill && <section className="mt-5 rounded-2xl border border-teal-200 bg-teal-50 p-5"><p className="text-sm font-semibold text-teal-900">Suggested profile updates</p>{pendingFill.transcript && <p className="mt-2 text-sm leading-6 text-teal-900">Voice transcript: <span className="italic">“{pendingFill.transcript}”</span></p>}{pendingSuggestions.length ? <ul className="mt-3 space-y-2 rounded-xl bg-white/70 p-4 text-sm leading-6 text-stone-800">{pendingSuggestions.map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">No structured details could be found in this note. Nothing will be added if you apply it.</p>}<p className="mt-3 text-sm leading-6 text-teal-900">Use <span className="font-semibold">Update matching fields</span> to replace the fields Carrie found. Use <span className="font-semibold">Only fill blank fields</span> to keep existing values unless a field is empty.</p><div className="mt-4 flex flex-wrap gap-2"><Button type="button" disabled={!pendingSuggestions.length} onClick={() => { set(mergeFill(values, pendingFill.extraction, "replace")); setPendingFill(null); }}>Update matching fields</Button><Button type="button" variant="secondary" disabled={!pendingSuggestions.length} onClick={() => { set(mergeFill(values, pendingFill.extraction, "fill")); setPendingFill(null); }}>Only fill blank fields</Button><Button type="button" variant="ghost" onClick={() => setPendingFill(null)}>Discard</Button></div></section>}<div className="mb-6 mt-5 overflow-x-auto"><div className="flex min-w-max gap-1 rounded-xl bg-stone-200/70 p-1">{tabs.map((item) => <button type="button" onClick={() => setTab(item)} key={item} className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${tab === item ? "bg-white text-teal-800 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}>{item}</button>)}</div></div>
    {tab === "Basic" && <div className="space-y-5"><Section title="Your pet" description="Use the fields below only to correct or add details."><div className="mb-6 flex items-center gap-4 rounded-xl bg-amber-50 p-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">🐾</div><p className="text-sm leading-6 text-stone-600">A profile photo can be added later. For now, every pet gets a friendly placeholder.</p></div><div className="grid gap-4 sm:grid-cols-2"><TextField label="Pet name" placeholder="e.g. Mochi" error={errors.name?.message} {...register("name", { required: "Pet name is required." })}/><TextField label="Nickname" placeholder="e.g. Moo" {...register("nickname")}/><TextField label="Age" placeholder="e.g. 4 years" {...register("age")}/><TextField label="Breed" placeholder="e.g. Shiba Inu" {...register("breed")}/><TextField label="Blood type" placeholder="If known" {...register("blood_type")}/></div></Section><Section title="Use a document instead" description="Upload a care note, vet report, or record. It is used once to suggest details, then discarded."><input aria-label="Upload a document to quick fill" type="file" accept=".pdf,.txt,.md,.csv,.doc,.docx,image/*" onChange={(event) => quickFill(event.target.files?.[0])} className="block w-full text-sm text-stone-600 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800 hover:file:bg-teal-100"/><p className="mt-3 text-xs text-stone-500">Up to 10 MB. Review every suggestion before applying it.</p></Section></div>}
    {tab === "Routine & Meals" && <div className="space-y-5"><Section title="Daily rhythm" description="A little structure makes handovers easier."><div className="grid gap-4 sm:grid-cols-2"><TextArea label="Walks & activity" placeholder="Morning walk around 7am…" {...register("routine.walks")}/><TextArea label="Sleep routine" placeholder="Sleeps in her crate…" {...register("routine.sleep")}/></div></Section><Section title="Meals" description="Add each regular meal separately."><div className="space-y-4">{values.meals.map((_, index) => <div className="rounded-xl border border-stone-200 p-4" key={index}><div className="mb-3 flex justify-between"><p className="font-semibold text-stone-800">Meal {index + 1}</p><Button type="button" variant="ghost" onClick={() => setValue("meals", values.meals.filter((_, i) => i !== index))}>Remove</Button></div><div className="grid gap-3 sm:grid-cols-2"><TextField label="Time" {...register(`meals.${index}.time`)}/><TextField label="Food" {...register(`meals.${index}.food`)}/><TextField label="Portion" {...register(`meals.${index}.portion`)}/><TextField label="Notes" {...register(`meals.${index}.notes`)}/></div></div>)}<Button type="button" variant="secondary" onClick={() => add(values.meals, blankMeal, (meals) => setValue("meals", meals))}>+ Add meal</Button></div></Section></div>}
    {tab === "Medical" && <div className="space-y-5"><Section title="Medical care" description="Leave anything blank if you are unsure. A caregiver will see only what you save."><div className="grid gap-4"><TextArea label="Conditions" placeholder="e.g. Sensitive stomach" {...register("medical.conditions")}/><TextArea label="Allergies" placeholder="e.g. Chicken" {...register("medical.allergies")}/><TextArea label="Vet details" placeholder="Clinic name, phone number, and any notes" {...register("medical.vet_details")}/></div></Section><Section title="Medication" description="Use the schedule or scenario to clarify when each medication is needed."><div className="space-y-4">{values.medical.medication.map((medication, index) => <div className="rounded-xl border border-stone-200 p-4" key={index}><div className="mb-3 flex justify-between"><p className="font-semibold text-stone-800">Medication {index + 1}</p><Button type="button" variant="ghost" onClick={() => setValue("medical.medication", values.medical.medication.filter((_, i) => i !== index))}>Remove</Button></div><div className="grid gap-3 sm:grid-cols-2"><TextField label="Name" {...register(`medical.medication.${index}.name`)}/><TextField label="Dosage" {...register(`medical.medication.${index}.dosage`)}/><label className="block"><span className="mb-1.5 block text-sm font-semibold text-stone-800">When needed</span><select className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm" {...register(`medical.medication.${index}.type`)}><option value="consistent">Regularly</option><option value="as_needed">As needed</option></select></label><TextField label="Schedule" {...register(`medical.medication.${index}.schedule`)}/><TextField label="Scenario" {...register(`medical.medication.${index}.scenario`)}/><TextField label="Notes" {...register(`medical.medication.${index}.notes`)}/></div></div>)}<Button type="button" variant="secondary" onClick={() => add(values.medical.medication, blankMedication, (medication) => setValue("medical.medication", medication))}>+ Add medication</Button></div></Section></div>}
    {tab === "Behavior & Habits" && <div className="space-y-5"><Section title="Personality & preferences"><div className="grid gap-4 sm:grid-cols-2"><TextArea label="Likes" {...register("behavior.likes")}/><TextArea label="Dislikes" {...register("behavior.dislikes")}/><TextArea label="Triggers" {...register("behavior.triggers")}/><TextArea label="Commands" {...register("behavior.commands")}/><TextArea className="sm:col-span-2" label="Comfort routines" {...register("behavior.comfort_routines")}/></div></Section><Section title="Habits" description="Capture a behavior, how it presents, and the best response."><div className="space-y-4">{values.behavior.habits.map((_, index) => <div className="rounded-xl border border-stone-200 p-4" key={index}><div className="mb-3 flex justify-between"><p className="font-semibold text-stone-800">Habit {index + 1}</p><Button type="button" variant="ghost" onClick={() => setValue("behavior.habits", values.behavior.habits.filter((_, i) => i !== index))}>Remove</Button></div><div className="grid gap-3"><TextField label="Behavior" {...register(`behavior.habits.${index}.behavior`)}/><TextArea label="Signs or symptoms" {...register(`behavior.habits.${index}.symptoms`)}/><TextArea label="What helps" {...register(`behavior.habits.${index}.steps`)}/></div></div>)}<Button type="button" variant="secondary" onClick={() => add(values.behavior.habits, blankHabit, (habits) => setValue("behavior.habits", habits))}>+ Add habit</Button></div></Section></div>}
    {tab === "Emergency" && <Section title="Emergency plan" description="Include only the contacts and instructions you want a temporary caregiver to have."><div className="grid gap-4"><TextArea label="Emergency contacts" placeholder="Name, relationship, phone number" {...register("emergency.contacts")}/><TextArea label="Instructions" placeholder="What to do, where to go, and when to call" {...register("emergency.instructions")}/></div></Section>}
    {tab === "Vaccinations" && <Section title="Vaccinations" description="Describe a record above or add details manually. A document can optionally help fill this tab."><div className="space-y-4">{values.vaccinations.map((_, index) => <div className="rounded-xl border border-stone-200 p-4" key={index}><div className="mb-3 flex justify-between"><p className="font-semibold text-stone-800">Vaccination {index + 1}</p><Button type="button" variant="ghost" onClick={() => setValue("vaccinations", values.vaccinations.filter((_, i) => i !== index))}>Remove</Button></div><div className="grid gap-3 sm:grid-cols-2"><TextField label="Vaccine name" {...register(`vaccinations.${index}.vaccine_name`)}/><TextField label="Vet name" {...register(`vaccinations.${index}.vet_name`)}/><TextField label="Date administered" type="date" {...register(`vaccinations.${index}.date_administered`)}/><TextField label="Expiry date" type="date" {...register(`vaccinations.${index}.expiry_date`)}/><TextArea className="sm:col-span-2" label="Notes" {...register(`vaccinations.${index}.notes`)}/><label className="sm:col-span-2 block"><span className="mb-1.5 block text-sm font-semibold text-stone-800">Vaccination document <span className="font-normal text-stone-500">(optional)</span></span><input type="file" accept=".pdf,.txt,.md,.csv,.doc,.docx,image/*" onChange={(event) => quickFill(event.target.files?.[0])} className="block w-full text-sm text-stone-600 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800 hover:file:bg-teal-100"/><span className="mt-1 block text-xs text-stone-500">Used only to suggest vaccination details, then discarded.</span></label></div></div>)}<Button type="button" variant="secondary" onClick={() => add(values.vaccinations, blankVaccination, (vaccinations) => setValue("vaccinations", vaccinations))}>+ Add vaccination</Button></div></Section>}
    {error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}<div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-5"><p className="text-sm text-stone-500">You can return and update this profile anytime.</p><Button disabled={isSubmitting} type="submit">{isSubmitting ? "Saving…" : submitLabel}</Button></div>
  </form>;
}
