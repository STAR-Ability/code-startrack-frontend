"use client";
import { useEffect, useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { v012 } from "@/lib/api/v012";
import { ApiError } from "@/lib/api/errors";
import { keys } from "@/lib/query/keys";
import { isCurrentUser } from "@/lib/query/session";
import {
  privacySchema,
  privacyScopes,
  type PrivacySettingsDto,
} from "@/lib/api/v012-schemas";
import { useLocale } from "@/components/layout/locale-provider";
import { Field, FieldLabel } from "@/components/ui/field";
import { ChoiceSelect } from "@/components/ui/choice-select";
import { Button } from "@/components/ui/button";
import { Panel, useCollaborationMutation } from "./v012-shared";
import { useUserQuery } from "./use-user-query";
import { ErrorNotice, QueryFeedback } from "./feedback";
import { useWorkspaceSession } from "./account-provider";
const privacyFormSchema = privacySchema.omit({ updatedAt: true });
export function PrivacyPage() {
  const { data: user } = useWorkspaceSession();
  const query = useUserQuery("privacy", {}, (_id, signal) =>
    v012.privacy(signal),
  );
  return (
    <>
      <QueryFeedback query={query} />
      {query.data && <PrivacyForm key={user?.publicId} settings={query.data} />}
    </>
  );
}
export function PrivacyForm({ settings }: { settings: PrivacySettingsDto }) {
  const { t } = useLocale();
  const { data: user } = useWorkspaceSession();
  const client = useQueryClient();
  const id = useId();
  const form = useForm<Omit<PrivacySettingsDto, "updatedAt">>({
    resolver: zodResolver(privacyFormSchema),
    defaultValues: {
      basicTraining: settings.basicTraining,
      abilityProfile: settings.abilityProfile,
      detailedSubmissions: settings.detailedSubmissions,
      analysisReport: settings.analysisReport,
    },
  });
  const { reset } = form;
  useEffect(() => {
    reset({
      basicTraining: settings.basicTraining,
      abilityProfile: settings.abilityProfile,
      detailedSubmissions: settings.detailedSubmissions,
      analysisReport: settings.analysisReport,
    });
  }, [
    reset,
    settings.updatedAt,
    settings.basicTraining,
    settings.abilityProfile,
    settings.detailedSubmissions,
    settings.analysisReport,
  ]);
  const mutation = useCollaborationMutation(
    "privacy",
    async (values: Omit<PrivacySettingsDto, "updatedAt">) => {
      const result = await v012.updatePrivacy(values);
      if (user && isCurrentUser(client, user.publicId)) {
        const key = keys.userResource(user.publicId, "privacy");
        const current = client.getQueryState<PrivacySettingsDto>(key);
        const denied =
          current?.error instanceof ApiError &&
          [401, 403, 404].includes(current.error.status);
        const newer =
          !!current?.data &&
          Date.parse(current.data.updatedAt) > Date.parse(result.updatedAt);
        // Retain the validated write if the following read fails. A later read
        // still owns the cache; a newer revision or denial must remain intact.
        if (!denied && !newer) client.setQueryData(key, result);
      }
      return result;
    },
  );
  const saved =
    mutation.isSuccess &&
    mutation.data.updatedAt === settings.updatedAt &&
    !form.formState.isDirty;
  return (
    <Panel title="v12.privacyControls" description={t("v12.privacyNote")}>
      <form
        className="grid gap-5 md:grid-cols-2"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        {(
          [
            "basicTraining",
            "abilityProfile",
            "detailedSubmissions",
            "analysisReport",
          ] as const
        ).map((key) => (
          <Field key={key} className="rounded-xl border bg-muted/30 p-4">
            <FieldLabel htmlFor={`${id}-${key}`}>{t(`v12.${key}`)}</FieldLabel>
            <Controller
              name={key}
              control={form.control}
              render={({ field, fieldState }) => (
                <ChoiceSelect
                  id={`${id}-${key}`}
                  value={field.value}
                  name={field.name}
                  onBlur={field.onBlur}
                  onValueChange={field.onChange}
                  aria-invalid={!!fieldState.error}
                  disabled={mutation.blocked}
                  options={privacyScopes.map((value) => ({
                    value,
                    label: t(`v12.scope.${value}`),
                  }))}
                />
              )}
            />
          </Field>
        ))}
        <Button
          wrap
          className="self-start"
          type="submit"
          disabled={mutation.blocked || !form.formState.isDirty}
        >
          {t("v12.save")}
        </Button>
      </form>
      <ErrorNotice error={mutation.error} />
      {saved && <p role="status">{t("v12.saved")}</p>}
    </Panel>
  );
}
