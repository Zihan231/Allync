import type { DocumentType, VerificationLevel } from "@/lib/mock/types";

export const DOCUMENT_TYPE_TO_LEVEL: Record<DocumentType, VerificationLevel> = {
  national_id: 3,
  passport: 3,
  birth_certificate: 2,
  driver_license: 2,
  university_docs: 1,
  college_docs: 1,
};

export function getVerificationLevelForDocument(documentType: DocumentType): VerificationLevel {
  return DOCUMENT_TYPE_TO_LEVEL[documentType];
}
