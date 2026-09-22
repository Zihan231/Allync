"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useUpdateMe, useUpsertEfootballProfile, useDeleteAccount } from "@/lib/api/hooks/useUsers";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { getPerson, updatePersonProfile } from "@/lib/mock/communityStore";
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
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useConfirm } from "@/lib/useConfirm";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";

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

export type ProfileTab = "account" | "social" | "personal" | "work_education" | "verification";

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
    dpUrl: person?.dpUrl ?? user.dpUrl ?? null,
    coverUrl: person?.coverUrl ?? user.coverUrl ?? user.raw?.coverUrl ?? null,
    email: user.email || "",
    password: "",
    facebookProfileName: person?.facebookProfileName ?? user.raw?.facebookProfileName ?? "",
    facebookUrl: person?.facebookUrl ?? user.raw?.facebookUrl ?? "",
    instagramUrl: person?.instagramUrl ?? user.raw?.instagramUrl ?? "",
    konamiUid: person?.konamiUid ?? person?.inGameId ?? user.raw?.efootballProfile?.konamiUid ?? user.raw?.inGameId ?? "",
    deviceName: person?.deviceName ?? user.raw?.deviceName ?? "",
    deviceModel: person?.deviceModel ?? user.raw?.deviceModel ?? "",
    phoneNumber: person?.phoneNumber ?? user.phoneNumber ?? user.raw?.phoneNumber ?? "",
    birthday: person?.birthday ?? user.raw?.birthday ?? "",
    bloodGroup: (person?.bloodGroup ?? user.raw?.bloodGroup ?? "") as BloodGroup | "",
    country: person?.country ?? user.raw?.country ?? "",
    division: person?.division ?? user.raw?.division ?? "",
    district: person?.district ?? user.raw?.district ?? "",
    permanentAddress: person?.permanentAddress ?? user.permanentAddress ?? user.raw?.permanentAddress ?? "",
    currentLocation: person?.currentLocation ?? user.raw?.currentLocation ?? null,
    workExperience: person?.workExperience ?? user.raw?.workExperience ?? [],
    education: person?.education ?? user.raw?.education ?? [],
    documentType: (person?.documentType ?? user.raw?.documentType ?? "") as DocumentType | "",
    documentDataUrl: person?.documentDataUrl ?? user.raw?.documentDataUrl ?? null,
  };
}

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
  const { user, refreshSession, setDpUrl, updateProfile, setVerificationStatus, setVerificationLevel } = useSession();
  const person = getPerson(user.id) || getPerson(user.personId);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ProfileTab>("account");
  const [showPassword, setShowPassword] = useState(false);
  const [editingTab, setEditingTab] = useState<ProfileTab | null>(null);

  const [form, setForm] = useState<FormState>(() => buildForm(person, user));
  const [snapshot, setSnapshot] = useState<FormState>(() => buildForm(person, user));

  const [errors, setErrors] = useState<FormErrors>({});
  const [tabSaving, setTabSaving] = useState<Partial<Record<ProfileTab, boolean>>>({});
  const [tabErrors, setTabErrors] = useState<Partial<Record<ProfileTab, string | null>>>({});
  const [tabSuccess, setTabSuccess] = useState<Partial<Record<ProfileTab, boolean>>>({});
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const updateMe = useUpdateMe();
  const { confirm, confirmProps } = useConfirm();
  const { toasts, toast, dismiss } = useToast();
  const upsertEfootballProfile = useUpsertEfootballProfile();
  const deleteAccount = useDeleteAccount();

  const hasRealAccount = Boolean(user.raw);

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const startEdit = (tab: ProfileTab) => {
    setEditingTab(tab);
    setTabErrors((prev) => ({ ...prev, [tab]: null }));
    setTabSuccess((prev) => ({ ...prev, [tab]: false }));
  };

  const cancelEdit = (tab: ProfileTab) => {
    setForm((current) => {
      const next = { ...current };
      if (tab === "account") {
        next.dpUrl = snapshot.dpUrl;
        next.coverUrl = snapshot.coverUrl;
        next.email = snapshot.email;
        next.password = "";
      } else if (tab === "social") {
        next.facebookProfileName = snapshot.facebookProfileName;
        next.facebookUrl = snapshot.facebookUrl;
        next.instagramUrl = snapshot.instagramUrl;
        next.konamiUid = snapshot.konamiUid;
        next.deviceName = snapshot.deviceName;
        next.deviceModel = snapshot.deviceModel;
      } else if (tab === "personal") {
        next.phoneNumber = snapshot.phoneNumber;
        next.birthday = snapshot.birthday;
        next.bloodGroup = snapshot.bloodGroup;
        next.country = snapshot.country;
        next.division = snapshot.division;
        next.district = snapshot.district;
        next.permanentAddress = snapshot.permanentAddress;
        next.currentLocation = snapshot.currentLocation;
      } else if (tab === "work_education") {
        next.workExperience = snapshot.workExperience;
        next.education = snapshot.education;
      } else if (tab === "verification") {
        next.documentType = snapshot.documentType;
        next.documentDataUrl = snapshot.documentDataUrl;
      }
      return next;
    });
    setErrors({});
    setTabErrors((prev) => ({ ...prev, [tab]: null }));
    setEditingTab(null);
  };

  function validateTab(tab: ProfileTab): FormErrors {
    const next: FormErrors = {};
    if (tab === "account") {
      if (!form.email.trim()) next.email = "Required.";
      if (form.password && !isValidPasswordLength(form.password)) {
        next.password = "Password must be at least 6 characters.";
      }
    } else if (tab === "social") {
      if (form.facebookUrl.trim() && !isFacebookUrl(form.facebookUrl)) {
        next.facebookUrl = pf.socialIds.facebookLinkError;
      }
      if (form.instagramUrl.trim() && !isInstagramUrl(form.instagramUrl)) {
        next.instagramUrl = pf.socialIds.instagramError;
      }
      if (form.konamiUid.trim() && !isValidKonamiUid(form.konamiUid)) {
        next.konamiUid = pf.socialIds.konamiUidError;
      }
    } else if (tab === "personal") {
      if (form.phoneNumber.trim() && !isValidPhone(form.phoneNumber)) {
        next.phoneNumber = pf.contactPersonal.phoneError;
      }
    }
    return next;
  }

  async function handleSaveTab(tab: ProfileTab) {
    const nextErrors = validateTab(tab);
    setErrors(nextErrors);
    setTabErrors((prev) => ({ ...prev, [tab]: null }));
    setTabSuccess((prev) => ({ ...prev, [tab]: false }));
    if (Object.keys(nextErrors).length > 0) return;

    setTabSaving((prev) => ({ ...prev, [tab]: true }));
    try {
      let payload: Record<string, any> = {};

      if (tab === "account") {
        payload = {
          dpUrl: form.dpUrl,
          coverUrl: form.coverUrl,
          email: form.email,
          ...(form.password ? { password: form.password } : {}),
        };
      } else if (tab === "social") {
        payload = {
          inGameId: form.konamiUid || null,
          facebookProfileName: form.facebookProfileName || null,
          facebookUrl: form.facebookUrl || null,
          instagramUrl: form.instagramUrl || null,
          deviceName: form.deviceName || null,
          deviceModel: form.deviceModel || null,
        };
      } else if (tab === "personal") {
        payload = {
          phoneNumber: form.phoneNumber || null,
          birthday: form.birthday || null,
          bloodGroup: form.bloodGroup || null,
          country: form.country || null,
          division: form.division || null,
          district: form.district || null,
          permanentAddress: form.permanentAddress || null,
          currentLocation: form.currentLocation || null,
        };
      } else if (tab === "work_education") {
        payload = {
          workExperience: form.workExperience && form.workExperience.length > 0 ? form.workExperience : null,
          education: form.education && form.education.length > 0 ? form.education : null,
        };
      } else if (tab === "verification") {
        payload = {
          documentType: form.documentType || null,
          documentDataUrl: form.documentDataUrl || null,
          verificationLevel: form.documentType
            ? getVerificationLevelForDocument(form.documentType)
            : (person?.verificationLevel ?? user.verificationLevel ?? 0),
        };
      }

      // 1. Send PATCH /users/me
      await updateMe.mutateAsync(payload);

      // 2. Also sync eFootball profile if konamiUid provided
      if (tab === "social" && form.konamiUid) {
        await upsertEfootballProfile.mutateAsync({ konamiUid: form.konamiUid }).catch(() => {});
      }

      // 3. Update local in-memory store
      const targetId = user.id || user.personId;
      if (targetId) {
        updatePersonProfile(targetId, {
          ...payload,
          ...(tab === "social" ? { konamiUid: form.konamiUid || undefined } : {}),
        });
      }

      // 4. Update session
      if (tab === "account") {
        setDpUrl(form.dpUrl);
        updateProfile({ email: form.email });
      } else if (tab === "verification") {
        setVerificationStatus(form.documentType ? "pending" : "unverified");
        if (form.documentType) {
          setVerificationLevel(getVerificationLevelForDocument(form.documentType));
        }
      }

      if (refreshSession) {
        await refreshSession();
      }

      // 5. Update snapshot
      setSnapshot((prev) => ({
        ...prev,
        ...form,
        password: "",
      }));
      setForm((prev) => ({ ...prev, password: "" }));

      // 6. Finish editing & show success
      const tabLabel = tabs.find((t) => t.id === tab)?.label || "Profile";
      toast(`${tabLabel} updated successfully!`, "success");
      setEditingTab(null);
      setTabSuccess((prev) => ({ ...prev, [tab]: true }));
      setTimeout(() => {
        setTabSuccess((prev) => ({ ...prev, [tab]: false }));
      }, 4000);
    } catch (err: any) {
      const message =
        err?.message ||
        (err?.raw?.message ? (Array.isArray(err.raw.message) ? err.raw.message.join(", ") : err.raw.message) : null) ||
        "Failed to save profile changes to server.";
      console.error(`Profile save error [${tab}]:`, message, err);
      setTabErrors((prev) => ({ ...prev, [tab]: message }));
      toast(message, "error");
    } finally {
      setTabSaving((prev) => ({ ...prev, [tab]: false }));
    }
  }

  async function handleDeleteAccount() {
    if (!user.id) return;
    if (
      !(await confirm("Delete your account permanently? This cannot be undone.", {
        title: "Delete Account",
        variant: "danger",
        confirmLabel: "Delete Account",
      }))
    )
      return;

    try {
      setDeleteError(null);
      await deleteAccount.mutateAsync(user.id);
      router.push("/");
    } catch (err: any) {
      console.error("Account deletion error:", err);
      setDeleteError(err?.message || "Failed to delete account.");
    }
  }

  const documentTypeLabel = form.documentType
    ? (pf.documentVerification[
        DOCUMENT_TYPE_LABEL_KEY[form.documentType] as keyof typeof pf.documentVerification
      ] as string)
    : "";

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "account", label: pf.accountInfo.title },
    { id: "social", label: pf.socialIds.title },
    { id: "personal", label: pf.contactPersonal.title },
    { id: "work_education", label: pf.workEducation.title },
    { id: "verification", label: pf.documentVerification.title },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Navigation Bar */}
      <div className="rounded-2xl border border-surface-line bg-surface/80 p-4 sm:p-6 backdrop-blur shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-black text-ink tracking-tight">
              {pf.title}
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-ink-soft">
              Manage your personal credentials, social profiles, location, and verification details.
            </p>
          </div>

          {editingTab ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-ink">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              {pf.editingBadge}: {tabs.find((t) => t.id === editingTab)?.label}
            </div>
          ) : null}
        </div>

        {/* Scrollable Tabs Bar */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-surface-line/70">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isEditing = editingTab === tab.id;
            const hasSuccess = tabSuccess[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setTabErrors((prev) => ({ ...prev, [tab.id]: null }));
                }}
                className={`relative flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? "border-b-2 border-accent text-accent-ink bg-surface"
                    : "text-ink-soft hover:text-ink hover:bg-surface/50"
                }`}
              >
                <span>{tab.label}</span>
                {isEditing ? (
                  <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent-ink uppercase">
                    Edit
                  </span>
                ) : null}
                {hasSuccess ? (
                  <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 text-[10px] font-bold">
                    Saved
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: Account Info */}
      {activeTab === "account" && (
        <TabCard
          title={pf.accountInfo.title}
          subtitle="Manage your public avatar, banner photo, login email and security credentials."
          isEditing={editingTab === "account"}
          isSaving={Boolean(tabSaving.account)}
          hasSuccess={Boolean(tabSuccess.account)}
          error={tabErrors.account}
          onEdit={() => startEdit("account")}
          onCancel={() => cancelEdit("account")}
          onSave={() => handleSaveTab("account")}
          cancelLabel={pf.cancelCta}
          saveLabel={pf.submitCta}
          editLabel={pf.editCta}
        >
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <PhotoField
                editing={editingTab === "account"}
                label={t.dashboard.onboarding.photoLabel}
                value={form.dpUrl}
                onChange={(v) => set("dpUrl", v)}
                notProvided={dash}
              />
              <PhotoField
                editing={editingTab === "account"}
                label={pf.accountInfo.coverPhotoLabel}
                value={form.coverUrl}
                onChange={(v) => set("coverUrl", v)}
                notProvided={dash}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FieldSlot
                label={pf.accountInfo.emailLabel}
                required
                error={errors.email}
                editing={editingTab === "account"}
                displayValue={form.email || dash}
              >
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={fieldInputClass}
                />
              </FieldSlot>

              <FieldSlot
                label={pf.accountInfo.passwordLabel}
                hint="Minimum 6 characters"
                error={errors.password}
                editing={editingTab === "account"}
                displayValue={form.password ? "••••••••" : dash}
              >
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Enter new password to change"
                    className={`${fieldInputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition-colors p-1 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </FieldSlot>
            </div>
          </div>
        </TabCard>
      )}

      {/* TAB 2: Social & Gaming IDs */}
      {activeTab === "social" && (
        <TabCard
          title={pf.socialIds.title}
          subtitle="Link your Konami in-game ID, social profiles, and gaming device details."
          isEditing={editingTab === "social"}
          isSaving={Boolean(tabSaving.social)}
          hasSuccess={Boolean(tabSuccess.social)}
          error={tabErrors.social}
          onEdit={() => startEdit("social")}
          onCancel={() => cancelEdit("social")}
          onSave={() => handleSaveTab("social")}
          cancelLabel={pf.cancelCta}
          saveLabel={pf.submitCta}
          editLabel={pf.editCta}
        >
          <div className="space-y-6">
            <div className="space-y-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                {pf.socialIds.title}
              </h4>
              <div className="grid gap-5 sm:grid-cols-2">
                <FieldSlot
                  label={pf.socialIds.konamiUidLabel}
                  error={errors.konamiUid}
                  editing={editingTab === "social"}
                  displayValue={form.konamiUid || dash}
                >
                  <input
                    value={form.konamiUid}
                    onChange={(e) => set("konamiUid", e.target.value.toUpperCase())}
                    placeholder={pf.socialIds.konamiUidPlaceholder}
                    className={`${fieldInputClass} font-mono`}
                  />
                </FieldSlot>

                <FieldSlot
                  label={pf.accountInfo.facebookNameLabel}
                  hint={pf.accountInfo.facebookNameHint}
                  editing={editingTab === "social"}
                  displayValue={form.facebookProfileName || dash}
                >
                  <input
                    value={form.facebookProfileName}
                    onChange={(e) => set("facebookProfileName", e.target.value)}
                    className={fieldInputClass}
                  />
                </FieldSlot>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldSlot
                  label={pf.socialIds.facebookLinkLabel}
                  hint={pf.socialIds.facebookLinkHint}
                  error={errors.facebookUrl}
                  editing={editingTab === "social"}
                  displayValue={form.facebookUrl || dash}
                >
                  <input
                    value={form.facebookUrl}
                    onChange={(e) => set("facebookUrl", e.target.value)}
                    placeholder={pf.socialIds.facebookLinkPlaceholder}
                    className={fieldInputClass}
                  />
                </FieldSlot>

                <FieldSlot
                  label={pf.socialIds.instagramLabel}
                  error={errors.instagramUrl}
                  editing={editingTab === "social"}
                  displayValue={form.instagramUrl || dash}
                >
                  <input
                    value={form.instagramUrl}
                    onChange={(e) => set("instagramUrl", e.target.value)}
                    placeholder={pf.socialIds.instagramPlaceholder}
                    className={fieldInputClass}
                  />
                </FieldSlot>
              </div>
            </div>

            {/* Device Info Sub-section */}
            <div className="border-t border-surface-line pt-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                {pf.deviceInfo.title}
              </h4>
              <div className="grid gap-5 sm:grid-cols-2">
                <FieldSlot
                  label={pf.deviceInfo.deviceNameLabel}
                  editing={editingTab === "social"}
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
                  editing={editingTab === "social"}
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
          </div>
        </TabCard>
      )}

      {/* TAB 3: Contact & Personal */}
      {activeTab === "personal" && (
        <TabCard
          title={pf.contactPersonal.title}
          subtitle="Your contact numbers, date of birth, blood group, and geographical address details."
          isEditing={editingTab === "personal"}
          isSaving={Boolean(tabSaving.personal)}
          hasSuccess={Boolean(tabSuccess.personal)}
          error={tabErrors.personal}
          onEdit={() => startEdit("personal")}
          onCancel={() => cancelEdit("personal")}
          onSave={() => handleSaveTab("personal")}
          cancelLabel={pf.cancelCta}
          saveLabel={pf.submitCta}
          editLabel={pf.editCta}
        >
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FieldSlot
                label={pf.contactPersonal.phoneLabel}
                hint={pf.contactPersonal.phoneHint}
                error={errors.phoneNumber}
                editing={editingTab === "personal"}
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
                error={errors.country}
                editing={editingTab === "personal"}
                displayValue={form.country || dash}
              >
                <select
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  className={fieldInputClass}
                >
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
                error={errors.birthday}
                editing={editingTab === "personal"}
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
                editing={editingTab === "personal"}
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
                editing={editingTab === "personal"}
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
                editing={editingTab === "personal"}
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
              error={errors.permanentAddress}
              editing={editingTab === "personal"}
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
                {editingTab === "personal" ? (
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
        </TabCard>
      )}

      {/* TAB 4: Work & Education */}
      {activeTab === "work_education" && (
        <TabCard
          title={pf.workEducation.title}
          subtitle="Provide your employment background and educational degrees for tournament qualifications."
          isEditing={editingTab === "work_education"}
          isSaving={Boolean(tabSaving.work_education)}
          hasSuccess={Boolean(tabSuccess.work_education)}
          error={tabErrors.work_education}
          onEdit={() => startEdit("work_education")}
          onCancel={() => cancelEdit("work_education")}
          onSave={() => handleSaveTab("work_education")}
          cancelLabel={pf.cancelCta}
          saveLabel={pf.submitCta}
          editLabel={pf.editCta}
        >
          <div className="space-y-8">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-ink">{pf.workEducation.workTitle}</span>
                {editingTab === "work_education" ? (
                  <span className="text-xs text-ink-faint">{pf.workEducation.workMaxNote}</span>
                ) : null}
              </div>
              <div className="mt-3">
                {editingTab === "work_education" ? (
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
                  <p className="rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink">
                    {dash}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-surface-line pt-6">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-ink">{pf.workEducation.educationTitle}</span>
                {editingTab === "work_education" ? (
                  <span className="text-xs text-ink-faint">{pf.workEducation.educationMaxNote}</span>
                ) : null}
              </div>
              <div className="mt-3">
                {editingTab === "work_education" ? (
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
                                onEntryChange({
                                  ...entry,
                                  instituteType: e.target.value as EducationEntry["instituteType"],
                                })
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
                        <p className="text-xs text-ink-faint">
                          {pf.workEducation[INSTITUTE_TYPE_LABEL_KEY[entry.instituteType]]}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink">
                    {dash}
                  </p>
                )}
              </div>
            </div>
          </div>
        </TabCard>
      )}

      {/* TAB 5: Document Verification & Danger Zone */}
      {activeTab === "verification" && (
        <div className="space-y-6">
          <TabCard
            title={pf.documentVerification.title}
            subtitle="Verify your identity with official identification documents to unlock higher competition tiers."
            isEditing={editingTab === "verification"}
            isSaving={Boolean(tabSaving.verification)}
            hasSuccess={Boolean(tabSuccess.verification)}
            error={tabErrors.verification}
            onEdit={() => startEdit("verification")}
            onCancel={() => cancelEdit("verification")}
            onSave={() => handleSaveTab("verification")}
            cancelLabel={pf.cancelCta}
            saveLabel={pf.submitCta}
            editLabel={pf.editCta}
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-line pb-4">
                <span className="rounded-full border border-surface-line-strong bg-bg-raised px-3 py-1.5 text-xs font-medium text-ink">
                  {pf.verificationLevelLabel}: {user.verificationLevel ?? 0}
                  {user.verificationStatus === "pending" ? ` • ${pf.verificationLevelPending}` : ""}
                </span>
              </div>

              {editingTab === "verification" ? (
                <div className="mt-4 space-y-1.5 text-xs text-ink-faint">
                  <p>{pf.documentVerification.levelDescription3}</p>
                  <p>{pf.documentVerification.levelDescription2}</p>
                  <p>{pf.documentVerification.levelDescription1}</p>
                </div>
              ) : null}

              <div className="mt-5 space-y-5">
                <FieldSlot
                  label={pf.documentVerification.docTypeLabel}
                  editing={editingTab === "verification"}
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

                {editingTab === "verification" ? (
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
          </TabCard>

          {/* Danger Zone */}
          {hasRealAccount && editingTab !== "verification" ? (
            <div className="rounded-2xl border border-danger-ink/30 bg-surface/60 p-6">
              <h3 className="font-display text-lg font-bold text-ink">Danger Zone</h3>
              <p className="mt-1 text-xs text-ink-soft">
                Deleting your account permanently removes your profile, matches, and uploaded documents.
              </p>
              {deleteError ? (
                <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
                  {deleteError}
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="mt-4 rounded-full border border-danger-ink/40 bg-danger/10 px-5 py-2.5 text-xs font-semibold text-danger-ink transition-colors hover:bg-danger hover:text-white"
              >
                Delete Account
              </button>
            </div>
          ) : null}
        </div>
      )}

      {confirmProps ? <ConfirmDialog {...confirmProps} /> : null}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

// Reusable card container for each tab with integrated Edit and Save controls
function TabCard({
  title,
  subtitle,
  isEditing,
  isSaving,
  hasSuccess,
  error,
  onEdit,
  onCancel,
  onSave,
  cancelLabel,
  saveLabel,
  editLabel,
  children,
}: {
  title: string;
  subtitle: string;
  isEditing: boolean;
  isSaving: boolean;
  hasSuccess: boolean;
  error?: string | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  cancelLabel: string;
  saveLabel: string;
  editLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-surface-line bg-surface/70 p-5 sm:p-7 shadow-sm space-y-6">
      {/* Section Card Header with Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-surface-line/70 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
            {isEditing ? (
              <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-ink">
                Editing
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-ink-soft">{subtitle}</p>
        </div>

        {!isEditing ? (
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs sm:text-sm font-semibold text-accent-ink transition-all hover:bg-accent hover:text-bg shadow-sm"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>{editLabel}</span>
            </button>
          </div>
        ) : null}
      </div>



      {/* Form Content for this Tab */}
      <div>{children}</div>

      {/* Bottom Action Controls when in Edit Mode */}
      {isEditing ? (
        <div className="flex flex-col-reverse gap-3 pt-4 border-t border-surface-line/70 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-faint">
            Save or cancel changes in this section before switching tabs.
          </p>
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              disabled={isSaving}
              onClick={onCancel}
              className="rounded-full border border-surface-line-strong px-4 py-2 text-xs sm:text-sm font-semibold text-ink-soft transition-colors hover:text-ink disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={onSave}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-xs sm:text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5 disabled:opacity-50 shadow-md"
            >
              {isSaving ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-bg border-t-transparent" />
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span>{saveLabel}</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
