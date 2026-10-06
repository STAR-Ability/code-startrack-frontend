"use client";
import { useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { v012, type TeamInput } from "@/lib/api/v012";
import { ApiError } from "@/lib/api/errors";
import { keys } from "@/lib/query/keys";
import { isCurrentUser } from "@/lib/query/session";
import { compareInstants } from "@/lib/time";
import type { TeamDetailDto } from "@/lib/api/v012-schemas";
import { useLocale } from "@/components/layout/locale-provider";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "./feedback";
import { Panel, useCollaborationMutation } from "./v012-shared";
import { useWorkspaceSession } from "./account-provider";
const formSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string(),
  avatarUrl: z.union([z.literal(""), z.url({ protocol: /^https?$/ })]),
});
export function TeamForm({ team }: { team?: TeamDetailDto }) {
  const { t } = useLocale();
  const { data: user } = useWorkspaceSession();
  const client = useQueryClient();
  const id = useId();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: team?.name ?? "",
      description: team?.description ?? "",
      avatarUrl: team?.avatarUrl ?? "",
    },
  });
  const { reset } = form;
  useEffect(() => {
    reset({
      name: team?.name ?? "",
      description: team?.description ?? "",
      avatarUrl: team?.avatarUrl ?? "",
    });
  }, [reset, team?.updatedAt, team?.name, team?.description, team?.avatarUrl]);
  const mutation = useCollaborationMutation(
    team ? "team" : "create",
    async (input: TeamInput) => {
      const result = team
        ? await v012.updateTeam(team.teamId, input)
        : await v012.createTeam(input);
      if (team && user && isCurrentUser(client, user.publicId)) {
        const key = keys.team(user.publicId, team.teamId, "detail");
        const current = client.getQueryState<TeamDetailDto>(key);
        const denied =
          current?.error instanceof ApiError &&
          [401, 403, 404].includes(current.error.status);
        const newer =
          !!current?.data &&
          compareInstants(current.data.updatedAt, result.updatedAt) > 0;
        // Seed before invalidation so its read can replace this response, while
        // keeping confirmed settings when that read is temporarily unavailable.
        if (!denied && !newer) client.setQueryData(key, result);
      }
      return result;
    },
    team?.teamId,
    (result) => {
      if (!team) router.push(`/teams/detail?teamId=${result.teamId}`);
    },
  );
  const saved =
    mutation.isSuccess &&
    (!team ||
      (mutation.data.updatedAt === team.updatedAt && !form.formState.isDirty));
  return (
    <Panel
      className="team-form-panel"
      title={team ? "v12.editTeam" : "v12.createTeam"}
    >
      <form
        className="team-settings-form flex min-w-0 flex-col gap-4"
        onSubmit={form.handleSubmit((values) =>
          mutation.mutate({
            ...values,
            description: values.description || null,
            avatarUrl: values.avatarUrl || null,
          }),
        )}
      >
        <FieldGroup>
          {(["name", "description", "avatarUrl"] as const).map((key) => (
            <Field key={key} data-invalid={!!form.formState.errors[key]}>
              <FieldLabel htmlFor={`${id}-${key}`}>
                {t(`v12.${key}`)}
              </FieldLabel>
              {key === "description" ? (
                <Textarea
                  id={`${id}-${key}`}
                  {...form.register(key)}
                  aria-invalid={!!form.formState.errors[key]}
                  aria-describedby={
                    form.formState.errors[key]
                      ? `${id}-${key}-error`
                      : undefined
                  }
                  disabled={mutation.blocked}
                />
              ) : (
                <Input
                  id={`${id}-${key}`}
                  {...form.register(key)}
                  aria-invalid={!!form.formState.errors[key]}
                  aria-describedby={
                    form.formState.errors[key]
                      ? `${id}-${key}-error`
                      : undefined
                  }
                  disabled={mutation.blocked}
                />
              )}
              <FieldError id={`${id}-${key}-error`}>
                {form.formState.errors[key] && t("v.invalidForm")}
              </FieldError>
            </Field>
          ))}
        </FieldGroup>
        <Button
          wrap
          type="submit"
          className="self-start"
          disabled={mutation.blocked}
        >
          {t(team ? "v12.save" : "v12.createTeam")}
        </Button>
      </form>
      <ErrorNotice error={mutation.error} />
      {saved && <p role="status">{t("v12.saved")}</p>}
    </Panel>
  );
}
export function InviteForm({ teamId }: { teamId: string }) {
  const { t } = useLocale();
  const id = useId();
  const form = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: z.email() })),
    defaultValues: { email: "" },
  });
  const mutation = useCollaborationMutation(
    "invite",
    (email: string) => v012.invite(teamId, email),
    teamId,
    () => form.reset(),
  );
  return (
    <form
      className="team-invite-form flex min-w-0 flex-col gap-3"
      onSubmit={form.handleSubmit(({ email }) => mutation.mutate(email))}
    >
      <FieldGroup className="team-invite-fields grid min-w-0 items-end gap-3">
        <Field data-invalid={!!form.formState.errors.email}>
          <FieldLabel htmlFor={id}>{t("v12.email")}</FieldLabel>
          <Input
            id={id}
            type="email"
            autoComplete="email"
            {...form.register("email")}
            disabled={mutation.blocked}
            aria-invalid={!!form.formState.errors.email}
            aria-describedby={
              form.formState.errors.email ? `${id}-error` : undefined
            }
          />
          <FieldError id={`${id}-error`}>
            {form.formState.errors.email && t("v.invalidForm")}
          </FieldError>
        </Field>
        <Button
          wrap
          type="submit"
          className="justify-self-start"
          disabled={mutation.blocked}
        >
          {t("v12.invite")}
        </Button>
      </FieldGroup>
      <ErrorNotice error={mutation.error} />
      {mutation.isSuccess && (
        <StatusDelivery status={mutation.data.emailDeliveryStatus} />
      )}
    </form>
  );
}
function StatusDelivery({ status }: { status: string }) {
  const { t } = useLocale();
  return (
    <p role="status">
      {t("v12.delivery")}: {status}
    </p>
  );
}
