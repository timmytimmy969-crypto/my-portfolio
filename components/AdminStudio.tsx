"use client";

import { useEffect, useState } from "react";
import type { PortfolioData, Folder, Project } from "@/lib/types";

const blank: PortfolioData = {
  profile: { name: "", title: "", bio: "", about: "", email: "", skills: [], socials: {}, cvVisible: false },
  folders: [],
  projects: [],
  settings: { metaDescription: "", showContact: true },
};

type MediaItem = {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  used: boolean;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = units[0];
  for (let i = 1; i < units.length && value >= 1024; i++) {
    value /= 1024;
    unit = units[i];
  }
  return `${value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${unit}`;
}

function mediaKind(pathname: string) {
  const p = pathname.toLowerCase();
  if (/\.(mp4|webm|mov|m4v)$/.test(p)) return "video";
  if (/\.(jpg|jpeg|png|webp|avif|gif)$/.test(p)) return "image";
  if (p.endsWith(".pdf")) return "pdf";
  return "file";
}

function mediaName(pathname: string) {
  const filename = pathname.split("/").pop() || pathname;
  return filename.replace(/^[0-9a-f-]{36}-/i, "");
}

export default function AdminStudio() {
  const [data, setData] = useState<PortfolioData>(blank);
  const [slug, setSlug] = useState("");
  const [message, setMessage] = useState("Loading studio…");
  const [tab, setTab] = useState("content");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [totalBytes, setTotalBytes] = useState(0);
  const [mediaLoading, setMediaLoading] = useState(false);

  useEffect(() => {
    fetch("/api/cms")
      .then((r) => r.json())
      .then((x) => {
        setData(x.draft);
        setSlug(x.slug);
        setMessage("");
      });
  }, []);

  const loadMedia = async () => {
    setMediaLoading(true);
    try {
      const r = await fetch("/api/media", { cache: "no-store" });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Could not load media library.");
      setMedia(body.media || []);
      setTotalBytes(body.totalBytes || 0);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load media library.");
    } finally {
      setMediaLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "media") loadMedia();
  }, [tab]);

  const update = (path: string, value: unknown) => setData((d) => ({ ...d, profile: { ...d.profile, [path]: value } }));

  const save = async () => {
    const r = await fetch("/api/cms", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setMessage(r.ok ? "Draft saved — your live portfolio is unchanged." : (await r.json()).error);
  };

  const publish = async () => {
    if (!confirm("You are about to publish your draft. Continue?")) return;
    const r = await fetch("/api/cms/publish", { method: "POST" });
    setMessage(r.ok ? "Portfolio published successfully." : "Publishing failed. Please try again.");
  };

  const addFolder = () => setData((d) => ({ ...d, folders: [...d.folders, { id: crypto.randomUUID(), name: "New folder", hidden: false, order: d.folders.length }] }));
  const addProject = (folderId: string) => setData((d) => ({ ...d, projects: [...d.projects, { id: crypto.randomUUID(), folderId, title: "Untitled project", summary: "", client: "", year: "", role: "", thumbnail: "", videoUrl: "", featured: false, visible: true, order: d.projects.length }] }));
  const upFolder = (id: string, key: keyof Folder, v: string | boolean) => setData((d) => ({ ...d, folders: d.folders.map((x) => (x.id === id ? { ...x, [key]: v } : x)) }));
  const upProject = (id: string, key: keyof Project, v: string | boolean | number) => setData((d) => ({ ...d, projects: d.projects.map((x) => (x.id === id ? { ...x, [key]: v } : x)) }));

  const upload = async (file: File, projectId?: string, kind?: "thumbnail" | "video" | "hero" | "cv") => {
    setMessage("Preparing upload…");
    try {
      const r = await fetch("/api/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, contentType: file.type }) });
      const setup = await r.json();
      if (!r.ok) throw new Error(setup.error || "Could not prepare upload.");
      setMessage("Uploading…");
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.open("PUT", setup.presignedUrl);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setMessage(`Uploading… ${Math.round((e.loaded / e.total) * 100)}%`);
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.responseText || `Upload failed (${xhr.status}).`)));
        xhr.onerror = () => reject(new Error("Upload failed. Please try again."));
        xhr.send(file);
      });
      setMessage("Verifying upload…");
      const verify = await fetch("/api/upload-complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pathname: setup.pathname }) });
      const verified = await verify.json();
      if (!verify.ok) throw new Error(verified.error || "Upload verification failed.");
      const canonicalUrl = verified.url;
      if (!canonicalUrl) throw new Error("Upload completed but no public URL was returned.");
      if (projectId) upProject(projectId, kind === "video" ? "videoUrl" : "thumbnail", canonicalUrl);
      else update(kind === "cv" ? "cvUrl" : "heroImage", canonicalUrl);
      setMessage("Upload complete. Save draft to keep it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed. Please try again.");
    }
  };

  const deleteMedia = async (item: MediaItem) => {
    if (item.used) {
      setMessage("That file is currently used in your draft or published portfolio, so it cannot be deleted yet.");
      return;
    }
    if (!confirm(`Delete ${mediaName(item.pathname)} permanently? This cannot be undone.`)) return;

    setMessage("Deleting media…");
    try {
      const r = await fetch("/api/media", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: item.url }) });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Could not delete media.");
      setMessage("Media deleted. Storage space has been freed.");
      await loadMedia();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete media.");
    }
  };

  const heading = tab === "content" ? "Portfolio content" : tab === "work" ? "Work library" : tab === "media" ? "Media library" : "Portfolio settings";

  return (
    <main className="studio">
      <aside>
        <a className="brand">FRAME<span>·</span></a>
        <p>PRIVATE STUDIO</p>
        {["content", "work", "media", "settings"].map((x) => (
          <button className={tab === x ? "active" : ""} onClick={() => setTab(x)} key={x}>{x === "media" ? "Media Library" : x}</button>
        ))}
        <div className="side-bottom">
          <a href={`/portfolio/${slug}`} target="_blank">Share portfolio ↗</a>
          <button onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => (location.href = "/admin/login"))}>Sign out</button>
        </div>
      </aside>

      <section className="admin-main">
        <header>
          <div><p className="eyebrow">Draft workspace</p><h1>{heading}</h1></div>
          <div className="actions"><a className="button secondary" href="/admin/preview" target="_blank">Preview</a><button className="button" onClick={publish}>Publish</button></div>
        </header>

        {message && <div className="notice">{message}</div>}

        {tab === "content" && <div className="editor-grid">
          <Field label="Name" value={data.profile.name} onChange={(v) => update("name", v)} />
          <Field label="Professional title" value={data.profile.title} onChange={(v) => update("title", v)} />
          <Field label="Email" value={data.profile.email} onChange={(v) => update("email", v)} />
          <Field label="Hero statement" value={data.profile.bio} onChange={(v) => update("bio", v)} area />
          <Field label="About" value={data.profile.about} onChange={(v) => update("about", v)} area />
          <Upload label="Hero image" accept="image/*" onFile={(f) => upload(f, undefined, "hero")} />
          <Upload label="CV (PDF)" accept="application/pdf" onFile={(f) => upload(f, undefined, "cv")} />
        </div>}

        {tab === "work" && <div>
          <button className="add" onClick={addFolder}>+ Add folder</button>
          {data.folders.map((f) => <section className="folder-edit" key={f.id}>
            <div className="folder-head">
              <input value={f.name} onChange={(e) => upFolder(f.id, "name", e.target.value)} />
              <label><input type="checkbox" checked={!f.hidden} onChange={(e) => upFolder(f.id, "hidden", !e.target.checked)} /> Visible</label>
              <button onClick={() => confirm("Delete this folder and its projects?") && setData((d) => ({ ...d, folders: d.folders.filter((x) => x.id !== f.id), projects: d.projects.filter((x) => x.folderId !== f.id) }))}>Delete</button>
            </div>
            {data.projects.filter((x) => x.folderId === f.id).map((p) => <div className="project-edit" key={p.id}>
              <Field label="Title" value={p.title} onChange={(v) => upProject(p.id, "title", v)} />
              <Field label="Role" value={p.role || ""} onChange={(v) => upProject(p.id, "role", v)} />
              <Field label="Summary" value={p.summary} onChange={(v) => upProject(p.id, "summary", v)} area />
              <Upload label="Thumbnail" accept="image/*" onFile={(file) => upload(file, p.id, "thumbnail")} />
              <Upload label="Video" accept="video/mp4,video/webm" onFile={(file) => upload(file, p.id, "video")} />
              <button onClick={() => confirm("Delete this project?") && setData((d) => ({ ...d, projects: d.projects.filter((x) => x.id !== p.id) }))}>Delete project</button>
            </div>)}
            <button className="add small" onClick={() => addProject(f.id)}>+ Add work</button>
          </section>)}
        </div>}

        {tab === "media" && <div className="media-library">
          <div className="storage-summary">
            <div><span>Storage used</span><strong>{formatBytes(totalBytes)}</strong></div>
            <div><span>Files</span><strong>{media.length}</strong></div>
            <div><span>Unused files</span><strong>{media.filter((item) => !item.used).length}</strong></div>
            <button className="secondary" onClick={loadMedia} disabled={mediaLoading}>{mediaLoading ? "Refreshing…" : "Refresh"}</button>
          </div>
          <p className="media-help">Only you can see this library. Files marked <strong>In use</strong> are protected from deletion because they appear in your draft or published portfolio.</p>
          {mediaLoading && media.length === 0 ? <div className="media-empty">Loading your uploads…</div> : media.length === 0 ? <div className="media-empty">No uploaded media found.</div> : <div className="media-grid">
            {media.map((item) => {
              const kind = mediaKind(item.pathname);
              return <article className="media-card" key={item.url}>
                <div className="media-preview">
                  {kind === "image" ? <img src={item.url} alt="" /> : kind === "video" ? <video src={item.url} preload="metadata" muted /> : <div className="media-file-icon">{kind.toUpperCase()}</div>}
                </div>
                <div className="media-info">
                  <strong title={mediaName(item.pathname)}>{mediaName(item.pathname)}</strong>
                  <p>{formatBytes(item.size)} · {new Date(item.uploadedAt).toLocaleDateString()}</p>
                  <div className="media-row">
                    <span className={item.used ? "media-status used" : "media-status unused"}>{item.used ? "In use" : "Unused"}</span>
                    <button className="media-delete" disabled={item.used} onClick={() => deleteMedia(item)}>{item.used ? "Protected" : "Delete"}</button>
                  </div>
                </div>
              </article>;
            })}
          </div>}
        </div>}

        {tab === "settings" && <div className="editor-grid">
          <Field label="Public URL slug" value={slug} onChange={() => {}} disabled />
          <Field label="SEO description" value={data.settings.metaDescription} onChange={(v) => setData((d) => ({ ...d, settings: { ...d.settings, metaDescription: v } }))} area />
          <label className="check"><input type="checkbox" checked={data.profile.cvVisible} onChange={(e) => update("cvVisible", e.target.checked)} /> Show CV publicly</label>
          <p className="share">Your public portfolio<br /><strong>{typeof window !== "undefined" && location.origin}/portfolio/{slug}</strong></p>
        </div>}

        {tab !== "media" && <button className="save" onClick={save}>Save draft</button>}
      </section>
    </main>
  );
}

function Field({ label, value, onChange, area, disabled }: { label: string; value: string; onChange: (v: string) => void; area?: boolean; disabled?: boolean }) {
  return <label className="field">{label}{area ? <textarea value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} /> : <input value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />}</label>;
}

function Upload({ label, accept, onFile }: { label: string; accept: string; onFile: (f: File) => void }) {
  return <label className="upload">{label}<input type="file" accept={accept} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} /></label>;
}
