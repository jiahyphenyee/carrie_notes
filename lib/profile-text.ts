import type { PetFormValues } from "@/lib/pets";

export type ProfileSection = { label: string; content: string };

function lines(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value && value.trim())).join("\n");
}

/**
 * Formats each non-empty care section into readable prose for embedding, so
 * later citations can point to "Medical" or "Emergency" instead of an
 * opaque chunk id. Mirrors the field access patterns in
 * components/pet-profile-view.tsx, but produces plain text instead of JSX.
 */
export function buildProfileSections(pet: PetFormValues): ProfileSection[] {
  const sections: ProfileSection[] = [];

  const routine = lines([
    pet.routine.walks && `Walks & activity: ${pet.routine.walks}`,
    pet.routine.sleep && `Sleep routine: ${pet.routine.sleep}`,
  ]);
  if (routine) sections.push({ label: "Routine", content: routine });

  if (pet.meals.length) {
    const content = pet.meals
      .map((meal, index) => `Meal ${index + 1} (${meal.time || "time not set"}): ${[meal.food, meal.portion, meal.notes].filter(Boolean).join(", ")}`)
      .join("\n");
    sections.push({ label: "Meals", content });
  }

  const medical = lines([
    pet.medical.conditions && `Conditions: ${pet.medical.conditions}`,
    pet.medical.allergies && `Allergies: ${pet.medical.allergies}`,
    pet.medical.vet_details && `Vet: ${pet.medical.vet_details}`,
    ...pet.medical.medication.map((medication) => `Medication: ${medication.name} — ${[medication.dosage, medication.schedule || medication.scenario, medication.notes].filter(Boolean).join(", ")}`),
  ]);
  if (medical) sections.push({ label: "Medical", content: medical });

  const behavior = lines([
    pet.behavior.likes && `Likes: ${pet.behavior.likes}`,
    pet.behavior.dislikes && `Dislikes: ${pet.behavior.dislikes}`,
    pet.behavior.triggers && `Triggers: ${pet.behavior.triggers}`,
    pet.behavior.commands && `Commands: ${pet.behavior.commands}`,
    pet.behavior.comfort_routines && `Comfort routines: ${pet.behavior.comfort_routines}`,
    ...pet.behavior.habits.map((habit) => `Habit: ${habit.behavior} — ${[habit.symptoms, habit.steps].filter(Boolean).join(", ")}`),
  ]);
  if (behavior) sections.push({ label: "Behavior", content: behavior });

  const emergency = lines([
    pet.emergency.contacts && `Contacts: ${pet.emergency.contacts}`,
    pet.emergency.instructions && `Instructions: ${pet.emergency.instructions}`,
  ]);
  if (emergency) sections.push({ label: "Emergency", content: emergency });

  if (pet.vaccinations.length) {
    const content = pet.vaccinations
      .map((vaccination) => `${vaccination.vaccine_name || "Vaccination"}: administered ${vaccination.date_administered || "unknown date"}, expires ${vaccination.expiry_date || "unknown"}, by ${vaccination.vet_name || "unknown vet"}${vaccination.notes ? ` — ${vaccination.notes}` : ""}`)
      .join("\n");
    sections.push({ label: "Vaccinations", content });
  }

  return sections;
}
