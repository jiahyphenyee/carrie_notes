"use client";

import type { PetRecord } from "@/lib/pets";
import { Section } from "@/components/ui";

type Props = { pet: PetRecord };

function rows(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value && value.trim()));
}

function sectionText(items: Array<string | null | undefined>) {
  const lines = rows(items);
  return lines.length ? lines.join("\n") : "";
}

export function PetProfileView({ pet }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Section title="Basic information">
        <div className="grid gap-3 text-sm text-stone-700 sm:grid-cols-2">
          {[
            ["Name", pet.name],
            ["Nickname", pet.nickname],
            ["Age", pet.age],
            ["Breed", pet.breed],
            ["Gender", pet.gender],
            ["Blood type", pet.blood_type],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-stone-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{label}</p>
              <p className="mt-1 font-medium text-stone-900">{value || "Not added yet"}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Routine">
        <p className="whitespace-pre-line text-sm leading-6 text-stone-700">
          {sectionText([pet.routine.walks, pet.routine.sleep]) || "No routine notes added yet."}
        </p>
      </Section>

      <Section title="Meals">
        {pet.meals.length ? (
          <div className="space-y-3">
            {pet.meals.map((meal, index) => (
              <div key={`${meal.time}-${index}`} className="rounded-xl bg-stone-50 p-3 text-sm leading-6 text-stone-700">
                <p className="font-semibold text-stone-900">{meal.time || `Meal ${index + 1}`}</p>
                <p>{[meal.food, meal.portion].filter(Boolean).join(" • ") || "No food details added yet."}</p>
                {meal.notes && <p className="mt-1 text-stone-600">{meal.notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-stone-500">No meal details added yet.</p>
        )}
      </Section>

      <Section title="Medical">
        <div className="space-y-3 text-sm leading-6 text-stone-700">
          {[
            pet.medical.conditions && `Conditions: ${pet.medical.conditions}`,
            pet.medical.allergies && `Allergies: ${pet.medical.allergies}`,
            pet.medical.vet_details && `Vet: ${pet.medical.vet_details}`,
          ].filter(Boolean).map((line) => (
            <p key={line as string} className="whitespace-pre-line">
              {line}
            </p>
          ))}
          {!pet.medical.conditions && !pet.medical.allergies && !pet.medical.vet_details && (
            <p className="text-stone-500">No medical notes added yet.</p>
          )}
          {pet.medical.medication.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Medication</p>
              {pet.medical.medication.map((medication, index) => (
                <div key={`${medication.name}-${index}`} className="rounded-xl bg-stone-50 p-3">
                  <p className="font-medium text-stone-900">{medication.name || `Medication ${index + 1}`}</p>
                  <p className="text-stone-600">
                    {[medication.dosage, medication.schedule || medication.scenario, medication.notes].filter(Boolean).join(" • ") || "No extra medication details added yet."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section title="Behavior">
        <div className="space-y-3 text-sm leading-6 text-stone-700">
          {[
            pet.behavior.likes && `Likes: ${pet.behavior.likes}`,
            pet.behavior.dislikes && `Dislikes: ${pet.behavior.dislikes}`,
            pet.behavior.triggers && `Triggers: ${pet.behavior.triggers}`,
            pet.behavior.commands && `Commands: ${pet.behavior.commands}`,
            pet.behavior.comfort_routines && `Comfort: ${pet.behavior.comfort_routines}`,
          ].filter(Boolean).map((line) => (
            <p key={line as string} className="whitespace-pre-line">
              {line}
            </p>
          ))}
          {!pet.behavior.likes && !pet.behavior.dislikes && !pet.behavior.triggers && !pet.behavior.commands && !pet.behavior.comfort_routines && (
            <p className="text-stone-500">No behavior notes added yet.</p>
          )}
          {pet.behavior.habits.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Habits</p>
              {pet.behavior.habits.map((habit, index) => (
                <div key={`${habit.behavior}-${index}`} className="rounded-xl bg-stone-50 p-3">
                  <p className="font-medium text-stone-900">{habit.behavior || `Habit ${index + 1}`}</p>
                  <p className="text-stone-600">
                    {[habit.symptoms, habit.steps].filter(Boolean).join(" • ") || "No extra habit details added yet."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section title="Emergency">
        <p className="whitespace-pre-line text-sm leading-6 text-stone-700">
          {sectionText([pet.emergency.contacts, pet.emergency.instructions]) || "No emergency notes added yet."}
        </p>
      </Section>

      <Section title="Vaccinations">
        {pet.vaccinations.length ? (
          <div className="space-y-3">
            {pet.vaccinations.map((vaccination, index) => (
              <div key={vaccination.id || `${vaccination.vaccine_name}-${index}`} className="rounded-xl bg-stone-50 p-3 text-sm leading-6 text-stone-700">
                <p className="font-medium text-stone-900">{vaccination.vaccine_name || `Vaccination ${index + 1}`}</p>
                <p>{[vaccination.date_administered, vaccination.expiry_date && `Expires ${vaccination.expiry_date}`, vaccination.vet_name].filter(Boolean).join(" • ") || "No vaccination dates added yet."}</p>
                {vaccination.notes && <p className="mt-1 text-stone-600">{vaccination.notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-stone-500">No vaccinations added yet.</p>
        )}
      </Section>
    </div>
  );
}
