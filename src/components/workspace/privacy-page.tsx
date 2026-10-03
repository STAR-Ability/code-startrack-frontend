"use client";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v012 } from "@/lib/api/v012";
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
const privacyFormSchema = privacySchema.omit({ updatedAt: true });
export function PrivacyPage() {
  const query = useUserQuery("privacy", {}, (_id, signal) =>
    v012.privacy(signal),
  );
  return (
    <>
      <QueryFeedback query={query} />
      {query.data && (
        <PrivacyForm key={query.data.updatedAt} settings={query.data} />
      )}
    </>
  );
}
export function PrivacyForm({ settings }: { settings: PrivacySettingsDto }) {
  const { t } = useLocale();
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
  const mutation = useCollaborationMutation("privacy", v012.updatePrivacy);
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
      {mutation.isSuccess && <p role="status">{t("v12.saved")}</p>}
    </Panel>
  );
}
