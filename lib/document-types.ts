/**
 * documents.document_type has a check constraint from Step 2 restricting it
 * to this fixed set (confirmed by probing the constraint directly, since
 * Supabase's schema introspection doesn't expose check constraint bodies).
 */
export const DOCUMENT_TYPES = [
  { value: "vet_report", label: "Vet report" },
  { value: "medical_history", label: "Medical history" },
  { value: "prescription", label: "Prescription" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number]["value"];

export function documentTypeLabel(value: string) {
  return DOCUMENT_TYPES.find((type) => type.value === value)?.label || value;
}
