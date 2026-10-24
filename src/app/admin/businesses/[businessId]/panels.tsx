"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Globe, Loader2, MailPlus, PauseCircle, PlayCircle, Trash2, UserMinus, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/app/confirm-action";
import { StatusBadge } from "@/components/app/status-badge";
import { applyResult } from "@/components/forms/apply-result";
import { Field, fieldAria } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { BUSINESS_CATEGORIES } from "@/lib/constants";
import {
  businessPlatformSettingsSchema,
  inviteAdminSchema,
  type BusinessPlatformSettingsInput,
  type InviteAdminInput,
} from "@/lib/validators/business";
import {
  deleteBusinessAction,
  inviteAdminAction,
  publishBusinessWebsiteAction,
  removeMemberAction,
  revokeInvitationAction,
  setBusinessStatusAction,
  setUserStatusAction,
  unpublishBusinessWebsiteAction,
  updateBusinessSettingsAction,
} from "../../actions";

export function WebsitePublishPanel({
  businessId,
  isLive,
  isSuspended,
  hasPublishedVersion,
}: {
  businessId: string;
  isLive: boolean;
  isSuspended: boolean;
  hasPublishedVersion: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="size-4" /> Website
        </CardTitle>
        <CardDescription>
          {isSuspended
            ? "The business is suspended, so its website is offline regardless of publication status."
            : isLive
              ? "The website is live. Publishing again replaces it with the current draft."
              : hasPublishedVersion
                ? "The website is offline. Publishing makes the current draft live."
                : "This website has never been published."}
        </CardDescription>
      </CardHeader>
      <CardFooter className="gap-2">
        <ConfirmAction
          trigger={<Button>Publish current draft</Button>}
          title="Publish this website?"
          description="The current draft (theme and sections) will replace the live website immediately."
          confirmLabel="Publish"
          successMessage="Website published"
          action={() => publishBusinessWebsiteAction(businessId)}
        />
        {isLive || hasPublishedVersion ? (
          <ConfirmAction
            trigger={<Button variant="outline">Unpublish</Button>}
            title="Take the website offline?"
            description="Visitors will see a not-found page until it is published again. Nothing is deleted."
            confirmLabel="Unpublish"
            destructive
            successMessage="Website unpublished"
            action={() => unpublishBusinessWebsiteAction(businessId)}
          />
        ) : null}
      </CardFooter>
    </Card>
  );
}

