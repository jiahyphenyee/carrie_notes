import { z } from "zod";

const text = z.string().max(4000).optional().default("");

export const petFormSchema = z.object({
  name: z.string().trim().min(1, "Pet name is required.").max(120),
  nickname: text,
  age: text,
  breed: text,
  blood_type: text,
  routine: z.object({ walks: text, sleep: text }).default({ walks: "", sleep: "" }),
  meals: z.array(z.object({ time: text, food: text, portion: text, notes: text })).default([]),
  medical: z
    .object({
      conditions: text,
      allergies: text,
      medication: z
        .array(
          z.object({
            name: text,
            dosage: text,
            type: z.enum(["consistent", "as_needed"]).default("consistent"),
            schedule: text,
            scenario: text,
            notes: text,
          }),
        )
        .default([]),
      vet_details: text,
    })
    .default({ conditions: "", allergies: "", medication: [], vet_details: "" }),
  behavior: z
    .object({
      likes: text,
      dislikes: text,
      triggers: text,
      commands: text,
      comfort_routines: text,
      habits: z.array(z.object({ behavior: text, symptoms: text, steps: text })).default([]),
    })
    .default({ likes: "", dislikes: "", triggers: "", commands: "", comfort_routines: "", habits: [] }),
  emergency: z.object({ contacts: text, instructions: text }).default({ contacts: "", instructions: "" }),
  vaccinations: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        vaccine_name: z.string().trim().min(1, "Vaccine name is required.").max(200),
        date_administered: z.string().nullable().optional(),
        expiry_date: z.string().nullable().optional(),
        vet_name: text,
        notes: text,
      }),
    )
    .default([]),
});
