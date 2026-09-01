"use client";

import { useState, type FormEvent } from "react";
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
  WorkExperienceEntry,
} from "@/lib/mock/types";

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

export function ProfileEditForm() {
  const { t } = useLanguage();
  const pf = t.dashboard.profileForm;
  const { user, setDpUrl, updateProfile, setVerificationStatus, setVerificationLevel } = useSession();
  const person = getPerson(user.personId);

  const [form, setForm] = useState<FormState>(() => ({
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
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
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
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Account Info */}
      <div className="rounded-2xl border border-surface-line bg-surface/60 p-6">
        <h3 className="font-display text-xl font-bold text-ink">{pf.accountInfo.title}</h3>
        <div className="mt-5 space-y-5">
          <ImageUploadControl label={t.dashboard.onboarding.photoLabel} value={form.dpUrl} onChange={(v) => set("dpUrl", v)} />
          <ImageUploadControl label={pf.accountInfo.coverPhotoLabel} value={form.coverUrl} onChange={(v) => set("coverUrl", v)} />

          <FormFieldWrapper label={pf.accountInfo.emailLabel} required error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={fieldInputClass}
            />
          </FormFieldWrapper>

          <FormFieldWrapper label={pf.accountInfo.passwordLabel} hint={pf.accountInfo.passwordHint} error={errors.password}>
            <input
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className={fieldInputClass}
            />
          </FormFieldWrapper>

          <FormFieldWrapper label={pf.accountInfo.facebookNameLabel} hint={pf.accountInfo.facebookNameHint}>
            <input
              value={form.facebookProfileName}
              onChange={(e) => set("facebookProfileName", e.target.value)}
              className={fieldInputClass}
            />
          </FormFieldWrapper>
        </div>
      </div>

      {/* Social & IDs */}
      <div className="rounded-2xl border border-surface-line bg-surface/60 p-6">
        <h3 className="font-display text-xl font-bold text-ink">{pf.socialIds.title}</h3>
        <div className="mt-5 space-y-5">
          <FormFieldWrapper
            label={pf.socialIds.facebookLinkLabel}
            required
            hint={pf.socialIds.facebookLinkHint}
            error={errors.facebookUrl}
          >
            <input
              value={form.facebookUrl}
              onChange={(e) => set("facebookUrl", e.target.value)}
              placeholder={pf.socialIds.facebookLinkPlaceholder}
              className={fieldInputClass}
            />
          </FormFieldWrapper>

          <FormFieldWrapper label={pf.socialIds.instagramLabel} error={errors.instagramUrl}>
            <input
              value={form.instagramUrl}
              onChange={(e) => set("instagramUrl", e.target.value)}
              placeholder={pf.socialIds.instagramPlaceholder}
              className={fieldInputClass}
            />
          </FormFieldWrapper>

          <FormFieldWrapper label={pf.socialIds.konamiUidLabel} error={errors.konamiUid}>
            <input
              value={form.konamiUid}
              onChange={(e) => set("konamiUid", e.target.value.toUpperCase())}
              placeholder={pf.socialIds.konamiUidPlaceholder}
              className={`${fieldInputClass} font-mono`}
            />
          </FormFieldWrapper>
        </div>
      </div>

      {/* Device Info */}
      <div className="rounded-2xl border border-surface-line bg-surface/60 p-6">
        <h3 className="font-display text-xl font-bold text-ink">{pf.deviceInfo.title}</h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <FormFieldWrapper label={pf.deviceInfo.deviceNameLabel}>
            <input
              value={form.deviceName}
              onChange={(e) => set("deviceName", e.target.value)}
              placeholder={pf.deviceInfo.deviceNamePlaceholder}
              className={fieldInputClass}
            />
          </FormFieldWrapper>
          <FormFieldWrapper label={pf.deviceInfo.deviceModelLabel}>
            <input
              value={form.deviceModel}
              onChange={(e) => set("deviceModel", e.target.value)}
              className={fieldInputClass}
            />
          </FormFieldWrapper>
        </div>
      </div>

      {/* Contact & Personal */}
      <div className="rounded-2xl border border-surface-line bg-surface/60 p-6">
        <h3 className="font-display text-xl font-bold text-ink">{pf.contactPersonal.title}</h3>
        <div className="mt-5 space-y-5">
          <FormFieldWrapper
            label={pf.contactPersonal.phoneLabel}
            required
            hint={pf.contactPersonal.phoneHint}
            error={errors.phoneNumber}
          >
            <input
              value={form.phoneNumber}
              onChange={(e) => set("phoneNumber", e.target.value)}
              placeholder="+880171234567"
              className={fieldInputClass}
            />
          </FormFieldWrapper>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormFieldWrapper label={pf.contactPersonal.birthdayLabel} required error={errors.birthday}>
              <input
                type="date"
                value={form.birthday}
                onChange={(e) => set("birthday", e.target.value)}
                className={fieldInputClass}
              />
            </FormFieldWrapper>
            <FormFieldWrapper label={pf.contactPersonal.bloodGroupLabel}>
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
            </FormFieldWrapper>
          </div>

          <FormFieldWrapper label={pf.contactPersonal.countryLabel} required error={errors.country}>
            <select value={form.country} onChange={(e) => set("country", e.target.value)} className={fieldInputClass}>
              <option value="">{pf.contactPersonal.countryPlaceholder}</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormFieldWrapper>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormFieldWrapper label={pf.contactPersonal.divisionLabel}>
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
            </FormFieldWrapper>
            <FormFieldWrapper label={pf.contactPersonal.districtLabel}>
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
            </FormFieldWrapper>
          </div>

          <FormFieldWrapper label={pf.contactPersonal.addressLabel} required error={errors.permanentAddress}>
            <textarea
              value={form.permanentAddress}
              onChange={(e) => set("permanentAddress", e.target.value)}
              rows={3}
              className={fieldInputClass}
            />
          </FormFieldWrapper>

          <FormFieldWrapper label={pf.contactPersonal.locationLabel}>
            <LocationPicker
              value={form.currentLocation}
              onChange={(v) => set("currentLocation", v)}
              geolocateLabel={pf.contactPersonal.geolocateCta}
              geolocateErrorMessage={pf.contactPersonal.geolocateError}
            />
          </FormFieldWrapper>
        </div>
      </div>

      {/* Work & Education */}
      <div className="rounded-2xl border border-surface-line bg-surface/60 p-6">
        <h3 className="font-display text-xl font-bold text-ink">{pf.workEducation.title}</h3>

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-ink">{pf.workEducation.workTitle}</span>
            <span className="text-xs text-ink-faint">{pf.workEducation.workMaxNote}</span>
          </div>
          <div className="mt-3">
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
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-ink">{pf.workEducation.educationTitle}</span>
            <span className="text-xs text-ink-faint">{pf.workEducation.educationMaxNote}</span>
          </div>
          <div className="mt-3">
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

        <div className="mt-5 space-y-2 text-xs text-ink-faint">
          <p>{pf.documentVerification.levelDescription3}</p>
          <p>{pf.documentVerification.levelDescription2}</p>
          <p>{pf.documentVerification.levelDescription1}</p>
        </div>

        <div className="mt-5 space-y-5">
          <FormFieldWrapper label={pf.documentVerification.docTypeLabel}>
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
          </FormFieldWrapper>

          <FileUploadControl
            label={pf.documentVerification.uploadLabel}
            value={form.documentDataUrl}
            onChange={(v) => set("documentDataUrl", v)}
            uploadLabel={pf.documentVerification.uploadCta}
            changeLabel={pf.documentVerification.changeCta}
          />
        </div>
      </div>

      {submitted ? <p className="text-sm text-success-ink">{pf.submitSuccessNote}</p> : null}

      <button
        type="submit"
        className="w-full rounded-full bg-accent px-6 py-3 font-display font-semibold text-bg transition-transform hover:-translate-y-0.5"
      >
        {pf.submitCta}
      </button>
    </form>
  );
}
