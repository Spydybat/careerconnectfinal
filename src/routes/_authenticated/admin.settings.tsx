import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ANNOUNCEMENTS,
  APP_SETTINGS,
  FEATURE_FLAGS,
  SYSTEM_CONFIG,
  type Announcement,
} from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Platform settings — Career Connect admin" },
      {
        name: "description",
        content: "Feature flags, announcements and system configuration for Career Connect.",
      },
      { property: "og:title", content: "Platform settings — Career Connect admin" },
      {
        property: "og:description",
        content: "Roll features out safely, broadcast announcements and tune application settings.",
      },
    ],
  }),
  component: AdminSettings,
});

function AdminSettings() {
  const [flags, setFlags] = useState(() => FEATURE_FLAGS.map((f) => ({ ...f })));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => [...ANNOUNCEMENTS]);
  const [settings, setSettings] = useState(() => APP_SETTINGS.map((s) => ({ ...s })));
  const [system, setSystem] = useState(() => SYSTEM_CONFIG.map((s) => ({ ...s })));
  const [composeOpen, setComposeOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", body: "" });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Platform management"
        description="Feature rollout, broadcast messaging and application configuration."
      />

      <Tabs defaultValue="flags">
        <TabsList>
          <TabsTrigger value="flags">Feature flags</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="system">System configuration</TabsTrigger>
          <TabsTrigger value="config">Application settings</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="mt-4 space-y-3">
          {system.map((s) => (
            <div
              key={s.key}
              className="surface-card flex flex-wrap items-center justify-between gap-4 p-5"
            >
              <div className="min-w-56 flex-1">
                <h3 className="font-medium">{s.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                <code className="text-xs text-muted-foreground">{s.key}</code>
              </div>
              <Switch
                checked={s.enabled}
                onCheckedChange={(checked) => {
                  setSystem((prev) =>
                    prev.map((x) => (x.key === s.key ? { ...x, enabled: checked } : x)),
                  );
                  toast.success(`${s.label} ${checked ? "enabled" : "disabled"}`);
                }}
              />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="flags" className="mt-4 space-y-3">
          {flags.map((flag) => (
            <div
              key={flag.key}
              className="surface-card flex flex-wrap items-center justify-between gap-4 p-5"
            >
              <div className="min-w-56 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{flag.label}</h3>
                  <Badge variant="outline">{flag.rollout}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{flag.description}</p>
                <code className="text-xs text-muted-foreground">{flag.key}</code>
              </div>
              <Switch
                checked={flag.enabled}
                onCheckedChange={(checked) => {
                  setFlags((prev) =>
                    prev.map((f) => (f.key === flag.key ? { ...f, enabled: checked } : f)),
                  );
                  toast.success(`${flag.label} ${checked ? "enabled" : "disabled"}`);
                }}
              />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="announcements" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setComposeOpen(true)}>
              <Megaphone className="size-4" /> New announcement
            </Button>
          </div>
          {announcements.length === 0 ? (
            <p className="surface-card p-10 text-center text-sm text-muted-foreground">
              No announcements yet.
            </p>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="surface-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium">{a.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{a.audience}</Badge>
                    <Badge variant={a.status === "published" ? "default" : "outline"}>
                      {a.status}
                    </Badge>
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">{a.publishedAt}</p>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <div className="surface-card grid gap-4 p-6 md:grid-cols-2">
            {settings.map((s) => (
              <div key={s.key} className="space-y-1.5">
                <Label>{s.label}</Label>
                <Input
                  value={s.value}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev.map((x) => (x.key === s.key ? { ...x, value: e.target.value } : x)),
                    )
                  }
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <Button onClick={() => toast.success("Configuration saved")}>
                Save configuration
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New announcement</DialogTitle>
            <DialogDescription>Broadcast a message to everyone on the platform.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                rows={4}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!draft.title.trim()}
              onClick={() => {
                setAnnouncements((prev) => [
                  {
                    id: `an-${Date.now()}`,
                    title: draft.title.trim(),
                    body: draft.body.trim(),
                    audience: "All users",
                    status: "published",
                    publishedAt: new Date().toISOString().slice(0, 10),
                  },
                  ...prev,
                ]);
                setDraft({ title: "", body: "" });
                setComposeOpen(false);
                toast.success("Announcement published");
              }}
            >
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
