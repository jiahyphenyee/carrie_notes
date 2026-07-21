export type Meal = { time: string; food: string; portion: string; notes: string };
export type Medication = {
  name: string;
  dosage: string;
  type: "consistent" | "as_needed";
  schedule: string;
  scenario: string;
  notes: string;
};
export type Habit = { behavior: string; symptoms: string; steps: string };
export type Vaccination = {
  id?: string;
  vaccine_name: string;
  date_administered: string | null;
  expiry_date: string | null;
  vet_name: string;
  notes: string;
};

export type PetFormValues = {
  name: string;
  nickname: string;
  age: string;
  breed: string;
  gender: string;
  blood_type: string;
  routine: { walks: string; sleep: string };
  meals: Meal[];
  medical: {
    conditions: string;
    allergies: string;
    medication: Medication[];
    vet_details: string;
  };
  behavior: {
    likes: string;
    dislikes: string;
    triggers: string;
    commands: string;
    comfort_routines: string;
    habits: Habit[];
  };
  emergency: { contacts: string; instructions: string };
  vaccinations: Vaccination[];
};

export const emptyPet: PetFormValues = {
  name: "",
  nickname: "",
  age: "",
  breed: "",
  gender: "",
  blood_type: "",
  routine: { walks: "", sleep: "" },
  meals: [],
  medical: { conditions: "", allergies: "", medication: [], vet_details: "" },
  behavior: {
    likes: "",
    dislikes: "",
    triggers: "",
    commands: "",
    comfort_routines: "",
    habits: [],
  },
  emergency: { contacts: "", instructions: "" },
  vaccinations: [],
};

export type PetRecord = PetFormValues & {
  id: string;
  photo_url: string | null;
  created_at?: string;
  share_token?: string;
};

export function mapPetRecord(record: Record<string, unknown>): PetRecord {
  const detail = Array.isArray(record.care_details)
    ? (record.care_details[0] as Record<string, unknown> | undefined)
    : (record.care_details as Record<string, unknown> | undefined);
  const routine = (detail?.routine as PetFormValues["routine"]) || emptyPet.routine;
  const medical = (detail?.medical as PetFormValues["medical"]) || emptyPet.medical;
  const behavior = (detail?.behavior as PetFormValues["behavior"]) || emptyPet.behavior;
  const emergency = (detail?.emergency as PetFormValues["emergency"]) || emptyPet.emergency;

  return {
    ...emptyPet,
    id: record.id as string,
    name: (record.name as string) || "",
    nickname: (record.nickname as string) || "",
    age: (record.age as string) || "",
    breed: (record.breed as string) || "",
    gender: (record.gender as string) || "",
    blood_type: (record.blood_type as string) || "",
    photo_url: (record.photo_url as string | null) || null,
    created_at: record.created_at as string | undefined,
    share_token: record.share_token as string | undefined,
    routine: { ...emptyPet.routine, ...routine },
    meals: Array.isArray(detail?.meals) ? (detail.meals as Meal[]) : [],
    medical: { ...emptyPet.medical, ...medical, medication: medical.medication || [] },
    behavior: { ...emptyPet.behavior, ...behavior, habits: behavior.habits || [] },
    emergency: { ...emptyPet.emergency, ...emergency },
    vaccinations: Array.isArray(record.vaccinations)
      ? (record.vaccinations as Vaccination[])
      : [],
  };
}
