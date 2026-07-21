import type { Habit, Meal, Medication, PetFormValues, Vaccination } from "@/lib/pets";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function records(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

/**
 * Removes schema-required blank placeholders before they reach the form.
 * Structured Outputs must return every required property, but an absent item
 * must never become an empty meal, medication, habit, or vaccination row.
 */
export function sanitizeExtraction(value: unknown): Partial<PetFormValues> {
  const source = isRecord(value) ? value : {};
  const routine = isRecord(source.routine) ? source.routine : {};
  const medical = isRecord(source.medical) ? source.medical : {};
  const behavior = isRecord(source.behavior) ? source.behavior : {};
  const emergency = isRecord(source.emergency) ? source.emergency : {};

  const meals: Meal[] = records(source.meals)
    .map((meal) => ({ time: text(meal.time), food: text(meal.food), portion: text(meal.portion), notes: text(meal.notes) }))
    .filter((meal) => Boolean(meal.time || meal.food || meal.portion || meal.notes));
  const medication: Medication[] = records(medical.medication)
    .map((item): Medication => ({
      name: text(item.name), dosage: text(item.dosage),
      type: item.type === "as_needed" ? "as_needed" : "consistent",
      schedule: text(item.schedule), scenario: text(item.scenario), notes: text(item.notes),
    }))
    .filter((item) => Boolean(item.name || item.dosage || item.schedule || item.scenario || item.notes));
  const habits: Habit[] = records(behavior.habits)
    .map((habit) => ({ behavior: text(habit.behavior), symptoms: text(habit.symptoms), steps: text(habit.steps) }))
    .filter((habit) => Boolean(habit.behavior || habit.symptoms || habit.steps));
  const vaccinations: Vaccination[] = records(source.vaccinations)
    .map((vaccination) => ({
      vaccine_name: text(vaccination.vaccine_name),
      date_administered: text(vaccination.date_administered) || null,
      expiry_date: text(vaccination.expiry_date) || null,
      vet_name: text(vaccination.vet_name), notes: text(vaccination.notes),
    }))
    .filter((vaccination) => Boolean(vaccination.vaccine_name || vaccination.date_administered || vaccination.expiry_date || vaccination.vet_name || vaccination.notes));

  return {
    name: text(source.name), nickname: text(source.nickname), age: text(source.age), breed: text(source.breed), blood_type: text(source.blood_type),
    routine: { walks: text(routine.walks), sleep: text(routine.sleep) }, meals,
    medical: { conditions: text(medical.conditions), allergies: text(medical.allergies), medication, vet_details: text(medical.vet_details) },
    behavior: { likes: text(behavior.likes), dislikes: text(behavior.dislikes), triggers: text(behavior.triggers), commands: text(behavior.commands), comfort_routines: text(behavior.comfort_routines), habits },
    emergency: { contacts: text(emergency.contacts), instructions: text(emergency.instructions) }, vaccinations,
  };
}
