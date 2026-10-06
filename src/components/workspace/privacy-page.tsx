"use client";
import { useEffect, useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { v012 } from "@/lib/api/v012";
import { ApiError } from "@/lib/api/errors";
import { keys } from "@/lib/query/keys";
import { isCurrentUser } from "@/lib/query/session";
import { compareInstants } from "@/lib/time";
import {
  privacySchema,
  privacyScopes,
  type PrivacySettingsDto,
} from "@/lib/api/v012-schemas";
import { useLocale } from "@/components/layout/locale-provider";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { ChoiceSelect } from "@/components/ui/choice-select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
          compareInstants(current.data.updatedAt, result.updatedAt) > 0;
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
    <Panel
      title="v12.privacyControls"
      description={t("v12.privacyNote")}
      className="privacy-panel @container/privacy"
    >
      <form
        className="privacy-form flex min-w-0 flex-col gap-4"
        aria-busy={mutation.isPending || undefined}
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <FieldGroup className="privacy-scope-list gap-0">
          {(
            [
              "basicTraining",
              "abilityProfile",
              "detailedSubmissions",
              "analysisReport",
            ] as const
          ).map((key) => (
            <Field
              key={key}
              className="privacy-scope-row grid min-w-0"
              data-disabled={mutation.blocked || undefined}
              data-invalid={!!form.formState.errors[key] || undefined}
            >
              <FieldContent className="privacy-scope-copy min-w-0">
                <FieldLabel htmlFor={`${id}-${key}`}>
                  {t(`v12.${key}`)}
                </FieldLabel>
                <FieldDescription id={`${id}-${key}-description`}>
                  {t(`privacy.${key}Description`)}
                </FieldDescription>
              </FieldContent>
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
                    aria-describedby={`${id}-${key}-description`}
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
        </FieldGroup>
        <div className="privacy-save-row flex flex-wrap items-center gap-3">
          <Button
            wrap
            type="submit"
            disabled={mutation.blocked || !form.formState.isDirty}
          >
            {mutation.isPending && (
              <Spinner data-icon="inline-start" aria-hidden="true" />
            )}
            {t("v12.save")}
          </Button>
          {mutation.isPending && (
            <p role="status" className="text-sm text-muted-foreground">
              {t("privacy.saving")}
            </p>
          )}
          {saved && (
            <p role="status" className="text-sm text-muted-foreground">
              {t("v12.saved")}
            </p>
          )}
        </div>
      </form>
      <ErrorNotice error={mutation.error} />
    </Panel>
  );
}