export function PlatformSettingsForm({ businessId, defaults }: { businessId: string; defaults: BusinessPlatformSettingsInput }) {
  const form = useForm<BusinessPlatformSettingsInput>({
    resolver: zodResolver(businessPlatformSettingsSchema),
    defaultValues: defaults,
  });
  const { errors, isSubmitting, isDirty } = form.formState;

  async function onSubmit(values: BusinessPlatformSettingsInput) {
    const result = await updateBusinessSettingsAction(businessId, values);
    if (applyResult(result, { success: "Settings saved", setError: form.setError })) form.reset(values);
  }

  const toggles = [
    { name: "allowSelfPublish", label: "Business can publish its own website", hint: "When off, only platform admins can publish." },
    { name: "enquiriesEnabled", label: "Enquiry form", hint: "Accept enquiries through the website." },
    { name: "whatsappEnabled", label: "WhatsApp buttons", hint: "Show WhatsApp chat links on the website." },
  ] as const;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Platform settings</CardTitle>
          <CardDescription>Web address, category and the features this business can use.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="grid gap-5">
            <Field id="slug" label="Web address" hint="Changing it breaks existing links to the website." error={errors.slug?.message}>
              <Input {...fieldAria("slug", errors.slug?.message, true)} {...form.register("slug")} />
            </Field>
            <Field id="category" label="Category" error={errors.category?.message}>
              <NativeSelect {...fieldAria("category", errors.category?.message)} {...form.register("category")}>
                {BUSINESS_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <fieldset className="grid gap-4">
            <legend className="mb-2 text-sm font-medium">Features</legend>
            {toggles.map((t) => (
              <Controller
                key={t.name}
                control={form.control}
                name={t.name}
                render={({ field }) => (
                  <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
                    <div>
                      <label htmlFor={t.name} className="text-sm font-medium">
                        {t.label}
                      </label>
                      <p className="text-xs text-muted-foreground">{t.hint}</p>
                    </div>
                    <Switch id={t.name} checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                )}
              />
            ))}
          </fieldset>
        </CardContent>
        <CardFooter className="justify-end border-t">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : null} Save settings
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

type Member = { userId: string; name: string; email: string; userStatus: "ACTIVE" | "SUSPENDED"; role: "OWNER" | "EDITOR" };
type PendingInvite = { id: string; email: string; role: "OWNER" | "EDITOR"; expiresAt: string };

function InviteDialog({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const form = useForm<InviteAdminInput>({
    resolver: zodResolver(inviteAdminSchema),
    defaultValues: { email: "", name: "", role: "OWNER" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: InviteAdminInput) {
    const result = await inviteAdminAction(businessId, values);
    if (!applyResult(result, { setError: form.setError }) || !result.ok) return;
    if (result.data.inviteUrl) {
      setInviteUrl(result.data.inviteUrl);
      toast.success("Invitation created");
    } else {
      toast.success("Existing user added to this business");
      setOpen(false);
    }
    form.reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setInviteUrl(null);
          setCopied(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <MailPlus /> Assign administrator
        </Button>
      </DialogTrigger>
      <DialogContent>
        {inviteUrl ? (
          <>
            <DialogHeader>
              <DialogTitle>Share this invitation link</DialogTitle>
              <DialogDescription>
                Send it to the new administrator. It works once and expires in 7 days. For security it is shown only now.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Input readOnly value={inviteUrl} aria-label="Invitation link" onFocus={(e) => e.target.select()} />
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(inviteUrl);
                  setCopied(true);
                }}
              >
                {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <DialogHeader>
              <DialogTitle>Assign a business administrator</DialogTitle>
              <DialogDescription>
                Existing users are added straight away. New people receive a single-use invitation link.
              </DialogDescription>
            </DialogHeader>
            <Field id="invite-email" label="Email" required error={errors.email?.message}>
              <Input {...fieldAria("invite-email", errors.email?.message)} type="email" {...form.register("email")} />
            </Field>
            <Field id="invite-name" label="Name" error={errors.name?.message}>
              <Input {...fieldAria("invite-name", errors.name?.message)} {...form.register("name")} />
            </Field>
            <Field id="invite-role" label="Permission" hint="Owners can publish (if allowed) and edit the business profile. Editors manage products and enquiries.">
              <NativeSelect {...fieldAria("invite-role", undefined, true)} {...form.register("role")}>
                <option value="OWNER">Owner</option>
                <option value="EDITOR">Editor</option>
              </NativeSelect>
            </Field>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : null} Continue
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AdministratorsPanel({
  businessId,
  members,
  invitations,
}: {
  businessId: string;
  members: Member[];
  invitations: PendingInvite[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle>Administrators</CardTitle>
          <CardDescription>People who can sign in and manage this business.</CardDescription>
        </div>
        <InviteDialog businessId={businessId} />
      </CardHeader>
      <CardContent>
        {members.length === 0 && invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No administrators yet. Assign one so the business can manage its website.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {members.map((m) => (
              <li key={m.userId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={m.role} />
                  {m.userStatus === "SUSPENDED" ? <StatusBadge status="SUSPENDED" /> : null}
                  <ConfirmAction
                    trigger={
                      <Button size="sm" variant="ghost" aria-label={m.userStatus === "ACTIVE" ? `Suspend ${m.name}` : `Reactivate ${m.name}`}>
                        <UserX />
                        <span className="hidden sm:inline">{m.userStatus === "ACTIVE" ? "Suspend" : "Reactivate"}</span>
                      </Button>
                    }
                    title={m.userStatus === "ACTIVE" ? `Suspend ${m.name}?` : `Reactivate ${m.name}?`}
                    description={
                      m.userStatus === "ACTIVE"
                        ? "They will be signed out everywhere and cannot sign in until reactivated."
                        : "They will be able to sign in again."
                    }
                    confirmLabel={m.userStatus === "ACTIVE" ? "Suspend user" : "Reactivate"}
                    destructive={m.userStatus === "ACTIVE"}
                    successMessage={m.userStatus === "ACTIVE" ? "User suspended" : "User reactivated"}
                    action={() => setUserStatusAction(m.userId, m.userStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                  />
                  <ConfirmAction
                    trigger={
                      <Button size="sm" variant="ghost" aria-label={`Remove ${m.name}`}>
                        <UserMinus />
                        <span className="hidden sm:inline">Remove</span>
                      </Button>
                    }
                    title={`Remove ${m.name} from this business?`}
                    description="Their account stays, but they will no longer be able to manage this business."
                    confirmLabel="Remove"
                    destructive
                    successMessage="Administrator removed"
                    action={() => removeMemberAction(businessId, m.userId)}
                  />
                </div>
              </li>
            ))}
            {invitations.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{i.email}</p>
                  <p className="text-sm text-muted-foreground">Invitation expires {i.expiresAt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status="PENDING" />
                  <ConfirmAction
                    trigger={
                      <Button size="sm" variant="ghost">
                        Revoke
                      </Button>
                    }
                    title="Revoke this invitation?"
                    description="The link will stop working immediately."
                    confirmLabel="Revoke"
                    destructive
                    successMessage="Invitation revoked"
                    action={() => revokeInvitationAction(businessId, i.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function DangerZone({ businessId, slug, status }: { businessId: string; slug: string; status: "ACTIVE" | "SUSPENDED" }) {
  const router = useRouter();
  const [confirmSlug, setConfirmSlug] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteBusinessAction(businessId, confirmSlug);
      if (applyResult(result, { success: "Business deleted" })) {
        setOpen(false);
        router.push("/admin/businesses");
      }
    });
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle>Danger zone</CardTitle>
        <CardDescription>Suspending blocks the dashboard and takes the website offline. Deleting is permanent.</CardDescription>
      </CardHeader>
      <CardFooter className="flex-wrap gap-2">
        <ConfirmAction
          trigger={
            <Button variant="outline">
              {status === "ACTIVE" ? <PauseCircle /> : <PlayCircle />}
              {status === "ACTIVE" ? "Suspend business" : "Activate business"}
            </Button>
          }
          title={status === "ACTIVE" ? "Suspend this business?" : "Activate this business?"}
          description={
            status === "ACTIVE"
              ? "Its administrators lose dashboard access and the website goes offline. You can reactivate it at any time."
              : "Administrators regain access and the website returns if it is published."
          }
          confirmLabel={status === "ACTIVE" ? "Suspend" : "Activate"}
          destructive={status === "ACTIVE"}
          successMessage={status === "ACTIVE" ? "Business suspended" : "Business activated"}
          action={() => setBusinessStatusAction(businessId, status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 /> Delete business
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this business permanently?</DialogTitle>
              <DialogDescription>
                This removes its products, categories, website, enquiries and uploaded images. Administrator accounts are kept.
                This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <Field id="confirm-slug" label={<>Type <code className="rounded bg-muted px-1">{slug}</code> to confirm</>}>
              <Input id="confirm-slug" value={confirmSlug} onChange={(e) => setConfirmSlug(e.target.value)} autoComplete="off" />
            </Field>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" disabled={confirmSlug !== slug || pending} onClick={remove}>
                {pending ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
