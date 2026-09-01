"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { addPerson, getPerson, updatePersonProfile } from "@/lib/mock/communityStore";
import { ImageUploadControl } from "@/components/common/ImageUploadControl";
import { FileUploadControl } from "@/components/common/FileUploadControl";
import { LocationPicker } from "@/components/common/LocationPicker";
import { FormFieldWrapper, fieldInputClass } from "./FormFieldWrapper";
import { RepeatableEntryList } from "./RepeatableEntryList";
import { COUNTRIES } from "@/lib/countries";
import { BD_DIVISIONS, BD_DISTRICTS_BY_DIVISION, type BdDivision } from "@/lib/bangladeshLocations";
import {
  isValidPasswordLength,
  isValidKonamiUid,
  isFacebookUrl,
  isInstagramUrl,
  isValidPhone,
} from "@/lib/validation";
import { getVerificationLevelForDocument } from "@/lib/verification";
import type {
  BloodGroup,
  DocumentType,
  EducationEntry,
  LatLng,
  Person,
  WorkExperienceEntry,
} from "@/lib/mock/types";
import type { MockUser } from "@/lib/session/SessionContext";
import { CloseIcon } from "@/components/icons";

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const INSTITUTE_TYPES: EducationEntry["instituteType"][] = ["University", "College", "School", "Other"];
const DOCUMENT_TYPES: DocumentType[] = [
  "national_id",
  "passport",
  "birth_certificate",
  "driver_license",
  "university_docs",
  "college_docs",
];

const INSTITUTE_TYPE_LABEL_KEY = {
  University: "instituteTypeUniversity",
  College: "instituteTypeCollege",
  School: "instituteTypeSchool",
  Other: "instituteTypeOther",
} as const;

const DOCUMENT_TYPE_LABEL_KEY: Record<DocumentType, string> = {
  national_id: "docTypeNationalId",
  passport: "docTypePassport",
  birth_certificate: "docTypeBirthCertificate",
  driver_license: "docTypeDriverLicense",
  university_docs: "docTypeUniversityDocs",
  college_docs: "docTypeCollegeDocs",
};

