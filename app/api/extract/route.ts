import { openai } from "@/lib/openai";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { sanitizeExtraction } from "@/lib/extraction";
import { toFile } from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const extractionInstructions = `You extract care-profile facts from a pet owner's natural-language care note or document.
Return only JSON matching the supplied schema. Include a field only when it is directly supported by the source. Use empty strings and empty arrays for unavailable information. Never create an empty object inside an array: if there is no meal, medication, habit, or vaccination, return an empty array. Example: "breakfast 2 scoops kibble and sprinkle some supplement" is one meals entry with time "breakfast", food "kibble", portion "2 scoops", and notes "sprinkle some supplement". Example: "add NexGard every 25th of the month" is one medication entry with name "NexGard" and schedule "every 25th of the month"; do not invent a dosage. Never guess, infer, or invent information—especially medical details, medication, emergency contacts, or safety instructions. Preserve dates and dosages exactly when present.`;

const extractionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    nickname: { type: "string" },
    age: { type: "string" },
    breed: { type: "string" },
    blood_type: { type: "string" },
    routine: {
      type: "object",
      additionalProperties: false,
      properties: { walks: { type: "string" }, sleep: { type: "string" } },
      required: ["walks", "sleep"],
    },
    meals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { time: { type: "string" }, food: { type: "string" }, portion: { type: "string" }, notes: { type: "string" } },
        required: ["time", "food", "portion", "notes"],
      },
    },
    medical: {
      type: "object",
      additionalProperties: false,
      properties: {
        conditions: { type: "string" }, allergies: { type: "string" }, vet_details: { type: "string" },
        medication: { type: "array", items: { type: "object", additionalProperties: false, properties: { name: { type: "string" }, dosage: { type: "string" }, type: { type: "string", enum: ["consistent", "as_needed"] }, schedule: { type: "string" }, scenario: { type: "string" }, notes: { type: "string" } }, required: ["name", "dosage", "type", "schedule", "scenario", "notes"] } },
      }, required: ["conditions", "allergies", "medication", "vet_details"],
    },
    behavior: {
      type: "object",
      additionalProperties: false,
      properties: {
        likes: { type: "string" }, dislikes: { type: "string" }, triggers: { type: "string" }, commands: { type: "string" }, comfort_routines: { type: "string" },
        habits: { type: "array", items: { type: "object", additionalProperties: false, properties: { behavior: { type: "string" }, symptoms: { type: "string" }, steps: { type: "string" } }, required: ["behavior", "symptoms", "steps"] } },
      }, required: ["likes", "dislikes", "triggers", "commands", "comfort_routines", "habits"],
    },
    emergency: { type: "object", additionalProperties: false, properties: { contacts: { type: "string" }, instructions: { type: "string" } }, required: ["contacts", "instructions"] },
    vaccinations: { type: "array", items: { type: "object", additionalProperties: false, properties: { vaccine_name: { type: "string" }, date_administered: { type: ["string", "null"] }, expiry_date: { type: ["string", "null"] }, vet_name: { type: "string" }, notes: { type: "string" } }, required: ["vaccine_name", "date_administered", "expiry_date", "vet_name", "notes"] } },
  },
  required: ["name", "nickname", "age", "breed", "blood_type", "routine", "meals", "medical", "behavior", "emergency", "vaccinations"],
};

export async function POST(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const uploaded = formData.get("file");
  const audio = formData.get("audio");
  const rawText = formData.get("text");
  const scope = typeof formData.get("scope") === "string" ? formData.get("scope") : "Full profile";
  const text = typeof rawText === "string" ? rawText.trim() : "";
  const document = uploaded instanceof File ? uploaded : undefined;
  const audioFile = audio instanceof File ? audio : undefined;

  if (!document && !audioFile && !text) {
    return NextResponse.json({ error: "Describe the care, record a note, or choose a document." }, { status: 400 });
  }
  if ((document || audioFile) && (document || audioFile)!.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Files must be 10 MB or smaller." }, { status: 400 });
  }

  let fileId: string | undefined;
  try {
    let transcript = text;
    if (audioFile) {
      const transcription = await openai.audio.transcriptions.create({
        file: await toFile(Buffer.from(await audioFile.arrayBuffer()), audioFile.name, { type: audioFile.type }),
        model: "gpt-4o-mini-transcribe",
        prompt: "This is a pet owner's care note. Expect pet names, food, meals, medication, vaccine names, dates, veterinarians, and emergency care details.",
      });
      transcript = transcription.text.trim();
    }
    if (document) {
      const file = await openai.files.create({
        file: await toFile(Buffer.from(await document.arrayBuffer()), document.name, { type: document.type }),
        purpose: "user_data",
      });
      fileId = file.id;
    }
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      instructions: `${extractionInstructions}\nThe owner is currently describing: ${scope}. Extract only facts relevant to that area when a scope is provided.`,
      input: transcript
        ? `Owner's care note:\n${transcript}`
        : [{ role: "user", content: [{ type: "input_file", file_id: fileId! }] }],
      text: {
        format: { type: "json_schema", name: "pet_profile_extraction", strict: true, schema: extractionSchema },
      },
    });
    const rawExtraction = JSON.parse(response.output_text);
    const extraction = sanitizeExtraction(rawExtraction);
    // Temporary diagnostics requested during MVP testing. Remove before production
    // if server logs should not include owner-provided care details.
    console.info("[api/extract] raw model output", rawExtraction);
    console.info("[api/extract] normalized output", extraction);
    return NextResponse.json({ extraction, transcript: audioFile ? transcript : undefined });
  } catch (cause) {
    console.error("Quick Fill extraction failed", cause);
    return NextResponse.json({ error: "We could not extract this file. Please complete the form manually." }, { status: 502 });
  } finally {
    if (fileId) await openai.files.delete(fileId).catch(() => undefined);
  }
}