type FormState = {
  dpUrl: string | null;
  coverUrl: string | null;
  email: string;
  password: string;
  facebookProfileName: string;
  facebookUrl: string;
  instagramUrl: string;
  konamiUid: string;
  deviceName: string;
  deviceModel: string;
  phoneNumber: string;
  birthday: string;
  bloodGroup: BloodGroup | "";
  country: string;
  division: string;
  district: string;
  permanentAddress: string;
  currentLocation: LatLng | null;
  workExperience: WorkExperienceEntry[];
  education: EducationEntry[];
  documentType: DocumentType | "";
  documentDataUrl: string | null;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function buildForm(person: Person | undefined, user: MockUser): FormState {
  return {
    dpUrl: person?.dpUrl ?? null,
    coverUrl: person?.coverUrl ?? null,
    email: user.email,
    password: "",
    facebookProfileName: person?.facebookProfileName ?? "",
    facebookUrl: person?.facebookUrl ?? "",
    instagramUrl: person?.instagramUrl ?? "",
    konamiUid: person?.konamiUid ?? "",
    deviceName: person?.deviceName ?? "",
    deviceModel: person?.deviceModel ?? "",
    phoneNumber: person?.phoneNumber ?? "",
    birthday: person?.birthday ?? "",
    bloodGroup: person?.bloodGroup ?? "",
    country: person?.country ?? "",
    division: person?.division ?? "",
    district: person?.district ?? "",
    permanentAddress: person?.permanentAddress ?? "",
    currentLocation: person?.currentLocation ?? null,
    workExperience: person?.workExperience ?? [],
    education: person?.education ?? [],
    documentType: person?.documentType ?? "",
    documentDataUrl: person?.documentDataUrl ?? null,
  };
}

// Shows either the editable control or a read-only value in the same slot,
// so the layout stays identical between view and edit mode.
function FieldSlot({
  editing,
  label,
  required,
  hint,
  error,
  displayValue,
  multiline,
  children,
}: {
  editing: boolean;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  displayValue: string;
  multiline?: boolean;
  children: ReactNode;
}) {
  if (editing) {
    return (
      <FormFieldWrapper label={label} required={required} hint={hint} error={error}>
        {children}
      </FormFieldWrapper>
    );
  }
  return (
    <div>
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <p
        className={`mt-1.5 rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink ${
          multiline ? "whitespace-pre-wrap" : "truncate"
        }`}
      >
        {displayValue}
      </p>
    </div>
  );
}

function PhotoField({
  editing,
  label,
  value,
  onChange,
  notProvided,
}: {
  editing: boolean;
  label: string;
  value: string | null;
  onChange: (v: string) => void;
  notProvided: string;
}) {
  if (editing) {
    return <ImageUploadControl label={label} value={value} onChange={onChange} />;
  }
  return (
    <div>
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <div className="mt-1.5">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-16 w-16 rounded-lg object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-surface-line-strong text-xs text-ink-faint">
            {notProvided}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProfileEditForm() {
  const { t } = useLanguage();
  const pf = t.dashboard.profileForm;
  const dash = pf.notProvided;
  const { user, setDpUrl, updateProfile, setVerificationStatus, setVerificationLevel } = useSession();
  const person = getPerson(user.personId);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => buildForm(person, user));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEditing() {
    setSubmitted(false);
    setEditing(true);
  }

  function cancelEditing() {
    setForm(buildForm(getPerson(user.personId), user));
    setErrors({});
    setEditing(false);
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!form.email.trim()) next.email = "Required.";
    if (form.password && !isValidPasswordLength(form.password)) next.password = pf.accountInfo.passwordError;
    if (!form.facebookUrl.trim() || !isFacebookUrl(form.facebookUrl)) next.facebookUrl = pf.socialIds.facebookLinkError;
    if (form.instagramUrl && !isInstagramUrl(form.instagramUrl)) next.instagramUrl = pf.socialIds.instagramError;
    if (form.konamiUid && !isValidKonamiUid(form.konamiUid)) next.konamiUid = pf.socialIds.konamiUidError;
    if (!isValidPhone(form.phoneNumber)) next.phoneNumber = pf.contactPersonal.phoneError;
    if (!form.birthday) next.birthday = "Required.";
    if (!form.country) next.country = "Required.";
    if (!form.permanentAddress.trim()) next.permanentAddress = "Required.";
    return next;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setSubmitted(false);
    if (Object.keys(nextErrors).length > 0) return;

    const patch = {
      dpUrl: form.dpUrl,
      coverUrl: form.coverUrl,
      facebookProfileName: form.facebookProfileName || undefined,
      facebookUrl: form.facebookUrl,
      instagramUrl: form.instagramUrl || undefined,
      konamiUid: form.konamiUid || undefined,
      deviceName: form.deviceName || undefined,
      deviceModel: form.deviceModel || undefined,
      phoneNumber: form.phoneNumber,
      birthday: form.birthday,
      bloodGroup: form.bloodGroup || undefined,
      country: form.country,
      division: form.division || undefined,
      district: form.district || undefined,
      permanentAddress: form.permanentAddress,
      currentLocation: form.currentLocation,
      workExperience: form.workExperience,
      education: form.education,
      documentType: form.documentType || undefined,
      documentDataUrl: form.documentDataUrl ?? undefined,
      verificationLevel: form.documentType ? getVerificationLevelForDocument(form.documentType) : person?.verificationLevel,
    };

    // The in-memory Person store resets on a full page reload, so a
    // signed-up demo user's record can go missing even though their
    // session (localStorage) survives — recreate it instead of silently
    // dropping the edit.
    if (getPerson(user.personId)) {
      updatePersonProfile(user.personId, patch);
    } else {
      addPerson({
        id: user.personId,
        name: user.name,
        clubId: user.club?.id ?? null,
        clubRole: user.club?.role ?? null,
        communityId: user.community?.id ?? null,
        communityRole: user.community?.role ?? null,
        points: 0,
        ...patch,
      });
    }
    setDpUrl(form.dpUrl);
    updateProfile({ email: form.email });
    setVerificationStatus("pending");
    if (form.documentType) {
      setVerificationLevel(getVerificationLevelForDocument(form.documentType));
    }
    setSubmitted(true);
    setEditing(false);
  }

  const documentTypeLabel = form.documentType
    ? (pf.documentVerification[
        DOCUMENT_TYPE_LABEL_KEY[form.documentType] as keyof typeof pf.documentVerification
      ] as string)
    : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-xl font-bold text-ink">{pf.title}</h2>
          {editing ? (
            <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent-ink">
              {pf.editingBadge}
            </span>
          ) : null}
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={startEditing}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-bg transition-transform hover:-translate-y-0.5"
          >
            {pf.editCta}
          </button>
        ) : (
          <button
            type="button"
            onClick={cancelEditing}
            aria-label={pf.closeEditCta}
            title={pf.closeEditCta}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-surface-line-strong text-ink-soft transition-colors hover:text-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {submitted ? <p className="text-sm text-success-ink">{pf.submitSuccessNote}</p> : null}

      {/* Account Info */}
      <div className="rounded-2xl border border-surface-line bg-surface/60 p-6">
        <h3 className="font-display text-xl font-bold text-ink">{pf.accountInfo.title}</h3>
        <div className="mt-5 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <PhotoField
              editing={editing}
              label={t.dashboard.onboarding.photoLabel}
              value={form.dpUrl}
              onChange={(v) => set("dpUrl", v)}
              notProvided={dash}
            />
            <PhotoField
              editing={editing}
              label={pf.accountInfo.coverPhotoLabel}
              value={form.coverUrl}
              onChange={(v) => set("coverUrl", v)}
              notProvided={dash}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FieldSlot label={pf.accountInfo.emailLabel} required error={errors.email} editing={editing} displayValue={form.email || dash}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={fieldInputClass}
              />
            </FieldSlot>

            <FieldSlot
              label={pf.accountInfo.passwordLabel}
              hint={pf.accountInfo.passwordHint}
              error={errors.password}
              editing={editing}
              displayValue={form.password ? "••••••••" : dash}
            >
              <input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className={fieldInputClass}
              />
            </FieldSlot>
          </div>

          <FieldSlot
            label={pf.accountInfo.facebookNameLabel}
            hint={pf.accountInfo.facebookNameHint}
            editing={editing}
            displayValue={form.facebookProfileName || dash}
          >
            <input
              value={form.facebookProfileName}
              onChange={(e) => set("facebookProfileName", e.target.value)}
              className={fieldInputClass}
            />
          </FieldSlot>
        </div>
      </div>

      {/* Social & IDs */}
      <div className="rounded-2xl border border-surface-line bg-surface/60 p-6">
        <h3 className="font-display text-xl font-bold text-ink">{pf.socialIds.title}</h3>
        <div className="mt-5 space-y-5">
          <FieldSlot
            label={pf.socialIds.facebookLinkLabel}
            required
            hint={pf.socialIds.facebookLinkHint}
            error={errors.facebookUrl}
            editing={editing}
            displayValue={form.facebookUrl || dash}
          >
            <input
              value={form.facebookUrl}
              onChange={(e) => set("facebookUrl", e.target.value)}
              placeholder={pf.socialIds.facebookLinkPlaceholder}
              className={fieldInputClass}
            />
          </FieldSlot>

          <div className="grid gap-5 sm:grid-cols-2">
            <FieldSlot
              label={pf.socialIds.instagramLabel}
              error={errors.instagramUrl}
              editing={editing}
              displayValue={form.instagramUrl || dash}
            >
              <input
                value={form.instagramUrl}
                onChange={(e) => set("instagramUrl", e.target.value)}
                placeholder={pf.socialIds.instagramPlaceholder}
                className={fieldInputClass}
              />
            </FieldSlot>

            <FieldSlot
              label={pf.socialIds.konamiUidLabel}
              error={errors.konamiUid}
              editing={editing}
              displayValue={form.konamiUid || dash}
            >
              <input
                value={form.konamiUid}
                onChange={(e) => set("konamiUid", e.target.value.toUpperCase())}
                placeholder={pf.socialIds.konamiUidPlaceholder}
                className={`${fieldInputClass} font-mono`}
              />
            </FieldSlot>
          </div>
        </div>
      </div>

      {/* Device Info */}
      <div className="rounded-2xl border border-surface-line bg-surface/60 p-6">
        <h3 className="font-display text-xl font-bold text-ink">{pf.deviceInfo.title}</h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <FieldSlot
            label={pf.deviceInfo.deviceNameLabel}
            editing={editing}
            displayValue={form.deviceName || dash}
          >
            <input
              value={form.deviceName}
              onChange={(e) => set("deviceName", e.target.value)}
              placeholder={pf.deviceInfo.deviceNamePlaceholder}
              className={fieldInputClass}
            />
          </FieldSlot>
          <FieldSlot
            label={pf.deviceInfo.deviceModelLabel}
            editing={editing}
            displayValue={form.deviceModel || dash}
          >
            <input
              value={form.deviceModel}
              onChange={(e) => set("deviceModel", e.target.value)}
              className={fieldInputClass}
            />
          </FieldSlot>
        </div>
      </div>

      {/* Contact & Personal */}
      <div className="rounded-2xl border border-surface-line bg-surface/60 p-6">
        <h3 className="font-display text-xl font-bold text-ink">{pf.contactPersonal.title}</h3>
        <div className="mt-5 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FieldSlot
              label={pf.contactPersonal.phoneLabel}
              required
              hint={pf.contactPersonal.phoneHint}
              error={errors.phoneNumber}
              editing={editing}
              displayValue={form.phoneNumber || dash}
            >
              <input
                value={form.phoneNumber}
                onChange={(e) => set("phoneNumber", e.target.value)}
                placeholder="+880171234567"
                className={fieldInputClass}
              />
            </FieldSlot>

            <FieldSlot
              label={pf.contactPersonal.countryLabel}
              required
              error={errors.country}
              editing={editing}
              displayValue={form.country || dash}
            >
              <select value={form.country} onChange={(e) => set("country", e.target.value)} className={fieldInputClass}>
                <option value="">{pf.contactPersonal.countryPlaceholder}</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FieldSlot>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FieldSlot
              label={pf.contactPersonal.birthdayLabel}
              required
              error={errors.birthday}
              editing={editing}
              displayValue={form.birthday || dash}
            >
              <input
                type="date"
                value={form.birthday}
                onChange={(e) => set("birthday", e.target.value)}
                className={fieldInputClass}
              />
            </FieldSlot>
            <FieldSlot
              label={pf.contactPersonal.bloodGroupLabel}
              editing={editing}
              displayValue={form.bloodGroup || dash}
            >
              <select
                value={form.bloodGroup}
                onChange={(e) => set("bloodGroup", e.target.value as BloodGroup | "")}
                className={fieldInputClass}
              >
                <option value="">{pf.contactPersonal.bloodGroupPlaceholder}</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </FieldSlot>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FieldSlot
              label={pf.contactPersonal.divisionLabel}
              editing={editing}
              displayValue={form.division || dash}
            >
              <select
                value={form.division}
                onChange={(e) => {
                  const division = e.target.value;
                  setForm((f) => ({
                    ...f,
                    division,
                    district: BD_DISTRICTS_BY_DIVISION[division as BdDivision]?.includes(f.district)
                      ? f.district
                      : "",
                  }));
                }}
                className={fieldInputClass}
              >
                <option value="">{pf.contactPersonal.divisionPlaceholder}</option>
                {BD_DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </FieldSlot>
            <FieldSlot
              label={pf.contactPersonal.districtLabel}
              editing={editing}
              displayValue={form.district || dash}
            >
              <select
                value={form.district}
                onChange={(e) => set("district", e.target.value)}
                disabled={!form.division}
                className={fieldInputClass}
              >
                <option value="">{pf.contactPersonal.districtPlaceholder}</option>
                {(BD_DISTRICTS_BY_DIVISION[form.division as BdDivision] ?? []).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </FieldSlot>
          </div>

          <FieldSlot
            label={pf.contactPersonal.addressLabel}
            required
            error={errors.permanentAddress}
            editing={editing}
            multiline
            displayValue={form.permanentAddress || dash}
          >
            <textarea
              value={form.permanentAddress}
              onChange={(e) => set("permanentAddress", e.target.value)}
              rows={3}
              className={fieldInputClass}
            />
          </FieldSlot>

          <div>
            <span className="text-sm font-medium text-ink-soft">{pf.contactPersonal.locationLabel}</span>
            <div className="mt-1.5">
              {editing ? (
                <LocationPicker
                  value={form.currentLocation}
                  onChange={(v) => set("currentLocation", v)}
                  geolocateLabel={pf.contactPersonal.geolocateCta}
                  geolocateErrorMessage={pf.contactPersonal.geolocateError}
                />
              ) : (
                <p className="rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink">
                  {form.currentLocation
                    ? `${form.currentLocation.lat.toFixed(5)}, ${form.currentLocation.lng.toFixed(5)}`
                    : dash}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Work & Education */}
      <div className="rounded-2xl border border-surface-line bg-surface/60 p-6">
        <h3 className="font-display text-xl font-bold text-ink">{pf.workEducation.title}</h3>

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-ink">{pf.workEducation.workTitle}</span>
            {editing ? <span className="text-xs text-ink-faint">{pf.workEducation.workMaxNote}</span> : null}
          </div>
          <div className="mt-3">
            {editing ? (
              <RepeatableEntryList<WorkExperienceEntry>
                items={form.workExperience}
                onChange={(items) => set("workExperience", items)}
                max={3}
                addLabel={pf.workEducation.addWorkCta}
                removeLabel={pf.workEducation.removeEntry}
                entryLabel={(i) => `${pf.workEducation.workEntryPrefix}${i + 1}`}
                emptyEntry={{ workplace: "", jobTitle: "" }}
                renderEntry={(entry, onEntryChange) => (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormFieldWrapper label={pf.workEducation.workplaceLabel}>
                      <input
                        value={entry.workplace}
                        onChange={(e) => onEntryChange({ ...entry, workplace: e.target.value })}
                        placeholder={pf.workEducation.workplacePlaceholder}
                        className={fieldInputClass}
                      />
                    </FormFieldWrapper>
                    <FormFieldWrapper label={pf.workEducation.jobTitleLabel}>
                      <input
                        value={entry.jobTitle}
                        onChange={(e) => onEntryChange({ ...entry, jobTitle: e.target.value })}
                        placeholder={pf.workEducation.jobTitlePlaceholder}
                        className={fieldInputClass}
                      />
                    </FormFieldWrapper>
                  </div>
                )}
              />
            ) : form.workExperience.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {form.workExperience.map((entry, i) => (
                  <div key={i} className="rounded-lg border border-surface-line bg-surface p-4 text-sm">
                    <p className="font-semibold text-ink">{entry.workplace || dash}</p>
                    <p className="text-ink-soft">{entry.jobTitle || dash}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink">{dash}</p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-ink">{pf.workEducation.educationTitle}</span>
            {editing ? <span className="text-xs text-ink-faint">{pf.workEducation.educationMaxNote}</span> : null}
          </div>
          <div className="mt-3">
            {editing ? (
              <RepeatableEntryList<EducationEntry>
                items={form.education}
                onChange={(items) => set("education", items)}
                max={3}
                addLabel={pf.workEducation.addEducationCta}
                removeLabel={pf.workEducation.removeEntry}
                entryLabel={(i) => `${pf.workEducation.educationEntryPrefix}${i + 1}`}
                emptyEntry={{ instituteName: "", fieldOfStudy: "", instituteType: "University" }}
                renderEntry={(entry, onEntryChange) => (
                  <div className="space-y-3">
                    <FormFieldWrapper label={pf.workEducation.instituteNameLabel}>
                      <input
                        value={entry.instituteName}
                        onChange={(e) => onEntryChange({ ...entry, instituteName: e.target.value })}
                        placeholder={pf.workEducation.instituteNamePlaceholder}
                        className={fieldInputClass}
                      />
                    </FormFieldWrapper>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormFieldWrapper label={pf.workEducation.fieldOfStudyLabel}>
                        <input
                          value={entry.fieldOfStudy}
                          onChange={(e) => onEntryChange({ ...entry, fieldOfStudy: e.target.value })}
                          placeholder={pf.workEducation.fieldOfStudyPlaceholder}
                          className={fieldInputClass}
                        />
                      </FormFieldWrapper>
                      <FormFieldWrapper label={pf.workEducation.instituteTypeLabel}>
                        <select
                          value={entry.instituteType}
                          onChange={(e) =>
                            onEntryChange({ ...entry, instituteType: e.target.value as EducationEntry["instituteType"] })
                          }
                          className={fieldInputClass}
                        >
                          {INSTITUTE_TYPES.map((it) => (
                            <option key={it} value={it}>
                              {pf.workEducation[INSTITUTE_TYPE_LABEL_KEY[it]]}
                            </option>
                          ))}
                        </select>
                      </FormFieldWrapper>
                    </div>
                  </div>
                )}
              />
            ) : form.education.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {form.education.map((entry, i) => (
                  <div key={i} className="rounded-lg border border-surface-line bg-surface p-4 text-sm">
                    <p className="font-semibold text-ink">{entry.instituteName || dash}</p>
                    <p className="text-ink-soft">{entry.fieldOfStudy || dash}</p>
                    <p className="text-xs text-ink-faint">{pf.workEducation[INSTITUTE_TYPE_LABEL_KEY[entry.instituteType]]}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink">{dash}</p>
            )}
          </div>
        </div>
      </div>

      {/* Document Verification */}
      <div className="rounded-2xl border border-surface-line bg-surface/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-xl font-bold text-ink">{pf.documentVerification.title}</h3>
          <span className="rounded-full border border-surface-line-strong bg-bg-raised px-3 py-1.5 text-xs font-medium text-ink">
            {pf.verificationLevelLabel}: {user.verificationLevel ?? 0}
            {user.verificationStatus === "pending" ? ` · ${pf.verificationLevelPending}` : ""}
          </span>
        </div>

        {editing ? (
          <div className="mt-5 space-y-2 text-xs text-ink-faint">
            <p>{pf.documentVerification.levelDescription3}</p>
            <p>{pf.documentVerification.levelDescription2}</p>
            <p>{pf.documentVerification.levelDescription1}</p>
          </div>
        ) : null}

        <div className="mt-5 space-y-5">
          <FieldSlot
            label={pf.documentVerification.docTypeLabel}
            editing={editing}
            displayValue={documentTypeLabel || dash}
          >
            <select
              value={form.documentType}
              onChange={(e) => set("documentType", e.target.value as DocumentType | "")}
              className={fieldInputClass}
            >
              <option value="">{pf.documentVerification.docTypePlaceholder}</option>
              {DOCUMENT_TYPES.map((dt) => (
                <option key={dt} value={dt}>
                  {
                    pf.documentVerification[
                      DOCUMENT_TYPE_LABEL_KEY[dt] as keyof typeof pf.documentVerification
                    ]
                  }
                </option>
              ))}
            </select>
          </FieldSlot>

          {editing ? (
            <FileUploadControl
              label={pf.documentVerification.uploadLabel}
              value={form.documentDataUrl}
              onChange={(v) => set("documentDataUrl", v)}
              uploadLabel={pf.documentVerification.uploadCta}
              changeLabel={pf.documentVerification.changeCta}
            />
          ) : (
            <PhotoField
              editing={false}
              label={pf.documentVerification.uploadLabel}
              value={form.documentDataUrl}
              onChange={() => {}}
              notProvided={dash}
            />
          )}
        </div>
      </div>

      {editing ? (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={cancelEditing}
            className="flex-1 rounded-full border border-surface-line-strong px-6 py-3 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
          >
            {pf.cancelCta}
          </button>
          <button
            type="submit"
            className="flex-1 rounded-full bg-accent px-6 py-3 font-display font-semibold text-bg transition-transform hover:-translate-y-0.5"
          >
            {pf.submitCta}
          </button>
        </div>
      ) : null}
    </form>
  );
}
